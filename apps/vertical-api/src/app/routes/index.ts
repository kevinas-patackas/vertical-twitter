import { Router } from 'express';
import { adminRouter } from './admin.router';
import { publicRouter } from './public.router';

export const router = Router();

router.use('/admin', adminRouter);
router.use('/', publicRouter);
