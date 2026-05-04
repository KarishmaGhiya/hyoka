import { DefaultAzureCredential, TokenCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";
import { KeyClient, CryptographyClient } from "@azure/keyvault-keys";

/**
 * Environment variable names used for configuration.
 */
const ENV = {
  KEY_VAULT_URL: "AZURE_KEYVAULT_URL",
  STORAGE_ACCOUNT_URL: "AZURE_STORAGE_ACCOUNT_URL",
} as const;

export interface AzureClients {
  credential: TokenCredential;
  keyClient: KeyClient;
  blobServiceClient: BlobServiceClient;
  /**
   * Returns a CryptographyClient bound to a specific Key Vault key.
   * A new client is created per key so callers can work with different keys.
   */
  getCryptoClient: (keyName: string) => Promise<CryptographyClient>;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Build all Azure SDK clients from environment variables and a single
 * managed-identity credential instance.
 */
export function createAzureClients(): AzureClients {
  const vaultUrl = requireEnv(ENV.KEY_VAULT_URL);
  const storageUrl = requireEnv(ENV.STORAGE_ACCOUNT_URL);

  const credential = new DefaultAzureCredential();
  const keyClient = new KeyClient(vaultUrl, credential);
  const blobServiceClient = new BlobServiceClient(storageUrl, credential);

  const getCryptoClient = async (
    keyName: string
  ): Promise<CryptographyClient> => {
    const key = await keyClient.getKey(keyName);
    if (!key.id) {
      throw new Error(`Key "${keyName}" has no ID — cannot create CryptographyClient`);
    }
    return new CryptographyClient(key.id, credential);
  };

  return { credential, keyClient, blobServiceClient, getCryptoClient };
}
