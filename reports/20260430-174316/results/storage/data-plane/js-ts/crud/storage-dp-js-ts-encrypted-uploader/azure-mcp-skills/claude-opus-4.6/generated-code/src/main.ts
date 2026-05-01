import { buildClients } from "./config";
import { KeyManager } from "./keyManager";
import { EncryptedBlobClient } from "./blobCrypto";

const CONTAINER_NAME = "encrypted-uploads";
const BLOB_NAME = "demo-secret.enc";

async function main(): Promise<void> {
  const { credential, blobServiceClient, keyClient, vaultUrl, keyName } =
    buildClients();

  const keyManager = new KeyManager(keyClient, credential, vaultUrl, keyName);
  const encryptedBlobClient = new EncryptedBlobClient(
    blobServiceClient,
    keyManager,
  );

  const sampleText = "Hello, envelope encryption with Azure Key Vault and Blob Storage!";
  console.log(`Plaintext : ${sampleText}`);

  // ── Upload (encrypt → wrap DEK → store) ──
  console.log("\nEncrypting and uploading...");
  const bundle = await encryptedBlobClient.upload(
    CONTAINER_NAME,
    BLOB_NAME,
    Buffer.from(sampleText, "utf-8"),
  );
  console.log(`Vault key ID  : ${bundle.keyId}`);
  console.log(`Wrapped DEK   : ${bundle.wrappedDek}`);

  // ── Download (fetch → unwrap DEK → decrypt) ──
  console.log("\nDownloading and decrypting...");
  const decrypted = await encryptedBlobClient.download(
    CONTAINER_NAME,
    BLOB_NAME,
  );
  const decryptedText = decrypted.toString("utf-8");
  console.log(`Decrypted     : ${decryptedText}`);

  // ── Verify round-trip ──
  if (decryptedText === sampleText) {
    console.log("\n✅ Round-trip successful – plaintext matches.");
  } else {
    console.error("\n❌ Round-trip FAILED – plaintext does not match.");
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exitCode = 1;
});
