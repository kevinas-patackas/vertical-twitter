/* eslint-disable @typescript-eslint/no-explicit-any */
import config from './config';
import * as fromTweetStream from './tweet-stream';
import {
  initializeTweetStreamReader,
  handleTweetStreamMessages,
} from './tweet-stream-handler';

jest.mock('./utils/logger', () => {
  return {
    logger: {
      info: jest.fn(),
    },
  };
});

jest.mock('./tweet-stream', () => {
  const mock = {
    events: {
      on: jest.fn(),
    },
  };

  return {
    TweetStream: jest.fn().mockImplementation(() => mock),
    mock,
  };
});

describe('tweet-stream-handler', () => {
  const tweetStreamMock = (fromTweetStream as any).mock;

  beforeAll(() => {
    config.TWITTER_TOKEN = 'fake-twitter-token';
    config.SQS_QUEUE_URL = 'sqs-queue-url';
  });

  describe('initializeTweetStreamReader', () => {
    beforeAll(() => {
      jest.clearAllMocks();
      initializeTweetStreamReader();
    });

    it('should create TweetStream instance', () => {
      expect(fromTweetStream.TweetStream).toHaveBeenCalled();
    });

    it('should attach listener to TweetStream "data" events', () => {
      expect(tweetStreamMock.events.on).toHaveBeenCalledWith(
        'data',
        handleTweetStreamMessages
      );
    });
  });
});
