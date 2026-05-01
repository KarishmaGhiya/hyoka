import { randomUUID } from "node:crypto";
import { createAzureClients } from "./config";
import { EncryptedBlobStorage } from "./encryptedBlobStorage";
import { KeyVaultEnvelopeKeyManager } from "./keyManager";

async function main(): Promise<void> {
  const { config, credential, blobServiceClient, keyClient } = createAzureClients();
  const keyManager = new KeyVaultEnvelopeKeyManager(
    keyClient,
    credential,
    config.keyName,
    config.keyVersion
  );
  const encryptedBlobStorage = new EncryptedBlobStorage(
    blobServiceClient.getContainerClient(config.blobContainerName),
    keyManager
  );

  const blobName = `encrypted-demo-${randomUUID()}.bin`;
  const sampleText = "Hello from Azure Blob Storage client-side encryption with Azure Key Vault Keys.";
  const uploadResult = await encryptedBlobStorage.uploadText(blobName, sampleText);
  const decryptedText = await encryptedBlobStorage.downloadText(blobName);

  console.log(`Vault key ID used: ${uploadResult.keyId}`);
  console.log(`Wrapped DEK (base64): ${uploadResult.wrappedDataKeyBase64}`);
  console.log(`Decrypted output: ${decryptedText}`);
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error(error.message);

    if (error.cause instanceof Error) {
      console.error(`Cause: ${error.cause.message}`);
    }
  } else {
    console.error("An unknown error occurred.");
  }

  process.exitCode = 1;
});
