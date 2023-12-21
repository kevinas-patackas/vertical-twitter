import express from 'express';
import { router } from './app/routes';
import { initializeTweetStreamReader } from './app/tweet-stream-handler';
import { logger } from './app/utils/logger';
import { loggerMiddleware } from './app/utils/middleware';
import config from './app/config';
import { getSecretByName } from './app/utils/secrets-manager';

async function initializeApp() {
  //TEMP
  // config['TWITTER_API_URL'] = 'http://localhost:3001/mock';
  // config['TWITTER_TOKEN'] = 'this-is-twitter-token';
  // config['VERTICAL_API_TOKEN'] = 'this-is-vertical-api-token';
  //TEMP

  config.TWITTER_TOKEN = await getSecretByName(
    config.TWITTER_TOKEN_SECRET_NAME
  );
  config.VERTICAL_API_TOKEN = await getSecretByName(
    config.VERTICAL_API_TOKEN_SECRET_NAME
  );

  initializeTweetStreamReader();

  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;

  const app = express();

  app.use(loggerMiddleware);
  app.use(express.json());

  app.use('/api', router);

  app.get('/api/health', (_req, res) => {
    logger.info('Health check');
    res.send({
      message: 'healthy',
      time: new Date().toISOString(),
    });
  });

  app.listen(port, host, () => {
    logger.info(`[ ready ] http://${host}:${port}`);
  });
}

(async () => {
  await initializeApp();
})();
