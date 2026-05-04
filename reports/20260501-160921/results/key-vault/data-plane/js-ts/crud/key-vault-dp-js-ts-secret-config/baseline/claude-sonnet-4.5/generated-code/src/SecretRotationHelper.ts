import { SecretClient } from '@azure/keyvault-secrets';

export interface RotationOptions {
  expiryDays?: number;
  cleanupOldVersion?: boolean;
}

export class SecretRotationHelper {
  constructor(private client: SecretClient) {}

  async rotateSecret(
    secretName: string,
    newValue: string,
    options: RotationOptions = {}
  ): Promise<string> {
    const { expiryDays = 90, cleanupOldVersion = false } = options;

    let oldVersion: string | undefined;
    if (cleanupOldVersion) {
      try {
        const currentSecret = await this.client.getSecret(secretName);
        oldVersion = currentSecret.properties.version;
      } catch (error: any) {
        if (error.statusCode !== 404) {
          throw error;
        }
      }
    }

    const expiresOn = new Date();
    expiresOn.setDate(expiresOn.getDate() + expiryDays);

    const newSecret = await this.client.setSecret(secretName, newValue, {
      expiresOn,
    });

    console.log(`Created new version of secret '${secretName}': ${newSecret.properties.version}`);

    if (cleanupOldVersion && oldVersion) {
      await this.deleteAndPurgeSecret(secretName);
    }

    return newSecret.properties.version || '';
  }

  async deleteAndPurgeSecret(secretName: string): Promise<void> {
    console.log(`Starting deletion of secret: ${secretName}`);
    
    const deletePoller = await this.client.beginDeleteSecret(secretName);
    const deletedSecret = await deletePoller.pollUntilDone();
    
    console.log(`Secret '${secretName}' deleted (soft-delete)`);

    if (deletedSecret.properties.recoveryId) {
      await this.client.purgeDeletedSecret(secretName);
      console.log(`Secret '${secretName}' purged completely`);
    }
  }

  async createNewVersionWithExpiry(
    secretName: string,
    value: string,
    expiryDays: number
  ): Promise<string> {
    const expiresOn = new Date();
    expiresOn.setDate(expiresOn.getDate() + expiryDays);

    const secret = await this.client.setSecret(secretName, value, {
      expiresOn,
    });

    console.log(`Created new version with expiry: ${secretName} (expires: ${expiresOn.toISOString()})`);
    return secret.properties.version || '';
  }

  async listSecretVersions(secretName: string): Promise<string[]> {
    const versions: string[] = [];
    const versionIterator = this.client.listPropertiesOfSecretVersions(secretName);

    for await (const version of versionIterator) {
      if (version.version) {
        versions.push(version.version);
      }
    }

    return versions;
  }
}
