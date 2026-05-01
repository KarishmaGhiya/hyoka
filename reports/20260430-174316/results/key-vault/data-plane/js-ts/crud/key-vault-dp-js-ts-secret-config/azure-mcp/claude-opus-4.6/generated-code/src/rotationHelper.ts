import { SecretClient } from "@azure/keyvault-secrets";

export interface RotateOptions {
  /** New plain-text value for the secret. */
  newValue: string;
  /** Expiry for the new version. */
  expiresOn: Date;
  /** If true, delete + purge the previous version's secret name (full cleanup). */
  cleanupOld?: boolean;
}

export class SecretRotationHelper {
  constructor(private readonly client: SecretClient) {}

  /**
   * Rotate a secret:
   * 1. Set a new version with the updated value and expiry.
   * 2. Optionally delete and purge the old secret for full name reuse.
   *
   * Key Vault's soft-delete means `beginDeleteSecret` returns a long-running
   * operation — we poll until deletion completes before calling `purgeDeletedSecret`.
   */
  async rotate(
    secretName: string,
    options: RotateOptions
  ): Promise<{ newVersion: string }> {
    // Step 1 — create a new version
    console.log(`  [rotate] Setting new version of "${secretName}" …`);
    const updated = await this.client.setSecret(secretName, options.newValue, {
      expiresOn: options.expiresOn,
    });
    const newVersion = updated.properties.version ?? "unknown";
    console.log(`  [rotate] New version created: ${newVersion}`);

    // Step 2 — optional cleanup of the old secret (delete → purge)
    if (options.cleanupOld) {
      console.log(`  [rotate] Starting delete of "${secretName}" …`);
      const poller = await this.client.beginDeleteSecret(secretName);
      // Wait for the long-running delete to complete
      await poller.pollUntilDone();
      console.log(`  [rotate] Delete completed. Purging …`);

      await this.client.purgeDeletedSecret(secretName);
      console.log(`  [rotate] Purge completed for "${secretName}".`);
    }

    return { newVersion };
  }
}
