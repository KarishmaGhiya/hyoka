import { BlobServiceClient, ContainerClient, RestError } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";

// Replace with your actual storage account name
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || "<storage-account-name>";
const containerName = "my-container";
const blobName = "greeting.txt";
const blobContent = "Hello Azure!";

function createBlobServiceClient(): BlobServiceClient {
  const credential = new DefaultAzureCredential();
  const url = `https://${accountName}.blob.core.windows.net`;
  return new BlobServiceClient(url, credential);
}

async function createContainerIfNotExists(
  blobServiceClient: BlobServiceClient
): Promise<ContainerClient> {
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
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const uploadResponse = await blockBlobClient.upload(blobContent, Buffer.byteLength(blobContent));
  console.log(
    `Blob "${blobName}" uploaded successfully. Request ID: ${uploadResponse.requestId}`
  );
}

async function listBlobs(containerClient: ContainerClient): Promise<void> {
  console.log(`\nBlobs in container "${containerName}":`);
  for await (const blob of containerClient.listBlobsFlat()) {
    console.log(` - ${blob.name}`);
  }
}

async function downloadBlob(containerClient: ContainerClient): Promise<void> {
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const downloadResponse = await blockBlobClient.download(0);

  if (!downloadResponse.readableStreamBody) {
    throw new Error("Failed to get readable stream from download response.");
  }

  const downloaded = await streamToString(downloadResponse.readableStreamBody);
  console.log(`\nDownloaded blob content: "${downloaded}"`);
}

async function streamToString(readableStream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of readableStream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf-8");
}

async function deleteBlob(containerClient: ContainerClient): Promise<void> {
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.delete();
  console.log(`\nBlob "${blobName}" deleted successfully.`);
}

async function deleteContainer(containerClient: ContainerClient): Promise<void> {
  await containerClient.delete();
  console.log(`Container "${containerName}" deleted successfully.`);
}

async function main(): Promise<void> {
  try {
    // 1. Create the BlobServiceClient using DefaultAzureCredential
    const blobServiceClient = createBlobServiceClient();
    console.log(`Connected to storage account: ${accountName}\n`);

    // 2. Create a container if it doesn't exist
    const containerClient = await createContainerIfNotExists(blobServiceClient);

    // 3. Upload a block blob
    await uploadBlob(containerClient);

    // 4. List all blobs in the container
    await listBlobs(containerClient);

    // 5. Download the blob and print its content
    await downloadBlob(containerClient);

    // 6. Delete the blob, then delete the container
    await deleteBlob(containerClient);
    await deleteContainer(containerClient);

    console.log("\nAll CRUD operations completed successfully.");
  } catch (error: unknown) {
    if (error instanceof RestError) {
      console.error(`\nAzure RestError:`);
      console.error(`  Status code : ${error.statusCode}`);
      console.error(`  Error code  : ${error.code}`);
      console.error(`  Message     : ${error.message}`);
      console.error(`  Request ID  : ${error.request?.requestId}`);
    } else if (error instanceof Error) {
      console.error(`\nError: ${error.message}`);
    } else {
      console.error("\nAn unknown error occurred.", error);
    }
    process.exit(1);
  }
}

main();
