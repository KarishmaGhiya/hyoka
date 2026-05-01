import {
  BlobServiceClient,
  ContainerClient,
  BlockBlobClient,
  RestError,
} from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";

// Replace with your actual storage account name
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || "<storage-account-name>";
const containerName = "my-container";
const blobName = "greeting.txt";
const blobContent = "Hello Azure!";

function getBlobServiceClient(): BlobServiceClient {
  const credential = new DefaultAzureCredential();
  const url = `https://${accountName}.blob.core.windows.net`;
  return new BlobServiceClient(url, credential);
}

async function createContainerIfNotExists(
  containerClient: ContainerClient
): Promise<void> {
  try {
    const response = await containerClient.createIfNotExists();
    if (response.succeeded) {
      console.log(`Container "${containerName}" created successfully.`);
    } else {
      console.log(`Container "${containerName}" already exists.`);
    }
  } catch (error) {
    if (error instanceof RestError) {
      console.error(
        `Failed to create container. Status: ${error.statusCode}, Message: ${error.message}`
      );
    }
    throw error;
  }
}

async function uploadBlob(blockBlobClient: BlockBlobClient): Promise<void> {
  try {
    const response = await blockBlobClient.upload(blobContent, blobContent.length);
    console.log(
      `Blob "${blobName}" uploaded successfully. Request ID: ${response.requestId}`
    );
  } catch (error) {
    if (error instanceof RestError) {
      console.error(
        `Failed to upload blob. Status: ${error.statusCode}, Message: ${error.message}`
      );
    }
    throw error;
  }
}

async function listBlobs(containerClient: ContainerClient): Promise<void> {
  try {
    console.log(`\nBlobs in container "${containerName}":`);
    for await (const blob of containerClient.listBlobsFlat()) {
      console.log(`  - ${blob.name}`);
    }
  } catch (error) {
    if (error instanceof RestError) {
      console.error(
        `Failed to list blobs. Status: ${error.statusCode}, Message: ${error.message}`
      );
    }
    throw error;
  }
}

async function downloadBlob(blockBlobClient: BlockBlobClient): Promise<void> {
  try {
    const response = await blockBlobClient.download(0);
    if (!response.readableStreamBody) {
      throw new Error("Expected a readable stream in the download response.");
    }

    const downloaded = await streamToString(response.readableStreamBody);
    console.log(`\nDownloaded blob content: "${downloaded}"`);
  } catch (error) {
    if (error instanceof RestError) {
      console.error(
        `Failed to download blob. Status: ${error.statusCode}, Message: ${error.message}`
      );
    }
    throw error;
  }
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

async function deleteBlob(blockBlobClient: BlockBlobClient): Promise<void> {
  try {
    await blockBlobClient.delete();
    console.log(`\nBlob "${blobName}" deleted successfully.`);
  } catch (error) {
    if (error instanceof RestError) {
      console.error(
        `Failed to delete blob. Status: ${error.statusCode}, Message: ${error.message}`
      );
    }
    throw error;
  }
}

async function deleteContainer(
  containerClient: ContainerClient
): Promise<void> {
  try {
    await containerClient.delete();
    console.log(`Container "${containerName}" deleted successfully.`);
  } catch (error) {
    if (error instanceof RestError) {
      console.error(
        `Failed to delete container. Status: ${error.statusCode}, Message: ${error.message}`
      );
    }
    throw error;
  }
}

async function main(): Promise<void> {
  const blobServiceClient = getBlobServiceClient();
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  // 1. Create container
  await createContainerIfNotExists(containerClient);

  // 2. Upload blob
  await uploadBlob(blockBlobClient);

  // 3. List blobs
  await listBlobs(containerClient);

  // 4. Download blob
  await downloadBlob(blockBlobClient);

  // 5. Delete blob
  await deleteBlob(blockBlobClient);

  // 6. Delete container
  await deleteContainer(containerClient);

  console.log("\nAll CRUD operations completed successfully.");
}

main().catch((error: unknown) => {
  if (error instanceof RestError) {
    console.error(`Azure RestError: [${error.statusCode}] ${error.message}`);
  } else if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
  } else {
    console.error("An unknown error occurred.", error);
  }
  process.exit(1);
});
