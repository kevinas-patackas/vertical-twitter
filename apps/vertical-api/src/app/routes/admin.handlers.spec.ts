import { Request, Response } from 'express';
import {
  disableMonitoringHandler,
  enableMonitoringHandler,
  setKeywordsHandler,
  streamStatusHandler,
} from './admin.handlers';
import { TweetStream } from '../tweet-stream';
import { logger } from '../utils/logger';

jest.mock('../utils/logger', () => {
  return {
    logger: {
      info: jest.fn(),
    },
  };
});

jest.mock('../tweet-stream', () => {
  const mock = {
    start: jest.fn(),
    stop: jest.fn(),
    setStreamKeywords: jest.fn(),
    status: {
      connecting: false,
      connected: true,
    },
  };

  return {
    TweetStream: {
      getInstance: () => mock,
    },
  };
});

describe('admin handlers', () => {
  const tweetStream = TweetStream.getInstance();

  describe('setKeywordsHandler', () => {
    describe('successfully updated keywords', () => {
      let mockResponse: Partial<Response>;

      beforeAll(async () => {
        jest.clearAllMocks();
        mockResponse = {
          send: jest.fn().mockReturnThis(),
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockReturnThis(),
        };

        const req: Partial<Request> = {
          method: 'PUT',
          url: '/example',
          body: {
            keywords: 'some keywords',
          },
        };

        await setKeywordsHandler(req as Request, mockResponse as Response);
      });

      it('should log info messages', () => {
        expect((logger.info as jest.Mock).mock.calls.map((i) => i[0]))
          .toMatchInlineSnapshot(`
          [
            "Setting keywords for Twitter stream: some keywords",
            "Set keywords for Twitter stream successfully",
          ]
        `);
      });

      it('should start TweetStream', () => {
        expect(tweetStream.setStreamKeywords).toHaveBeenCalledTimes(1);
      });

      it('should send response', () => {
        expect(mockResponse.send).toHaveBeenCalledWith({
          message: 'keywords updated',
        });
      });
    });

    describe('TweetStream.setStreamKeywords throws error', () => {
      let mockResponse: Partial<Response>;

      beforeAll(async () => {
        jest.clearAllMocks();
        mockResponse = {
          send: jest.fn().mockReturnThis(),
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockReturnThis(),
        };

        const req: Partial<Request> = {
          method: 'PUT',
          url: '/example',
          body: {
            keywords: 'some keywords',
          },
        };

        (tweetStream.setStreamKeywords as jest.Mock).mockRejectedValueOnce(
          'ERROR'
        );

        await setKeywordsHandler(req as Request, mockResponse as Response);
      });

      it('should log info messages', () => {
        expect((logger.info as jest.Mock).mock.calls.map((i) => i[0]))
          .toMatchInlineSnapshot(`
          [
            "Setting keywords for Twitter stream: some keywords",
            "failed to set keywords",
          ]
        `);
      });

      it('should send status 500', () => {
        expect(mockResponse.status).toHaveBeenCalledWith(500);
      });
    });
  });

  describe('enableMonitoringHandler', () => {
    let mockResponse: Partial<Response>;

    beforeAll(() => {
      jest.clearAllMocks();
      mockResponse = {
        send: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const req: Partial<Request> = {
        method: 'POST',
        url: '/example',
      };

      enableMonitoringHandler(req as Request, mockResponse as Response);
    });

    it('should start TweetStream', () => {
      expect(tweetStream.start).toHaveBeenCalledTimes(1);
    });

    it('should send response', () => {
      expect(mockResponse.send).toHaveBeenCalledWith({
        message: 'Enabling monitoring. Check stream status for details',
      });
    });
  });

  describe('disableMonitoringHandler', () => {
    let mockResponse: Partial<Response>;

    beforeAll(() => {
      jest.clearAllMocks();
      mockResponse = {
        send: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const req: Partial<Request> = {
        method: 'POST',
        url: '/example',
      };

      disableMonitoringHandler(req as Request, mockResponse as Response);
    });

    it('should start TweetStream', () => {
      expect(tweetStream.stop).toHaveBeenCalledTimes(1);
    });

    it('should send response', () => {
      expect(mockResponse.send).toHaveBeenCalledWith({
        message: 'Disabling monitoring. Check stream status for details',
      });
    });
  });

  describe('streamStatusHandler', () => {
    let mockResponse: Partial<Response>;

    beforeAll(() => {
      jest.clearAllMocks();
      mockResponse = {
        send: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const req: Partial<Request> = {
        method: 'POST',
        url: '/example',
      };

      streamStatusHandler(req as Request, mockResponse as Response);
    });

    it('should send response with current status', () => {
      expect(mockResponse.send).toHaveBeenCalledWith({
        connecting: false,
        connected: true,
      });
    });
  });
});
