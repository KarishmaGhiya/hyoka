import {
  BlobServiceClient,
  ContainerClient,
  RestError,
} from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
if (!accountName) {
  throw new Error(
    "AZURE_STORAGE_ACCOUNT_NAME environment variable is not set"
  );
}

const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  new DefaultAzureCredential()
);

const containerName = "my-container";
const blobName = "greeting.txt";
const blobContent = "Hello Azure!";

async function createContainer(): Promise<ContainerClient> {
  console.log(`Creating container "${containerName}" if it doesn't exist...`);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const createResponse = await containerClient.createIfNotExists();
  if (createResponse.succeeded) {
    console.log(`Container "${containerName}" created successfully.`);
  } else {
    console.log(`Container "${containerName}" already exists.`);
  }
  return containerClient;
}

async function uploadBlob(containerClient: ContainerClient): Promise<void> {
  console.log(`\nUploading blob "${blobName}"...`);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const uploadResponse = await blockBlobClient.upload(
    blobContent,
    Buffer.byteLength(blobContent)
  );
  console.log(
    `Blob "${blobName}" uploaded successfully. Request ID: ${uploadResponse.requestId}`
  );
}

async function listBlobs(containerClient: ContainerClient): Promise<void> {
  console.log(`\nListing blobs in container "${containerName}":`);
  for await (const blob of containerClient.listBlobsFlat()) {
    console.log(`  - ${blob.name}`);
  }
}

async function downloadBlob(containerClient: ContainerClient): Promise<void> {
  console.log(`\nDownloading blob "${blobName}"...`);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const downloadResponse = await blockBlobClient.download(0);

  if (!downloadResponse.readableStreamBody) {
    throw new Error("Failed to get readable stream from download response");
  }

  const downloaded = await streamToString(
    downloadResponse.readableStreamBody
  );
  console.log(`Blob content: "${downloaded}"`);
}

async function streamToString(
  readableStream: NodeJS.ReadableStream
): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of readableStream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf-8");
}

async function deleteBlob(containerClient: ContainerClient): Promise<void> {
  console.log(`\nDeleting blob "${blobName}"...`);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.delete();
  console.log(`Blob "${blobName}" deleted successfully.`);
}

async function deleteContainer(
  containerClient: ContainerClient
): Promise<void> {
  console.log(`\nDeleting container "${containerName}"...`);
  await containerClient.delete();
  console.log(`Container "${containerName}" deleted successfully.`);
}

async function main(): Promise<void> {
  try {
    const containerClient = await createContainer();
    await uploadBlob(containerClient);
    await listBlobs(containerClient);
    await downloadBlob(containerClient);
    await deleteBlob(containerClient);
    await deleteContainer(containerClient);

    console.log("\nAll CRUD operations completed successfully.");
  } catch (error: unknown) {
    if (error instanceof RestError) {
      console.error(`Azure Storage error:`);
      console.error(`  Status code: ${error.statusCode}`);
      console.error(`  Message: ${error.message}`);
      console.error(`  Error code: ${error.code}`);
      console.error(`  Request ID: ${error.request?.requestId}`);
    } else if (error instanceof Error) {
      console.error(`Unexpected error: ${error.message}`);
    } else {
      console.error("An unknown error occurred:", error);
    }
    process.exit(1);
  }
}

main();
