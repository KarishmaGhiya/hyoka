import { SecretClient, DeletedSecret } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';

export interface RotateSecretOptions {
  newValue: string;
  expiresOn?: Date;
  contentType?: string;
  tags?: { [key: string]: string };
}

export class SecretRotationHelper {
  private client: SecretClient;

  constructor(vaultUrl: string) {
    const credential = new DefaultAzureCredential();
    this.client = new SecretClient(vaultUrl, credential);
  }

  /**
   * Creates a new version of a secret with updated value and expiry date.
   */
  async createNewSecretVersion(
    secretName: string,
    options: RotateSecretOptions
  ): Promise<string> {
    console.log(`Creating new version for secret '${secretName}'...`);

    const secret = await this.client.setSecret(secretName, options.newValue, {
      expiresOn: options.expiresOn,
      contentType: options.contentType,
      tags: options.tags,
    });

    console.log(
      `New version created: ${secret.properties.version} (expires: ${secret.properties.expiresOn})`
    );
    return secret.properties.version || '';
  }

  /**
   * Rotates a secret by creating a new version.
   */
  async rotateSecret(
    secretName: string,
    options: RotateSecretOptions
  ): Promise<void> {
    const version = await this.createNewSecretVersion(secretName, options);
    console.log(`Secret '${secretName}' rotated successfully (version: ${version})`);
  }

  /**
   * Safely deletes a secret using the long-running delete operation.
   * Returns the deleted secret after the operation completes.
   */
  async deleteSecret(secretName: string): Promise<DeletedSecret> {
    console.log(`Starting delete operation for secret '${secretName}'...`);

    const deletePoller = await this.client.beginDeleteSecret(secretName);
    const deletedSecret = await deletePoller.pollUntilDone();

    console.log(
      `Secret '${secretName}' deleted (scheduled purge: ${deletedSecret.properties.scheduledPurgeDate})`
    );
    return deletedSecret;
  }

  /**
   * Purges a deleted secret permanently.
   * The secret must be deleted first (soft-delete state).
   */
  async purgeDeletedSecret(secretName: string): Promise<void> {
    console.log(`Purging deleted secret '${secretName}'...`);

    await this.client.purgeDeletedSecret(secretName);

    console.log(`Secret '${secretName}' purged permanently`);
  }

  /**
   * Complete cleanup: delete and purge a secret.
   * Use this when you need to fully remove a secret for name reuse.
   */
  async deleteAndPurgeSecret(secretName: string): Promise<void> {
    console.log(`\nStarting full cleanup for secret '${secretName}'...`);

    // Step 1: Delete the secret (long-running operation)
    await this.deleteSecret(secretName);

    // Step 2: Wait a bit for delete to fully propagate
    console.log('Waiting for delete operation to propagate...');
    await this.sleep(2000);

    // Step 3: Purge the deleted secret
    await this.purgeDeletedSecret(secretName);

    console.log(`Full cleanup complete for secret '${secretName}'`);
  }

  /**
   * Lists all deleted secrets (in soft-delete state).
   */
  async listDeletedSecrets(): Promise<string[]> {
    const deletedSecrets: string[] = [];
    try {
      const iterator = this.client.listDeletedSecrets();
      for await (const deletedSecret of iterator) {
        deletedSecrets.push(deletedSecret.name);
      }
    } catch (error: any) {
      console.warn('Failed to list deleted secrets:', error.message);
    }
    return deletedSecrets;
  }

  /**
   * Recovers a deleted secret.
   */
  async recoverDeletedSecret(secretName: string): Promise<void> {
    console.log(`Recovering deleted secret '${secretName}'...`);

    const recoverPoller = await this.client.beginRecoverDeletedSecret(
      secretName
    );
    await recoverPoller.pollUntilDone();

    console.log(`Secret '${secretName}' recovered successfully`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
