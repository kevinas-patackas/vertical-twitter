import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { TwitterStreamItem } from '@vertical-twitter/types';
import { DateTime } from 'luxon';
import { logger } from './logger';
import config from './config';

export async function saveTweetToDynamo(
  tweet: TwitterStreamItem
): Promise<'saved' | 'error' | 'duplicate'> {
  const client = new DynamoDBClient({ maxAttempts: 4 });
  const ddbDocClient = DynamoDBDocument.from(client, {
    marshallOptions: {
      removeUndefinedValues: true,
    },
    unmarshallOptions: {
      wrapNumbers: false,
    },
  });

  try {
    logger.info('Saving Tweet to dynamoDB');
    await ddbDocClient.put({
      TableName: config.PROCESSED_TWEETS_TABLE,
      Item: {
        tweetId: tweet.data.id,
        creation_date: DateTime.fromISO(tweet.data.created_at, {
          zone: 'utc',
        }).toFormat('yyyy-MM-dd'),
        raw: tweet,
      },
      ConditionExpression: 'attribute_not_exists(tweetId)',
    });
    logger.info('Successfully saved Tweet to dynamoDB');
    return 'saved';
  } catch (exception) {
    if (exception.name === 'ConditionalCheckFailedException') {
      logger.info('Duplicate Tweet received');
      return 'duplicate';
    }

    logger.error('Failed to save Tweet to dynamoDB', { exception });
    return 'error';
  }
}
