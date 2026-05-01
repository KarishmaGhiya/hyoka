import { SecretClient } from "@azure/keyvault-secrets";

import { DeleteAndPurgeResult, RotationResult } from "./types";

type KeyVaultError = {
  statusCode?: number;
  code?: string;
};

export class SecretRotationHelper {
  public constructor(private readonly client: SecretClient) {}

  public async rotateSecretVersion(
    name: string,
    value: string,
    expiresOn: Date,
  ): Promise<RotationResult> {
    const previousVersion = await this.tryGetLatestVersion(name);
    const rotatedSecret = await this.client.setSecret(name, value, { expiresOn });

    return {
      name,
      previousVersion,
      newVersion: rotatedSecret.properties.version ?? null,
      expiresOn: rotatedSecret.properties.expiresOn ?? null,
    };
  }

  public async deleteAndPurgeSecret(
    name: string,
  ): Promise<DeleteAndPurgeResult> {
    const deletePoller = await this.client.beginDeleteSecret(name);
    const deletedSecret = await deletePoller.pollUntilDone();

    await this.client.purgeDeletedSecret(name);

    return {
      name,
      deletedOn: deletedSecret.deletedOn ?? null,
      scheduledPurgeDate: deletedSecret.scheduledPurgeDate ?? null,
    };
  }

  private async tryGetLatestVersion(name: string): Promise<string | null> {
    try {
      const secret = await this.client.getSecret(name);
      return secret.properties.version ?? null;
    } catch (error: unknown) {
      if (this.isMissingSecret(error)) {
        return null;
      }

      throw error;
    }
  }

  private isMissingSecret(error: unknown): boolean {
    const candidate = error as KeyVaultError;
    return candidate.statusCode === 404 || candidate.code === "SecretNotFound";
  }
}
