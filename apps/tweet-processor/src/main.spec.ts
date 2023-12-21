/* eslint-disable @typescript-eslint/no-explicit-any */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import * as libDynamodb from '@aws-sdk/lib-dynamodb';
import { SQSEvent } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import axios from 'axios';
import AxiosMockAdapter from 'axios-mock-adapter';
import config from './app/config';
import { logger } from './app/logger';
import { handler } from './main';

jest.mock('./app/logger', () => {
  return {
    logger: {
      info: jest.fn(),
      error: jest.fn(),
    },
  };
});

jest.mock('@aws-sdk/lib-dynamodb', () => {
  const mock = {
    put: jest.fn().mockImplementation(() => Promise.resolve({})),
  };
  return {
    DynamoDBDocument: { from: jest.fn(() => mock) },
    mock,
  };
});

const toSqsEvent = (data: Record<string, unknown>): SQSEvent => ({
  Records: [
    {
      messageId: 'ae267b10-5d22-4859-8d18-cef3ada4f24f',
      receiptHandle: 'receipt-handle',
      body: JSON.stringify(data),
      attributes: {
        ApproximateReceiveCount: '1',
        SentTimestamp: '1703155356548',
        SenderId: '503304810978',
        ApproximateFirstReceiveTimestamp: '1703155356552',
      },
      messageAttributes: {},
      md5OfBody: '4c255045fe74465be85ed74b3727772f',
      eventSource: 'aws:sqs',
      eventSourceARN: 'arn:aws:sqs:eu-west-1:503304810978:tweets-sqs',
      awsRegion: 'eu-west-1',
    },
  ],
});

describe('handler', () => {
  mockClient(DynamoDBClient);
  const secretsManagerClientMock = mockClient(SecretsManagerClient);
  const axiosMock = new AxiosMockAdapter(axios);
  const loggerMock = logger as unknown as { info: jest.Mock; error: jest.Mock };
  const dynamoDBDocumentMock: { put: jest.Mock } = (libDynamodb as any).mock;

  const fakeGeoApiToken = 'geo-api-token';

  beforeAll(() => {
    config.GEO_API_URL = 'https://fake-url.com';
    config.PROCESSED_TWEETS_TABLE = 'table-name-for-tests';
    config.GEO_API_TOKEN_SECRET_NAME = 'geo-api-token-secret-name';

    secretsManagerClientMock.on(GetSecretValueCommand).resolves({
      SecretString: fakeGeoApiToken,
    });
  });

  describe('tweet without geo location', () => {
    const event = toSqsEvent({
      data: {
        id: '624c73f4-0716-4ed9-8100-28c34afd302c',
        message: 'random tweet',
        created_at: '2023-12-20T12:55:45.037Z',
      },
    });

    beforeAll(async () => {
      jest.clearAllMocks();

      secretsManagerClientMock.on(GetSecretValueCommand).resolves({
        SecretString: fakeGeoApiToken,
      });
      await handler(event);
    });

    it('should log info messages', () => {
      expect(loggerMock.info.mock.calls.map((i) => i[0]))
        .toMatchInlineSnapshot(`
        [
          "Incoming event",
          "Saving Tweet to dynamoDB",
          "Successfully saved Tweet to dynamoDB",
          "Capturing tweet origin country for metrics",
        ]
      `);
    });

    it('should put item into dynamo', () => {
      expect(dynamoDBDocumentMock.put.mock.calls).toMatchInlineSnapshot(`
        [
          [
            {
              "ConditionExpression": "attribute_not_exists(tweetId)",
              "Item": {
                "creation_date": "2023-12-20",
                "raw": {
                  "data": {
                    "created_at": "2023-12-20T12:55:45.037Z",
                    "id": "624c73f4-0716-4ed9-8100-28c34afd302c",
                    "message": "random tweet",
                  },
                },
                "tweetId": "624c73f4-0716-4ed9-8100-28c34afd302c",
              },
              "TableName": "table-name-for-tests",
            },
          ],
        ]
      `);
    });

    it('should capture tweet country "unknown" for metrics in log message context', () => {
      expect(logger.info).toHaveBeenCalledWith(
        'Capturing tweet origin country for metrics',
        {
          context: { country: 'unknown' },
        }
      );
    });
  });

  describe('tweet with geo location', () => {
    const event = toSqsEvent({
      data: {
        id: 'a911b5b5-f907-452b-b122-fbfc49b51ca1',
        message: 'random tweet',
        created_at: '2023-12-20T12:55:51.040Z',
        geo: { coordinates: { coordinates: [35, 139] }, type: 'Point' },
      },
    });

    beforeAll(async () => {
      jest.clearAllMocks();

      axiosMock
        .onGet(
          'https://fake-url.com/geo-api/country',
          {
            params: { lat: 35, long: 139 },
          },
          expect.objectContaining({
            Authorization: `Bearer ${config.GEO_API_TOKEN}`,
          })
        )
        .reply(200, {
          name: 'Lithuania',
        });
      await handler(event);
    });

    it('should log info messages', () => {
      expect(loggerMock.info.mock.calls.map((i) => i[0]))
        .toMatchInlineSnapshot(`
        [
          "Incoming event",
          "Saving Tweet to dynamoDB",
          "Successfully saved Tweet to dynamoDB",
          "Getting country from GEO API",
          "Successfully received data from GEO API",
          "Capturing tweet origin country for metrics",
        ]
      `);
    });

    it('should put item into dynamo', () => {
      expect(dynamoDBDocumentMock.put.mock.calls).toMatchInlineSnapshot(`
        [
          [
            {
              "ConditionExpression": "attribute_not_exists(tweetId)",
              "Item": {
                "creation_date": "2023-12-20",
                "raw": {
                  "data": {
                    "created_at": "2023-12-20T12:55:51.040Z",
                    "geo": {
                      "coordinates": {
                        "coordinates": [
                          35,
                          139,
                        ],
                      },
                      "type": "Point",
                    },
                    "id": "a911b5b5-f907-452b-b122-fbfc49b51ca1",
                    "message": "random tweet",
                  },
                },
                "tweetId": "a911b5b5-f907-452b-b122-fbfc49b51ca1",
              },
              "TableName": "table-name-for-tests",
            },
          ],
        ]
      `);
    });

    it('should capture tweet country "Lithuania" for metrics in log message context', () => {
      expect(logger.info).toHaveBeenCalledWith(
        'Capturing tweet origin country for metrics',
        {
          context: { country: 'Lithuania' },
        }
      );
    });
  });

  describe('duplicate tweet received', () => {
    const event = toSqsEvent({
      data: {
        id: '624c73f4-0716-4ed9-8100-28c34afd302c',
        message: 'random tweet',
        created_at: '2023-12-20T12:55:45.037Z',
      },
    });

    beforeAll(async () => {
      jest.clearAllMocks();

      dynamoDBDocumentMock.put.mockImplementationOnce(() =>
        Promise.reject({ name: 'ConditionalCheckFailedException' })
      );
      await handler(event);
    });

    it('should log info messages', () => {
      expect(loggerMock.info.mock.calls.map((i) => i[0]))
        .toMatchInlineSnapshot(`
        [
          "Incoming event",
          "Saving Tweet to dynamoDB",
          "Duplicate Tweet received",
        ]
      `);
    });
  });

  describe('saving tweet to dynamo fails', () => {
    const event = toSqsEvent({
      data: {
        id: '624c73f4-0716-4ed9-8100-28c34afd302c',
        message: 'random tweet',
        created_at: '2023-12-20T12:55:45.037Z',
      },
    });

    beforeAll(async () => {
      jest.clearAllMocks();

      dynamoDBDocumentMock.put.mockImplementationOnce(() =>
        Promise.reject({ name: 'AnyOtherError' })
      );
      await expect(handler(event)).rejects.toThrow();
    });

    it('should log info messages', () => {
      expect(loggerMock.info.mock.calls.map((i) => i[0]))
        .toMatchInlineSnapshot(`
        [
          "Incoming event",
          "Saving Tweet to dynamoDB",
        ]
      `);
    });
  });
});
