import { DefaultAzureCredential } from "@azure/identity";
import {
  BlobServiceClient,
  RestError,
  type BlobDownloadResponseParsed,
} from "@azure/storage-blob";

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const containerName = "my-container";
const blobName = "greeting.txt";
const blobContent = "Hello Azure!";

async function streamToString(
  downloadResponse: BlobDownloadResponseParsed,
): Promise<string> {
  const stream = downloadResponse.readableStreamBody;

  if (!stream) {
    throw new Error("Blob download did not return a readable stream.");
  }

  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf-8");
}

function handleAzureError(error: unknown): never {
  if (error instanceof RestError) {
    console.error("Azure request failed.");
    console.error(`Status: ${error.statusCode ?? "unknown"}`);
    console.error(`Code: ${error.code ?? "unknown"}`);
    console.error(`Message: ${error.message}`);
    process.exit(1);
  }

  if (error instanceof Error) {
    console.error(error.message);
    process.exit(1);
  }

  console.error("An unexpected error occurred.", error);
  process.exit(1);
}

async function main(): Promise<void> {
  if (!accountName) {
    throw new Error(
      "Set the AZURE_STORAGE_ACCOUNT_NAME environment variable before running this program.",
    );
  }

  const credential = new DefaultAzureCredential();
  const serviceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    credential,
  );
  const containerClient = serviceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  console.log(`Ensuring container "${containerName}" exists...`);
  await containerClient.createIfNotExists();

  console.log(`Uploading blob "${blobName}"...`);
  await blockBlobClient.upload(blobContent, Buffer.byteLength(blobContent));

  console.log(`Blobs in "${containerName}":`);
  for await (const blob of containerClient.listBlobsFlat()) {
    console.log(`- ${blob.name}`);
  }

  console.log(`Downloading blob "${blobName}"...`);
  const downloadResponse = await blockBlobClient.download();
  const downloadedText = await streamToString(downloadResponse);
  console.log(`Blob content: ${downloadedText}`);

  console.log(`Deleting blob "${blobName}"...`);
  await blockBlobClient.delete();

  console.log(`Deleting container "${containerName}"...`);
  await containerClient.delete();
}

try {
  await main();
} catch (error: unknown) {
  handleAzureError(error);
}
