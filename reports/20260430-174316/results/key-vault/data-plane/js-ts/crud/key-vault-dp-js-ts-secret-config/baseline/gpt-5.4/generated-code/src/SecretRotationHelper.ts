import { SecretClient } from "@azure/keyvault-secrets";

export class SecretRotationHelper {
  public constructor(private readonly client: SecretClient) {}

  public async rotateSecret(
    name: string,
    value: string,
    expiresOn: Date,
  ) {
    return this.client.setSecret(name, value, { expiresOn });
  }

  public async deleteAndPurgeSecret(name: string): Promise<void> {
    const deletePoller = await this.client.beginDeleteSecret(name);

    await deletePoller.pollUntilDone();
    await this.client.purgeDeletedSecret(name);
  }
}
