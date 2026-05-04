import { buildAzureConfig } from "./config";
import { KeyManager } from "./keyManager";
import { EncryptedBlobClient } from "./encryptedBlobClient";

async function main(): Promise<void> {
  const containerName = process.env.CONTAINER_NAME ?? "encrypted-uploads";
  const blobName = `sample-${Date.now()}.enc`;
  const sampleText = "Hello, encrypted world! This is a round-trip test.";

  console.log("=== Encrypted Blob Upload / Download Demo ===\n");
  console.log(`  Container : ${containerName}`);
  console.log(`  Blob      : ${blobName}`);
  console.log(`  Plaintext : "${sampleText}"\n`);

  // Build shared config
  const config = buildAzureConfig();
  const keyManager = new KeyManager(
    config.keyClient,
    config.credential,
    config.keyVaultKeyName
  );
  const encryptedBlobClient = new EncryptedBlobClient(
    config.blobServiceClient,
    keyManager
  );

  // Encrypt & upload
  console.log("[1/2] Encrypting and uploading...");
  const { keyId, wrappedDekBase64 } = await encryptedBlobClient.upload(
    containerName,
    blobName,
    Buffer.from(sampleText, "utf-8")
  );

  console.log(`  Vault key ID  : ${keyId}`);
  console.log(`  Wrapped DEK   : ${wrappedDekBase64}`);

  // Download & decrypt
  console.log("\n[2/2] Downloading and decrypting...");
  const decrypted = await encryptedBlobClient.download(containerName, blobName);
  const decryptedText = decrypted.toString("utf-8");

  console.log(`  Decrypted     : "${decryptedText}"`);

  // Verify round-trip
  if (decryptedText === sampleText) {
    console.log("\n✓ Round-trip succeeded – plaintext matches.");
  } else {
    console.error("\n✗ Round-trip FAILED – plaintext does not match!");
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exitCode = 1;
});
