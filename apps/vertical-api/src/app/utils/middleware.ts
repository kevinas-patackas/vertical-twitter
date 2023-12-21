import { NextFunction, Request, Response } from 'express';
import { logger } from './logger';
import config from '../config';

export const loggerMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  logger.info(`${req.method} ${req.url}`);
  next();
};

export const authorizationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authorizationHeader = req.headers.authorization;

  if (authorizationHeader === `Bearer ${config.VERTICAL_API_TOKEN}`) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

export const validateRequestBodyMiddleware = <T extends object>(
  fields: (keyof T)[]
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const requestBody = req.body as T;

    const missingFields = fields.filter((field) => !(field in requestBody));

    if (missingFields.length) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    next();
  };
};
