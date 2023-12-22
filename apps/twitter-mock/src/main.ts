import express from 'express';
import geoRev from 'geo-reverse';
import { logger } from './app/logger';
import { loggerMiddleware } from './app/middleware';
import { generateTweetStreamItem } from './app/tweet-generator';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3001;

const app = express();

app.use(loggerMiddleware);
app.use(express.json());

app.get('/mock/health', (_req, res) => {
  logger.info('Health check');
  res.send({
    message: 'healthy',
    time: new Date().toISOString(),
  });
});

app.get('/mock/geo-api/country', (req, res) => {
  const lat = req.query.lat;
  const long = req.query.long;
  const country = geoRev.country(lat, long);

  res.send(country[0]);
});

app.post('/mock/2/tweets/search/stream/rules', (_req, res) => {
  res.send({
    data: [],
  });
});

app.get('/mock/2/tweets/search/stream', (_req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const intervalId = setInterval(() => {
    res.write(`${JSON.stringify(generateTweetStreamItem())}\n`);
    if (res.closed) {
      logger.info('Connection closed by client');
      clearInterval(intervalId);
      res.end();
    }
  }, 3000);
});

app.listen(port, host, () => {
  logger.info(`[ ready ] http://${host}:${port}`);
});
