import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const sqsClient = new SQSClient();

export async function sendSqsMessage(queueUrl: string, message: string) {
  const response = await sqsClient.send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: message,
    })
  );

  return response;
}
