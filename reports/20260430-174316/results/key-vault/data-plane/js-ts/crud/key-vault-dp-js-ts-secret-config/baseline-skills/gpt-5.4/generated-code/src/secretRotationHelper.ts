import { SecretClient, KeyVaultSecret } from "@azure/keyvault-secrets";

export class SecretRotationHelper {
  public constructor(private readonly client: SecretClient) {}

  public async rotateSecret(
    name: string,
    value: string,
    expiresOn: Date,
  ): Promise<KeyVaultSecret> {
    return this.client.setSecret(name, value, { expiresOn });
  }

  public async deleteAndPurgeSecret(name: string): Promise<void> {
    const poller = await this.client.beginDeleteSecret(name);
    await poller.pollUntilDone();
    await this.client.purgeDeletedSecret(name);
  }
}
