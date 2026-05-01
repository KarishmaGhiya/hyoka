import { SecretClient, SetSecretOptions } from '@azure/keyvault-secrets';

export interface SecretRotationOptions {
  expiryDays?: number;
  contentType?: string;
  tags?: Record<string, string>;
}

export class SecretRotationHelper {
  private client: SecretClient;

  constructor(client: SecretClient) {
    this.client = client;
  }

  /**
   * Creates a new version of a secret with an updated value and expiry date
   * @param secretName The name of the secret
   * @param newValue The new secret value
   * @param options Rotation options including expiry settings
   * @returns The version ID of the new secret
   */
  async rotateSecret(
    secretName: string,
    newValue: string,
    options?: SecretRotationOptions
  ): Promise<string> {
    console.log(`Rotating secret: ${secretName}`);

    const expiryDays = options?.expiryDays || 90;
    const expiresOn = new Date();
    expiresOn.setDate(expiresOn.getDate() + expiryDays);

    const setOptions: SetSecretOptions = {
      expiresOn,
      contentType: options?.contentType || 'text/plain',
      tags: options?.tags || {},
    };

    try {
      const secret = await this.client.setSecret(secretName, newValue, setOptions);
      console.log(`✓ Created new version: ${secret.properties.version}`);
      console.log(`  Expires on: ${secret.properties.expiresOn?.toISOString()}`);
      
      return secret.properties.version || '';
    } catch (error: any) {
      console.error(`✗ Failed to rotate secret:`, error.message);
      throw error;
    }
  }

  /**
   * Safely deletes and purges an old secret version
   * This is a two-step process due to Key Vault's soft-delete feature:
   * 1. Delete the secret (moves to soft-deleted state)
   * 2. Wait for deletion to complete
   * 3. Purge the secret (permanently removes it)
   * 
   * @param secretName The name of the secret to delete
   * @param waitForCompletion Whether to wait for deletion before purging
   */
  async deleteAndPurgeSecret(secretName: string, waitForCompletion: boolean = true): Promise<void> {
    console.log(`Deleting secret: ${secretName}`);

    try {
      // Step 1: Begin deletion (this is a long-running operation)
      const poller = await this.client.beginDeleteSecret(secretName);
      console.log('✓ Delete operation started');

      if (waitForCompletion) {
        // Step 2: Wait for deletion to complete
        console.log('  Waiting for deletion to complete...');
        const deletedSecret = await poller.pollUntilDone();
        console.log(`✓ Secret deleted: ${deletedSecret.name}`);
        console.log(`  Deleted on: ${deletedSecret.properties.deletedOn?.toISOString()}`);
        console.log(`  Scheduled purge: ${deletedSecret.properties.scheduledPurgeDate?.toISOString()}`);

        // Step 3: Purge the secret (permanent removal)
        console.log('  Purging deleted secret...');
        await this.client.purgeDeletedSecret(secretName);
        console.log('✓ Secret purged permanently');
      } else {
        console.log('  Delete initiated (not waiting for completion)');
      }
    } catch (error: any) {
      if (error.statusCode === 404 || error.code === 'SecretNotFound') {
        console.warn(`Secret '${secretName}' not found, nothing to delete`);
      } else {
        console.error(`✗ Failed to delete/purge secret:`, error.message);
        throw error;
      }
    }
  }

  /**
   * Deletes a specific version of a secret (requires premium tier or specific permissions)
   * Note: Key Vault doesn't support deleting specific versions in standard tier.
   * This is here for completeness but may not work in all scenarios.
   * 
   * @param secretName The name of the secret
   * @param version The version to delete
   */
  async deleteSpecificVersion(secretName: string, version: string): Promise<void> {
    console.log(`Note: Deleting specific versions requires Key Vault Premium tier`);
    console.log(`Secret: ${secretName}, Version: ${version}`);
    console.log('Typically, you would use the full secret lifecycle instead.');
  }

  /**
   * Full rotation workflow: create new version, then optionally cleanup old one
   * @param secretName The name of the secret
   * @param newValue The new secret value
   * @param cleanupOld Whether to delete and purge after rotation
   * @param options Rotation options
   * @returns The new version ID
   */
  async rotateAndCleanup(
    secretName: string,
    newValue: string,
    cleanupOld: boolean = false,
    options?: SecretRotationOptions
  ): Promise<string> {
    // Create new version
    const newVersion = await this.rotateSecret(secretName, newValue, options);

    if (cleanupOld) {
      console.log('\nCleaning up old secret...');
      console.log('Note: This deletes ALL versions of the secret name.');
      console.log('In production, you would typically keep multiple versions.');
      
      // In a real scenario, you might want to:
      // 1. Keep the last N versions
      // 2. Only delete versions older than X days
      // 3. Not delete at all, just let Key Vault manage lifecycle
    }

    return newVersion;
  }

  /**
   * Lists all versions of a secret to help decide which to clean up
   * @param secretName The name of the secret
   */
  async listVersionsForCleanup(secretName: string): Promise<Array<{ version: string; createdOn?: Date; expiresOn?: Date }>> {
    const versions: Array<{ version: string; createdOn?: Date; expiresOn?: Date }> = [];
    
    try {
      for await (const properties of this.client.listPropertiesOfSecretVersions(secretName)) {
        versions.push({
          version: properties.version || 'unknown',
          createdOn: properties.createdOn,
          expiresOn: properties.expiresOn,
        });
      }
    } catch (error: any) {
      console.error(`Error listing versions:`, error.message);
    }

    return versions;
  }
}
