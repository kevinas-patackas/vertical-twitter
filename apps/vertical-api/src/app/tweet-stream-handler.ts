import { TweetStream } from './tweet-stream';
import { TwitterStreamItem } from '@vertical-twitter/types';
import { logger } from './utils/logger';
import { sendSqsMessage } from './utils/sqs';
import config from './config';
import stringify from 'json-stringify-safe';

export function initializeTweetStreamReader() {
  const tweetStream = new TweetStream(config.TWITTER_TOKEN);
  tweetStream.events.on('data', handleTweetStreamMessages);
}

export async function handleTweetStreamMessages(data: string) {
  try {
    const parsed: TwitterStreamItem = JSON.parse(data);
    logger.info(`received new Tweet: ${parsed.data.id}`);

    logger.info('Sending tweet to SQS queue', { event: parsed });
    await sendSqsMessage(config.SQS_QUEUE_URL, JSON.stringify(parsed));
    logger.info('Successfully sending tweet to SQS queue', { event: parsed });
  } catch (exception) {
    logger.error('Failed to process Tweet Stream message', {
      exception: stringify(exception),
    });
  }
}
