import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

export async function scanWholeDynamoTable(table: string) {
  const client = new DynamoDBClient({ maxAttempts: 4 });
  const ddbDocClient = DynamoDBDocument.from(client, {
    marshallOptions: {
      removeUndefinedValues: true,
    },
    unmarshallOptions: {
      wrapNumbers: false,
    },
  });

  const params = { TableName: table };
  const result = await ddbDocClient.scan(params);
  let lastEvaluatedKey = result.LastEvaluatedKey;
  while (lastEvaluatedKey) {
    const extendedResults = await ddbDocClient.scan({
      ...params,
      ExclusiveStartKey: lastEvaluatedKey,
    });
    lastEvaluatedKey = extendedResults.LastEvaluatedKey;
    result.Items.push(...extendedResults.Items);
  }

  return result;
}
