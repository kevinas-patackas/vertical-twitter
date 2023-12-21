import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { mockClient } from 'aws-sdk-client-mock';
import { getSecretByName } from './secrets-manager';

describe('secrets-manager', () => {
  const secretsManagerClientMock = mockClient(SecretsManagerClient);

  describe('getSecretByName', () => {
    it('should return secret by given name', async () => {
      const expectedSecretString = 'super secret test secret';
      secretsManagerClientMock.on(GetSecretValueCommand).resolves({
        SecretString: expectedSecretString,
      });

      const result = await getSecretByName('random_secret_name');
      expect(result).toBe(expectedSecretString);
    });
  });
});
