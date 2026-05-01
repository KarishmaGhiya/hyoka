import { createAzureClients } from "./config";
import { EncryptedBlobClient } from "./encryptedBlobClient";
import { KeyVaultEnvelopeKeyManager, formatAzureError } from "./keyVaultEnvelopeKeyManager";

async function main(): Promise<void> {
  const azureClients = createAzureClients();
  const keyManager = new KeyVaultEnvelopeKeyManager(
    azureClients.keyClient,
    azureClients.credential,
    azureClients.config.keyName,
    azureClients.config.keyVersion,
  );
  const encryptedBlobClient = new EncryptedBlobClient(azureClients.containerClient, keyManager);

  const sampleText = "Hello from client-side envelope encryption with Azure Blob Storage and Azure Key Vault Keys.";
  const blobName = `encrypted-demo-${Date.now()}.bin`;

  const uploadResult = await encryptedBlobClient.uploadText(blobName, sampleText);
  const decryptedText = await encryptedBlobClient.downloadText(blobName);

  console.log(`Blob name: ${uploadResult.blobName}`);
  console.log(`Vault key ID used: ${uploadResult.vaultKeyId}`);
  console.log(`Wrapped DEK (base64): ${uploadResult.wrappedDataKeyBase64}`);
  console.log(`Decrypted output: ${decryptedText}`);
}

main().catch((error: unknown) => {
  console.error(`Demo failed: ${formatAzureError(error)}`);
  process.exitCode = 1;
});
