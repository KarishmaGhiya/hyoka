import { buildConfig } from "./config";
import { EncryptedBlobClient } from "./blobCrypto";

const CONTAINER_NAME = "encrypted-uploads";
const BLOB_NAME = "demo-secret.enc";
const SAMPLE_PLAINTEXT = "Hello from the encrypted blob uploader! 🔐";

async function main(): Promise<void> {
  console.log("=== Encrypted Blob Upload/Download Demo ===\n");

  // 1. Build Azure connections from environment variables
  const config = buildConfig();
  const client = new EncryptedBlobClient(config, CONTAINER_NAME);

  // 2. Encrypt and upload
  const plainBuffer = Buffer.from(SAMPLE_PLAINTEXT, "utf-8");
  console.log(`Uploading "${SAMPLE_PLAINTEXT}" as "${BLOB_NAME}"...`);

  const { keyId, wrappedDek } = await client.upload(BLOB_NAME, plainBuffer);

  console.log(`\n  Vault Key ID : ${keyId}`);
  console.log(`  Wrapped DEK  : ${wrappedDek.toString("base64")}`);

  // 3. Download and decrypt
  console.log(`\nDownloading and decrypting "${BLOB_NAME}"...`);
  const decrypted = await client.download(BLOB_NAME);
  const decryptedText = decrypted.toString("utf-8");

  console.log(`\n  Decrypted    : ${decryptedText}`);

  // 4. Verify round-trip
  if (decryptedText === SAMPLE_PLAINTEXT) {
    console.log("\n✅ Round-trip successful – plaintext matches!");
  } else {
    console.error("\n❌ Round-trip FAILED – plaintext does not match.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
