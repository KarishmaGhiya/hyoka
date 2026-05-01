import {
  BlobServiceClient,
  ContainerClient,
  BlockBlobClient,
  RestError,
} from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";

const ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const CONTAINER_NAME = "my-container";
const BLOB_NAME = "greeting.txt";
const BLOB_CONTENT = "Hello Azure!";

function getBlobServiceClient(): BlobServiceClient {
  if (!ACCOUNT_NAME) {
    throw new Error(
      "Set the AZURE_STORAGE_ACCOUNT_NAME environment variable before running this sample."
    );
  }
  const url = `https://${ACCOUNT_NAME}.blob.core.windows.net`;
  return new BlobServiceClient(url, new DefaultAzureCredential());
}

async function createContainer(
  serviceClient: BlobServiceClient
): Promise<ContainerClient> {
  const containerClient = serviceClient.getContainerClient(CONTAINER_NAME);
  const createResponse = await containerClient.createIfNotExists();
  if (createResponse.succeeded) {
    console.log(`Container "${CONTAINER_NAME}" created.`);
  } else {
    console.log(`Container "${CONTAINER_NAME}" already exists.`);
  }
  return containerClient;
}

async function uploadBlob(
  containerClient: ContainerClient
): Promise<BlockBlobClient> {
  const blockBlobClient = containerClient.getBlockBlobClient(BLOB_NAME);
  const uploadResponse = await blockBlobClient.upload(
    BLOB_CONTENT,
    Buffer.byteLength(BLOB_CONTENT)
  );
  console.log(
    `Blob "${BLOB_NAME}" uploaded (requestId: ${uploadResponse.requestId}).`
  );
  return blockBlobClient;
}

async function listBlobs(containerClient: ContainerClient): Promise<void> {
  console.log(`\nBlobs in "${CONTAINER_NAME}":`);
  for await (const blob of containerClient.listBlobsFlat()) {
    console.log(`  - ${blob.name}`);
  }
}

async function downloadBlob(
  blockBlobClient: BlockBlobClient
): Promise<void> {
  const downloadResponse = await blockBlobClient.downloadToBuffer();
  const content = downloadResponse.toString();
  console.log(`\nDownloaded blob content: "${content}"`);
}

async function deleteResources(
  blockBlobClient: BlockBlobClient,
  containerClient: ContainerClient
): Promise<void> {
  await blockBlobClient.deleteIfExists();
  console.log(`\nBlob "${BLOB_NAME}" deleted.`);

  await containerClient.deleteIfExists();
  console.log(`Container "${CONTAINER_NAME}" deleted.`);
}

async function main(): Promise<void> {
  try {
    const serviceClient = getBlobServiceClient();

    // 1. Create container
    const containerClient = await createContainer(serviceClient);

    // 2. Upload blob
    const blockBlobClient = await uploadBlob(containerClient);

    // 3. List blobs
    await listBlobs(containerClient);

    // 4. Download blob
    await downloadBlob(blockBlobClient);

    // 5. Delete blob and container
    await deleteResources(blockBlobClient, containerClient);

    console.log("\nAll CRUD operations completed successfully.");
  } catch (error: unknown) {
    if (error instanceof RestError) {
      console.error(`Azure Storage error:`);
      console.error(`  Status : ${error.statusCode}`);
      console.error(`  Code   : ${error.code}`);
      console.error(`  Message: ${error.message}`);
    } else if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error("An unknown error occurred.", error);
    }
    process.exit(1);
  }
}

main();
