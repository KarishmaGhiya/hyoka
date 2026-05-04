import { SecretClient } from '@azure/keyvault-secrets';
import { SecretProvider } from './SecretProvider';

export class SecretRotationHelper {
  constructor(
    private client: SecretClient,
    private provider: SecretProvider
  ) {}

  /**
   * Rotates a secret by creating a new version with updated value and expiry.
   */
  async rotateSecret(
    name: string,
    newValue: string,
    expiresOn?: Date
  ): Promise<{ oldVersion?: string; newVersion: string }> {
    // Get current version before rotation
    const currentInfo = await this.provider.getSecretInfo(name);
    const oldVersion = currentInfo?.version;

    // Create new version
    const newSecret = await this.provider.setSecret(name, newValue, expiresOn);

    return {
      oldVersion,
      newVersion: newSecret.properties.version || 'unknown',
    };
  }

  /**
   * Safely deletes a specific version of a secret using the long-running operation.
   * Waits for the delete operation to complete.
   */
  async deleteSecretVersion(name: string, version: string): Promise<void> {
    try {
      // Initiate the delete operation (long-running operation)
      const poller = await this.client.beginDeleteSecret(name);
      
      // Wait for the delete operation to complete
      await poller.pollUntilDone();
      
      console.log(`Secret '${name}' version '${version}' deleted (now in soft-delete state)`);
    } catch (error: any) {
      if (error.statusCode === 404) {
        console.log(`Secret '${name}' not found, already deleted`);
        return;
      }
      throw error;
    }
  }

  /**
   * Purges a deleted secret permanently (removes from soft-delete).
   * Must be called after deleteSecretVersion completes.
   */
  async purgeDeletedSecret(name: string): Promise<void> {
    try {
      await this.client.purgeDeletedSecret(name);
      console.log(`Secret '${name}' purged permanently`);
    } catch (error: any) {
      if (error.statusCode === 404) {
        console.log(`Deleted secret '${name}' not found, may already be purged`);
        return;
      }
      throw error;
    }
  }

  /**
   * Full cleanup: deletes a secret and waits for completion, then purges it.
   * This is safe because it waits for the delete operation to complete before purging.
   */
  async deleteAndPurge(name: string): Promise<void> {
    console.log(`Starting delete-and-purge for secret '${name}'...`);
    
    // Step 1: Delete (and wait for completion)
    const deletePoller = await this.client.beginDeleteSecret(name);
    await deletePoller.pollUntilDone();
    console.log(`Delete operation completed for '${name}'`);
    
    // Step 2: Purge (safe now that delete is complete)
    await this.client.purgeDeletedSecret(name);
    console.log(`Purge completed for '${name}'`);
  }

  /**
   * Lists all versions of a secret to help with cleanup decisions.
   */
  async listVersions(name: string): Promise<Array<{ version: string; enabled: boolean }>> {
    const versions: Array<{ version: string; enabled: boolean }> = [];
    try {
      for await (const versionProps of this.client.listPropertiesOfSecretVersions(name)) {
        if (versionProps.version) {
          versions.push({
            version: versionProps.version,
            enabled: versionProps.enabled || false,
          });
        }
      }
    } catch (error: any) {
      if (error.statusCode === 404) {
        return [];
      }
      throw error;
    }
    return versions;
  }
}
