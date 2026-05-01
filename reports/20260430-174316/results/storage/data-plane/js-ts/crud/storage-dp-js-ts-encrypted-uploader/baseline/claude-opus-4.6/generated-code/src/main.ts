import { buildClients } from "./config";
import { KeyManager } from "./keyManager";
import { EncryptedBlobClient } from "./blobClient";

const CONTAINER_NAME = "encrypted-uploads";
const BLOB_NAME = "sample.enc";

async function main(): Promise<void> {
  const { credential, blobServiceClient, keyClient, keyName, vaultUrl } =
    buildClients();

  const keyManager = new KeyManager(keyClient, keyName, vaultUrl, credential);

  const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
  await containerClient.createIfNotExists();

  const encryptedBlobClient = new EncryptedBlobClient(containerClient, keyManager);

  // --- Round-trip demo ---
  const original = "Hello, encrypted world! 🔐";
  console.log(`Original text: ${original}`);
  console.log();

  // Upload (encrypt + wrap DEK + store)
  const bundle = await encryptedBlobClient.upload(
    BLOB_NAME,
    Buffer.from(original, "utf-8")
  );
  console.log(`Vault Key ID : ${bundle.keyId}`);
  console.log(`Wrapped DEK  : ${bundle.wrappedDek}`);
  console.log();

  // Download (fetch + unwrap DEK + decrypt)
  const decrypted = await encryptedBlobClient.download(BLOB_NAME);
  const result = decrypted.toString("utf-8");
  console.log(`Decrypted text: ${result}`);
  console.log();

  if (result === original) {
    console.log("✅ Round-trip succeeded – plaintext matches.");
  } else {
    console.error("❌ Round-trip FAILED – plaintext does not match!");
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exitCode = 1;
});
