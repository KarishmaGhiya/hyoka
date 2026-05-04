import { createAzureClients } from "./config";
import { KeyManager } from "./keyManager";
import { EncryptedBlobClient } from "./encryptedBlobClient";

/**
 * Demo: encrypt-upload-download-decrypt round-trip.
 *
 * Required environment variables:
 *   AZURE_KEYVAULT_URL        – e.g. https://my-vault.vault.azure.net
 *   AZURE_STORAGE_ACCOUNT_URL – e.g. https://mystorageaccount.blob.core.windows.net
 *   VAULT_KEY_NAME            – name of an RSA key in the vault
 *   BLOB_CONTAINER_NAME       – target blob container (must exist)
 */
async function main(): Promise<void> {
  const vaultKeyName = requireEnv("VAULT_KEY_NAME");
  const containerName = requireEnv("BLOB_CONTAINER_NAME");

  const { credential, keyClient, blobServiceClient } = createAzureClients();

  const keyManager = new KeyManager(keyClient, credential);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const encryptedBlob = new EncryptedBlobClient(
    containerClient,
    keyManager,
    vaultKeyName
  );

  const sampleText = "Hello from the encrypted blob uploader! 🔐";
  const blobName = `demo/sample-${Date.now()}.enc`;

  console.log("=== Encrypted Blob Upload / Download Demo ===\n");
  console.log(`  Plaintext : ${sampleText}`);
  console.log(`  Blob name : ${blobName}\n`);

  // Upload
  console.log("Encrypting and uploading...");
  const { vaultKeyId, wrappedDekBase64 } = await encryptedBlob.upload(
    blobName,
    Buffer.from(sampleText, "utf-8")
  );
  console.log(`  Vault key ID  : ${vaultKeyId}`);
  console.log(`  Wrapped DEK   : ${wrappedDekBase64}\n`);

  // Download
  console.log("Downloading and decrypting...");
  const decrypted = await encryptedBlob.download(blobName);
  const decryptedText = decrypted.toString("utf-8");
  console.log(`  Decrypted     : ${decryptedText}\n`);

  // Verify
  if (decryptedText === sampleText) {
    console.log("✅ Round-trip successful — plaintext matches.");
  } else {
    console.error("❌ Round-trip FAILED — decrypted text does not match.");
    process.exitCode = 1;
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exitCode = 1;
});
