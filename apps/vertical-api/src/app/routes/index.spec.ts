/* eslint-disable @typescript-eslint/no-unused-vars */
import express, { Express } from 'express';
import supertest from 'supertest';
import * as middleware from '../utils/middleware';
import {
  disableMonitoringHandler,
  enableMonitoringHandler,
  setKeywordsHandler,
  streamStatusHandler,
} from './admin.handlers';
import { router } from './index';
import {
  monitorStreamHandler,
  processedTweetsHandler,
} from './public.handlers';

jest.mock('../utils/middleware', () => {
  const authorizationMiddlewareCall = jest.fn();
  const validateRequestBodyMiddlewareCall = jest.fn();

  return {
    authorizationMiddleware: jest
      .fn()
      .mockImplementation((_req, _res, next) => {
        authorizationMiddlewareCall();
        next();
      }),
    validateRequestBodyMiddleware: jest
      .fn()
      .mockImplementation(() => (_req, _res, next) => {
        validateRequestBodyMiddlewareCall();
        next();
      }),
    middlewareCalls: {
      authorizationMiddleware: authorizationMiddlewareCall,
      validateRequestBodyMiddleware: validateRequestBodyMiddlewareCall,
    },
  };
});

jest.mock('./admin.handlers', () => {
  return {
    disableMonitoringHandler: jest.fn(),
    enableMonitoringHandler: jest.fn(),
    setKeywordsHandler: jest.fn(),
    streamStatusHandler: jest.fn(),
  };
});

jest.mock('./public.handlers', () => {
  return {
    monitorStreamHandler: jest.fn(),
    processedTweetsHandler: jest.fn(),
  };
});

describe('router', () => {
  let app: Express;

  const middlewareCalls = (
    middleware as unknown as {
      middlewareCalls: {
        authorizationMiddleware: jest.Mock;
        validateRequestBodyMiddleware: jest.Mock;
      };
    }
  ).middlewareCalls;

  beforeEach(() => {
    app = express();
    app.use('/', router);
  });

  describe('admin routes', () => {
    describe('handling PUT set-keywords route', () => {
      const expectedMessage = 'set-keywords route';
      let response;

      beforeEach(async () => {
        jest.clearAllMocks();
        (setKeywordsHandler as jest.Mock).mockImplementation((_req, res) => {
          res.status(200).send({ message: expectedMessage });
        });

        response = await supertest(app).put('/admin/set-keywords');
      });

      it('should have mounted correct handler and return response', () => {
        expect(response.body.message).toBe(expectedMessage);
        expect(response.status).toBe(200);
      });

      it('should call authorizationMiddleware', () => {
        expect(middlewareCalls.authorizationMiddleware).toHaveBeenCalledTimes(
          1
        );
      });

      it('should call validateRequestBodyMiddleware', () => {
        expect(middlewareCalls.authorizationMiddleware).toHaveBeenCalledTimes(
          1
        );
      });
    });

    describe('handling POST enable-monitoring route', () => {
      const expectedMessage = 'enable-monitoring route';
      let response;

      beforeEach(async () => {
        jest.clearAllMocks();
        (enableMonitoringHandler as jest.Mock).mockImplementation(
          (_req, res) => {
            res.status(200).send({ message: expectedMessage });
          }
        );

        response = await supertest(app).post('/admin/enable-monitoring');
      });

      it('should have mounted correct handler and return response', () => {
        expect(response.body.message).toBe(expectedMessage);
        expect(response.status).toBe(200);
      });

      it('should call authorizationMiddleware', () => {
        expect(middlewareCalls.authorizationMiddleware).toHaveBeenCalledTimes(
          1
        );
      });
    });

    describe('handling POST disable-monitoring route', () => {
      const expectedMessage = 'disable-monitoring route';
      let response;

      beforeEach(async () => {
        jest.clearAllMocks();
        (disableMonitoringHandler as jest.Mock).mockImplementation(
          (_req, res) => {
            res.status(200).send({ message: expectedMessage });
          }
        );

        response = await supertest(app).post('/admin/disable-monitoring');
      });

      it('should have mounted correct handler and return response', () => {
        expect(response.body.message).toBe(expectedMessage);
        expect(response.status).toBe(200);
      });

      it('should call authorizationMiddleware', () => {
        expect(middlewareCalls.authorizationMiddleware).toHaveBeenCalledTimes(
          1
        );
      });
    });

    describe('handling GET stream-status route', () => {
      const expectedMessage = 'stream-status route';
      let response;

      beforeEach(async () => {
        jest.clearAllMocks();
        (streamStatusHandler as jest.Mock).mockImplementation((_req, res) => {
          res.status(200).send({ message: expectedMessage });
        });

        response = await supertest(app).get('/admin/stream-status');
      });

      it('should have mounted correct handler and return response', () => {
        expect(response.body.message).toBe(expectedMessage);
        expect(response.status).toBe(200);
      });

      it('should call authorizationMiddleware', () => {
        expect(middlewareCalls.authorizationMiddleware).toHaveBeenCalledTimes(
          1
        );
      });
    });
  });

  describe('public routes', () => {
    describe('handling GET monitor-stream route', () => {
      const expectedMessage = 'monitor-stream route';
      let response;

      beforeEach(async () => {
        jest.clearAllMocks();
        (monitorStreamHandler as jest.Mock).mockImplementation((_req, res) => {
          res.status(200).send({ message: expectedMessage });
        });

        response = await supertest(app).get('/monitor-stream');
      });

      it('should have mounted correct handler and return response', () => {
        expect(response.body.message).toBe(expectedMessage);
        expect(response.status).toBe(200);
      });
    });

    describe('handling GET processed-tweets route', () => {
      const expectedMessage = 'monitor-stream route';
      let response;

      beforeEach(async () => {
        jest.clearAllMocks();
        (processedTweetsHandler as jest.Mock).mockImplementation(
          (_req, res) => {
            res.status(200).send({ message: expectedMessage });
          }
        );

        response = await supertest(app).get('/processed-tweets');
      });

      it('should have mounted correct handler and return response', () => {
        expect(response.body.message).toBe(expectedMessage);
        expect(response.status).toBe(200);
      });
    });
  });
});
