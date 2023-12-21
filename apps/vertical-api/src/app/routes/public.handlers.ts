import { Request, Response } from 'express';
import stringify from 'json-stringify-safe';
import { v4 as uuid } from 'uuid';
import config from '../config';
import { TweetStream } from '../tweet-stream';
import { scanWholeDynamoTable } from '../utils/dynamo';
import { logger } from '../utils/logger';

export function monitorStreamHandler(_req: Request, res: Response) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const clientId = uuid();
  logger.info(`Client connected: ${clientId}`);
  res.write('data: connected\n\n');

  const tweetStream = TweetStream.getInstance();

  const sendEventsToConnection = (data: string) => {
    logger.info(`Sending message to client: ${clientId}`);
    res.write(data);
  };
  tweetStream.events.on('data', sendEventsToConnection);

  res.on('close', () => {
    logger.info(`Client disconnected: ${clientId}`);
    tweetStream.events.removeListener('data', sendEventsToConnection);
    res.end();
  });
}

export async function processedTweetsHandler(_req: Request, res: Response) {
  try {
    logger.info('Scanning processed tweets table');
    const scanResult = await scanWholeDynamoTable(
      config.PROCESSED_TWEETS_TABLE
    );
    logger.info('Successfully scanned processed tweets table');
    res.send({ items: scanResult.Items });
  } catch (exception) {
    logger.error('Failed to scan processed tweets table', {
      exception: stringify(exception),
    });
    res.status(500).send({ error: 'failed to get processed' });
  }
}
