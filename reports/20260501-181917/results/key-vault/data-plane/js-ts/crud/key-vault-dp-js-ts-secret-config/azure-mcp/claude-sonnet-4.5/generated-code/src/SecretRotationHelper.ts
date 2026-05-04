import { SecretClient, SetSecretOptions } from '@azure/keyvault-secrets';

export interface RotationOptions {
  expiryDays?: number; // Set expiry date this many days in the future
  contentType?: string;
  tags?: Record<string, string>;
}

export interface CleanupOptions {
  deleteOldVersion?: boolean; // Delete the old version after creating new one
  purgeAfterDelete?: boolean; // Purge after delete (requires waiting for delete to complete)
}

export class SecretRotationHelper {
  private client: SecretClient;

  constructor(client: SecretClient) {
    this.client = client;
  }

  /**
   * Rotates a secret by creating a new version with updated value and expiry.
   */
  async rotateSecret(
    name: string,
    newValue: string,
    options: RotationOptions = {}
  ): Promise<string> {
    let expiryDate: Date | undefined;
    
    if (options.expiryDays) {
      expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + options.expiryDays);
    }

    const secretOptions: SetSecretOptions = {
      contentType: options.contentType,
      tags: options.tags,
      expiresOn: expiryDate,
    };

    console.log(`Creating new version of secret: ${name}`);
    const secret = await this.client.setSecret(name, newValue, secretOptions);
    console.log(`✓ New version created: ${secret.properties.version}`);

    return secret.properties.version!;
  }

  /**
   * Gets all versions of a secret.
   */
  async listSecretVersions(name: string): Promise<string[]> {
    const versions: string[] = [];
    
    for await (const versionProperties of this.client.listPropertiesOfSecretVersions(name)) {
      if (versionProperties.version) {
        versions.push(versionProperties.version);
      }
    }

    return versions;
  }

  /**
   * Deletes and optionally purges an old version of a secret.
   * Note: You cannot delete a specific version - only the entire secret.
   * This method is designed for the cleanup flow where you want to fully remove
   * a secret name after rotation (if you need to reuse the exact name).
   */
  async cleanupSecret(name: string, options: CleanupOptions = {}): Promise<void> {
    if (!options.deleteOldVersion) {
      return;
    }

    console.log(`Deleting secret: ${name}`);
    
    // Begin the delete operation (long-running)
    const deletePoller = await this.client.beginDeleteSecret(name);
    
    // Wait for the delete operation to complete
    console.log('Waiting for delete operation to complete...');
    const deletedSecret = await deletePoller.pollUntilDone();
    console.log(`✓ Secret deleted: ${deletedSecret.name}`);

    // If purge is requested, purge the soft-deleted secret
    if (options.purgeAfterDelete) {
      console.log('Purging deleted secret...');
      await this.client.purgeDeletedSecret(name);
      console.log(`✓ Secret purged: ${name}`);
    }
  }

  /**
   * Full rotation flow: create new version, optionally cleanup old.
   */
  async rotateAndCleanup(
    name: string,
    newValue: string,
    rotationOptions: RotationOptions = {},
    cleanupOptions: CleanupOptions = {}
  ): Promise<string> {
    // Get current versions before rotation
    const versionsBefore = await this.listSecretVersions(name);
    console.log(`Current versions of ${name}: ${versionsBefore.length}`);

    // Create new version
    const newVersion = await this.rotateSecret(name, newValue, rotationOptions);

    // If cleanup is requested and there were previous versions
    // Note: This demonstrates the delete/purge flow, but in practice
    // you'd typically keep versions for rollback capability
    if (cleanupOptions.deleteOldVersion && versionsBefore.length > 0) {
      console.log('\nPerforming cleanup (delete and purge)...');
      await this.cleanupSecret(name, cleanupOptions);
    }

    return newVersion;
  }

  /**
   * Gets the current (latest) version of a secret.
   */
  async getCurrentVersion(name: string): Promise<string | null> {
    try {
      const secret = await this.client.getSecret(name);
      return secret.properties.version || null;
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Safely rotates a secret: creates new version and optionally removes old ones.
   * Returns both old and new version IDs.
   */
  async safeRotate(
    name: string,
    newValue: string,
    options: RotationOptions & CleanupOptions = {}
  ): Promise<{ oldVersion: string | null; newVersion: string }> {
    const oldVersion = await this.getCurrentVersion(name);
    const newVersion = await this.rotateAndCleanup(name, newValue, options, options);

    return { oldVersion, newVersion };
  }
}
