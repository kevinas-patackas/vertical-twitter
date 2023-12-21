import { Router } from 'express';
import {
  authorizationMiddleware,
  validateRequestBodyMiddleware,
} from '../utils/middleware';
import {
  disableMonitoringHandler,
  enableMonitoringHandler,
  setKeywordsHandler,
  streamStatusHandler,
} from './admin.handlers';
import { SetKeywordsRequestBody } from './admin.types';

export const adminRouter = Router();
adminRouter.use(authorizationMiddleware);

adminRouter.put(
  '/set-keywords',
  validateRequestBodyMiddleware<SetKeywordsRequestBody>(['keywords']),
  setKeywordsHandler
);
adminRouter.post('/enable-monitoring', enableMonitoringHandler);
adminRouter.post('/disable-monitoring', disableMonitoringHandler);
adminRouter.get('/stream-status', streamStatusHandler);
