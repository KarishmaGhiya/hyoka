import { BlobServiceClient, ContainerClient, RestError } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";

// Replace with your actual storage account name
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || "<storage-account-name>";
const containerName = "my-container";
const blobName = "greeting.txt";
const blobContent = "Hello Azure!";

async function main(): Promise<void> {
  // 1. Create a BlobServiceClient using DefaultAzureCredential
  const credential = new DefaultAzureCredential();
  const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    credential
  );
  console.log(`Connected to storage account: ${accountName}`);

  let containerClient: ContainerClient | undefined;

  try {
    // 2. Create a container if it doesn't exist
    containerClient = blobServiceClient.getContainerClient(containerName);
    const createResponse = await containerClient.createIfNotExists();
    if (createResponse.succeeded) {
      console.log(`Container "${containerName}" created.`);
    } else {
      console.log(`Container "${containerName}" already exists.`);
    }

    // 3. Upload a string as a block blob
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const uploadResponse = await blockBlobClient.upload(blobContent, Buffer.byteLength(blobContent));
    console.log(
      `Uploaded blob "${blobName}" (requestId: ${uploadResponse.requestId})`
    );

    // 4. List all blobs in the container
    console.log("\nBlobs in container:");
    for await (const blob of containerClient.listBlobsFlat()) {
      console.log(`  - ${blob.name}`);
    }

    // 5. Download the blob and print its content
    const downloadResponse = await blockBlobClient.download(0);
    const downloadedContent = await streamToString(downloadResponse.readableStreamBody!);
    console.log(`\nDownloaded blob content: "${downloadedContent}"`);

    // 6. Delete the blob, then delete the container
    await blockBlobClient.delete();
    console.log(`\nDeleted blob "${blobName}".`);

    await containerClient.delete();
    console.log(`Deleted container "${containerName}".`);
  } catch (error: unknown) {
    if (error instanceof RestError) {
      console.error(`Azure Storage error:`);
      console.error(`  Status:  ${error.statusCode}`);
      console.error(`  Code:    ${error.code}`);
      console.error(`  Message: ${error.message}`);
    } else if (error instanceof Error) {
      console.error(`Unexpected error: ${error.message}`);
    } else {
      console.error("An unknown error occurred.", error);
    }
  }
}

// Helper: read a readable stream into a string
async function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf-8");
}

main();
