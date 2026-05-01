import { SecretClient, SetSecretOptions } from '@azure/keyvault-secrets';

export interface RotationOptions {
  expiresOn?: Date;
  contentType?: string;
  tags?: Record<string, string>;
}

export class SecretRotationHelper {
  constructor(private client: SecretClient) {}

  async rotateSecret(
    name: string,
    newValue: string,
    options?: RotationOptions
  ): Promise<string> {
    console.log(`[Rotation] Creating new version of secret '${name}'...`);
    
    const setOptions: SetSecretOptions = {
      expiresOn: options?.expiresOn,
      contentType: options?.contentType,
      tags: options?.tags,
    };

    const newSecret = await this.client.setSecret(name, newValue, setOptions);
    const newVersion = newSecret.properties.version;
    
    console.log(`[Rotation] New version created: ${newVersion}`);
    if (options?.expiresOn) {
      console.log(`[Rotation] Expiry set to: ${options.expiresOn.toISOString()}`);
    }
    
    return newVersion || '';
  }

  async deleteAndPurgeOldVersion(name: string): Promise<void> {
    console.log(`[Rotation] Starting delete operation for secret '${name}'...`);
    
    const deletePoller = await this.client.beginDeleteSecret(name);
    console.log(`[Rotation] Delete initiated, waiting for completion...`);
    
    const deletedSecret = await deletePoller.pollUntilDone();
    console.log(`[Rotation] Delete completed. Secret is now in soft-deleted state.`);
    console.log(`[Rotation] Scheduled purge date: ${deletedSecret.properties.scheduledPurgeDate?.toISOString()}`);

    console.log(`[Rotation] Purging soft-deleted secret '${name}'...`);
    await this.client.purgeDeletedSecret(name);
    console.log(`[Rotation] Purge complete. Secret '${name}' is permanently removed.`);
  }

  async safeRotateAndCleanup(
    name: string,
    newValue: string,
    options?: RotationOptions
  ): Promise<void> {
    const newVersion = await this.rotateSecret(name, newValue, options);
    
    console.log(`[Rotation] Waiting a moment before cleanup...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      await this.deleteAndPurgeOldVersion(name);
    } catch (error: any) {
      console.error(`[Rotation] Cleanup failed: ${error.message}`);
      console.error(`[Rotation] New version ${newVersion} is active, but old versions remain.`);
      throw error;
    }
  }

  async listVersions(name: string): Promise<Array<{ version: string; enabled: boolean; createdOn?: Date }>> {
    const versions: Array<{ version: string; enabled: boolean; createdOn?: Date }> = [];
    
    for await (const versionProps of this.client.listPropertiesOfSecretVersions(name)) {
      versions.push({
        version: versionProps.version || '',
        enabled: versionProps.enabled || false,
        createdOn: versionProps.createdOn,
      });
    }
    
    return versions;
  }
}
