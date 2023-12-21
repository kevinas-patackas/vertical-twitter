import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';

export async function getSecretByName(secretName: string) {
  const secretsManagerClient = new SecretsManagerClient({ maxAttempts: 4 });

  const command = new GetSecretValueCommand({
    SecretId: secretName,
  });
  const response = await secretsManagerClient.send(command);
  return response.SecretString;
}
