import { Router } from 'express';
import {
  monitorStreamHandler,
  processedTweetsHandler,
} from './public.handlers';

export const publicRouter = Router();

publicRouter.get('/monitor-stream', monitorStreamHandler);
publicRouter.get('/processed-tweets', processedTweetsHandler);
