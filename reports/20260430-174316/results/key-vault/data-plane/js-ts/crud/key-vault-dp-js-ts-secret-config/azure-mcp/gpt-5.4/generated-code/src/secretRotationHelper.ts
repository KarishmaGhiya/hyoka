import { SecretClient } from "@azure/keyvault-secrets";

import { RotationOptions, RotationResult } from "./types";

export class SecretRotationHelper {
  public constructor(private readonly client: SecretClient) {}

  public async rotateSecret(
    name: string,
    value: string,
    options: RotationOptions
  ): Promise<RotationResult> {
    const secret = await this.client.setSecret(name, value, {
      enabled: options.enabled,
      expiresOn: options.expiresOn,
      notBefore: options.notBefore,
      tags: options.tags
    });

    return {
      name: secret.name,
      version: secret.properties.version,
      value: secret.value ?? "",
      expiresOn: secret.properties.expiresOn
    };
  }

  public async deleteAndPurgeSecret(name: string): Promise<void> {
    const deletePoller = await this.client.beginDeleteSecret(name);
    await deletePoller.pollUntilDone();
    await this.client.purgeDeletedSecret(name);
  }
}
