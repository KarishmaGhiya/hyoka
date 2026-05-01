import { buildConfig } from "./config";
import { KeyManager } from "./keyManager";
import { EncryptedBlobClient } from "./blobCrypto";

async function main(): Promise<void> {
  const config = buildConfig();

  const keyManager = new KeyManager(
    config.keyClient,
    config.credential,
    config.vaultKeyName,
  );

  const blobClient = new EncryptedBlobClient(
    config.blobServiceClient,
    config.containerName,
    keyManager,
  );

  const sampleText = "Hello from encrypted blob uploader! 🔐";
  const blobName = `demo-${Date.now()}.enc`;

  console.log(`\n=== Encrypted Blob Upload/Download Demo ===\n`);
  console.log(`Original text : ${sampleText}`);
  console.log(`Blob name     : ${blobName}\n`);

  // --- Upload ---
  console.log("Encrypting and uploading...");
  const { vaultKeyId, wrappedDekBase64 } = await blobClient.upload(
    blobName,
    Buffer.from(sampleText, "utf-8"),
  );
  console.log(`Vault key ID  : ${vaultKeyId}`);
  console.log(`Wrapped DEK   : ${wrappedDekBase64}\n`);

  // --- Download ---
  console.log("Downloading and decrypting...");
  const decrypted = await blobClient.download(blobName);
  const decryptedText = decrypted.toString("utf-8");

  console.log(`Decrypted text: ${decryptedText}\n`);

  // --- Verify ---
  if (decryptedText === sampleText) {
    console.log("✅ Round-trip verification succeeded!");
  } else {
    console.error("❌ Round-trip verification FAILED!");
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exitCode = 1;
});
