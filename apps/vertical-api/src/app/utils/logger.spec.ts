import { logger } from './logger';

describe('logger', () => {
  it('should create logger object', () => {
    const loggerInstance = logger;
    expect(loggerInstance).toBeDefined();
  });
});
