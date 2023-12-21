import { TwitterStreamItem } from '@vertical-twitter/types';
import { SQSEvent } from 'aws-lambda';
import stringify from 'json-stringify-safe';
import { logger } from './app/logger';
import { saveTweetToDynamo } from './app/dynamo';
import { getTweetCountryName } from './app/geo-api';
import { getSecretByName } from './app/secrets-manager';
import config from './app/config';

const secretsCache = {};

export const handler = async (event: SQSEvent) => {
  config.GEO_API_TOKEN = await getSecret(config.GEO_API_TOKEN_SECRET_NAME);

  logger.info('Incoming event', { event: stringify(event) });
  const twitterStreamItem: TwitterStreamItem = JSON.parse(
    event.Records[0].body
  );

  const dynamoResponse = await saveTweetToDynamo(twitterStreamItem);

  if (dynamoResponse === 'error') {
    throw new Error(
      'Failed to save Tweet to Dynamo, throwing error to retry message'
    );
  }

  if (dynamoResponse === 'duplicate') {
    return;
  }

  const country = await getTweetCountryName(twitterStreamItem);
  logger.info(`Capturing tweet origin country for metrics`, {
    context: { country },
  });
};

async function getSecret(secretName: string) {
  const cachedSecret = secretsCache[secretName];
  if (cachedSecret) {
    return cachedSecret;
  }

  const retrievedSecretString = await getSecretByName(secretName);
  secretsCache[secretName] = retrievedSecretString;

  return retrievedSecretString;
}
