import { Request, Response } from 'express';
import stringify from 'json-stringify-safe';
import { logger } from '../utils/logger';
import { SetKeywordsRequestBody } from './admin.types';
import { TweetStream } from '../tweet-stream';

export async function setKeywordsHandler(
  req: Request<unknown, unknown, SetKeywordsRequestBody>,
  res: Response
) {
  const { keywords } = req.body;
  try {
    logger.info(`Setting keywords for Twitter stream: ${keywords}`);
    await TweetStream.getInstance().setStreamKeywords(keywords);
    logger.info(`Set keywords for Twitter stream successfully`);
    res.send({ message: 'keywords updated' });
  } catch (exception) {
    logger.info(`failed to set keywords`, {
      exception: stringify(exception),
    });
    return res.status(500).json({
      error: `failed to set keywords`,
    });
  }
}

export function enableMonitoringHandler(_req: Request, res: Response) {
  TweetStream.getInstance().start();
  res.send({
    message: 'Enabling monitoring. Check stream status for details',
  });
}

export function disableMonitoringHandler(_req: Request, res: Response) {
  TweetStream.getInstance().stop();
  res.send({
    message: 'Disabling monitoring. Check stream status for details',
  });
}

export function streamStatusHandler(_req: Request, res: Response) {
  res.send(TweetStream.getInstance().status);
}
