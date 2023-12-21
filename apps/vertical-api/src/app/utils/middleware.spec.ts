import { Request, Response } from 'express';
import { logger } from './logger';
import {
  authorizationMiddleware,
  loggerMiddleware,
  validateRequestBodyMiddleware,
} from './middleware';
import config from '../config';

jest.mock('./logger', () => {
  return {
    logger: {
      info: jest.fn(),
    },
  };
});

describe('middleware', () => {
  describe('loggerMiddleware', () => {
    let nextMock: jest.Mock;

    beforeAll(() => {
      nextMock = jest.fn();

      const req: Partial<Request> = {
        method: 'GET',
        url: '/example',
      };

      loggerMiddleware(req as Request, {} as Response, nextMock);
    });

    it('should log called endpoint', () => {
      expect(logger.info).toHaveBeenCalledWith('GET /example');
    });

    it('should call next() function', () => {
      expect(nextMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('authorizationMiddleware', () => {
    describe('valid token in headers', () => {
      let nextMock: jest.Mock;
      let mockResponse: Partial<Response>;
      let initialVerticalApiToken: string;

      beforeAll(() => {
        initialVerticalApiToken = config.VERTICAL_API_TOKEN;
        config.VERTICAL_API_TOKEN = 'token-for-test';

        nextMock = jest.fn();
        mockResponse = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockReturnThis(),
        };

        const req: Partial<Request> = {
          method: 'GET',
          url: '/example',
          headers: {
            authorization: 'Bearer token-for-test',
          },
        };

        authorizationMiddleware(
          req as Request,
          mockResponse as Response,
          nextMock
        );
      });

      afterAll(() => {
        config.VERTICAL_API_TOKEN = initialVerticalApiToken;
      });

      it('should call next() function', () => {
        expect(nextMock).toHaveBeenCalledTimes(1);
      });
    });

    describe('invalid token in headers', () => {
      let nextMock: jest.Mock;
      let mockResponse: Partial<Response>;
      let initialVerticalApiToken: string;

      beforeAll(() => {
        initialVerticalApiToken = config.VERTICAL_API_TOKEN;
        config.VERTICAL_API_TOKEN = 'token-for-test';

        nextMock = jest.fn();
        mockResponse = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockReturnThis(),
        };

        const req: Partial<Request> = {
          method: 'GET',
          url: '/example',
          headers: {
            authorization: 'Bearer WRONG-TOKEN',
          },
        };

        authorizationMiddleware(
          req as Request,
          mockResponse as Response,
          nextMock
        );
      });

      afterAll(() => {
        config.VERTICAL_API_TOKEN = initialVerticalApiToken;
      });

      it('should not call next() function', () => {
        expect(nextMock).not.toHaveBeenCalled();
      });

      it('should return status 401', () => {
        expect(mockResponse.status).toHaveBeenCalledWith(401);
      });

      it('should return error message', () => {
        expect(mockResponse.json).toHaveBeenCalledWith({
          error: 'Unauthorized',
        });
      });
    });
  });

  describe('validateRequestBodyMiddleware', () => {
    describe('all fields are present', () => {
      let nextMock: jest.Mock;

      beforeAll(() => {
        nextMock = jest.fn();

        const req: Partial<Request> = {
          method: 'POST',
          url: '/example',
          body: {
            first: 'test string',
            second: 'test string 2',
          },
        };

        validateRequestBodyMiddleware<{ first: string; second: string }>([
          'first',
          'second',
        ])(req as Request, {} as Response, nextMock);
      });

      it('should call next() function', () => {
        expect(nextMock).toHaveBeenCalledTimes(1);
      });
    });

    describe('one field missing', () => {
      let nextMock: jest.Mock;
      let mockResponse: Partial<Response>;

      beforeAll(() => {
        nextMock = jest.fn();
        mockResponse = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockReturnThis(),
        };

        const req: Partial<Request> = {
          method: 'POST',
          url: '/example',
          body: {
            first: 'test string',
          },
        };

        validateRequestBodyMiddleware<{ first: string; second: string }>([
          'first',
          'second',
        ])(req as Request, mockResponse as Response, nextMock);
      });

      it('should not call next() function', () => {
        expect(nextMock).not.toHaveBeenCalled();
      });

      it('should return status 400', () => {
        expect(mockResponse.status).toHaveBeenCalledWith(400);
      });

      it('should return error message', () => {
        expect(mockResponse.json).toHaveBeenCalledWith({
          error: 'Missing required fields: second',
        });
      });
    });
  });
});
