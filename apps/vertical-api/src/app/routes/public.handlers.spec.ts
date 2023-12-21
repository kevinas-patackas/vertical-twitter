/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { monitorStreamHandler } from './public.handlers';
import { logger } from '../utils/logger';
import { TweetStream } from '../tweet-stream';
import EventEmitter from 'events';

jest.mock('../utils/logger', () => {
  return {
    logger: {
      info: jest.fn(),
    },
  };
});

jest.mock('uuid', () => {
  return {
    v4: jest.fn().mockReturnValue('random-uuid-generated'),
  };
});

jest.mock('../tweet-stream', () => {
  return {
    TweetStream: {
      getInstance: jest.fn(),
    },
  };
});

describe('public handlers', () => {
  describe('monitorStreamHandler', () => {
    let tweetStreamEventEmitter: EventEmitter;
    let spyTweetStreamEventsOn: jest.SpyInstance;
    const tweetStreamMock = {
      start: jest.fn(),
      stop: jest.fn(),
    };

    let responseCloseCallback;
    let mockResponse: Partial<Response>;

    beforeAll(() => {
      jest.clearAllMocks();

      tweetStreamEventEmitter = new EventEmitter();
      spyTweetStreamEventsOn = jest.spyOn(tweetStreamEventEmitter, 'on');
      (TweetStream.getInstance as unknown as jest.Mock).mockReturnValue({
        ...tweetStreamMock,
        events: tweetStreamEventEmitter,
      });

      mockResponse = {
        send: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        setHeader: jest.fn().mockReturnThis(),
        write: jest.fn().mockReturnThis(),
        end: jest.fn().mockReturnThis(),
        on: jest
          .fn()
          .mockImplementation((_eventName: string, callback: () => void) => {
            responseCloseCallback = callback;
          }),
      };

      const req: Partial<Request> = {
        method: 'POST',
        url: '/example',
      };

      monitorStreamHandler(req as Request, mockResponse as Response);
    });

    it('should set correct headers', () => {
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/event-stream'
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Cache-Control',
        'no-cache'
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Connection',
        'keep-alive'
      );
    });

    it('should log info about connected client', () => {
      expect(logger.info).toHaveBeenCalledWith(
        'Client connected: random-uuid-generated'
      );
    });

    it('should write initial connected message to response', () => {
      expect(mockResponse.write).toHaveBeenCalledWith('data: connected\n\n');
    });

    it('should attach new event listener to tweetStream.events', () => {
      expect(spyTweetStreamEventsOn).toHaveBeenCalledWith(
        'data',
        expect.anything()
      );
    });

    describe('new data event emitted by Tweet Stream', () => {
      const expectedMessage = '{ test: "test" }\n';

      beforeAll(() => {
        tweetStreamEventEmitter.emit('data', expectedMessage);
      });

      it('should log info about sending message to client', () => {
        expect(logger.info).toHaveBeenCalledWith(
          'Sending message to client: random-uuid-generated'
        );
      });

      it('should write message to response', () => {
        expect(mockResponse.write).toHaveBeenCalledWith(expectedMessage);
      });
    });

    describe('connection closes', () => {
      beforeAll(() => {
        responseCloseCallback();
      });

      it('should log info about disconnected client', () => {
        expect(logger.info).toHaveBeenCalledWith(
          'Client disconnected: random-uuid-generated'
        );
      });

      it('should call end() on response', () => {
        expect(mockResponse.end).toHaveBeenCalled();
      });
    });
  });
});
