import { DefaultAzureCredential } from "@azure/identity";
import {
  BlobServiceClient,
  ContainerClient,
  RestError,
} from "@azure/storage-blob";

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
if (!accountName) {
  throw new Error(
    "AZURE_STORAGE_ACCOUNT_NAME environment variable is required"
  );
}

const blobServiceUrl = `https://${accountName}.blob.core.windows.net`;
const containerName = "my-container";
const blobName = "greeting.txt";
const blobContent = "Hello Azure!";

async function createContainerIfNotExists(
  containerClient: ContainerClient
): Promise<void> {
  try {
    await containerClient.createIfNotExists();
    console.log(`Container "${containerName}" is ready.`);
  } catch (error: unknown) {
    if (error instanceof RestError) {
      console.error(
        `Failed to create container: ${error.message} (status ${error.statusCode})`
      );
    }
    throw error;
  }
}

async function uploadBlob(containerClient: ContainerClient): Promise<void> {
  try {
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.upload(blobContent, Buffer.byteLength(blobContent));
    console.log(`Uploaded blob "${blobName}" with content: "${blobContent}"`);
  } catch (error: unknown) {
    if (error instanceof RestError) {
      console.error(
        `Failed to upload blob: ${error.message} (status ${error.statusCode})`
      );
    }
    throw error;
  }
}

async function listBlobs(containerClient: ContainerClient): Promise<void> {
  console.log(`\nBlobs in "${containerName}":`);
  try {
    for await (const blob of containerClient.listBlobsFlat()) {
      console.log(`  - ${blob.name}`);
    }
  } catch (error: unknown) {
    if (error instanceof RestError) {
      console.error(
        `Failed to list blobs: ${error.message} (status ${error.statusCode})`
      );
    }
    throw error;
  }
}

async function downloadBlob(containerClient: ContainerClient): Promise<void> {
  try {
    const blobClient = containerClient.getBlockBlobClient(blobName);
    const response = await blobClient.download(0);

    if (!response.readableStreamBody) {
      throw new Error("Expected a readable stream in the download response");
    }

    const downloaded = await streamToString(response.readableStreamBody);
    console.log(`\nDownloaded blob content: "${downloaded}"`);
  } catch (error: unknown) {
    if (error instanceof RestError) {
      console.error(
        `Failed to download blob: ${error.message} (status ${error.statusCode})`
      );
    }
    throw error;
  }
}

async function deleteBlob(containerClient: ContainerClient): Promise<void> {
  try {
    const blobClient = containerClient.getBlockBlobClient(blobName);
    await blobClient.delete();
    console.log(`\nDeleted blob "${blobName}".`);
  } catch (error: unknown) {
    if (error instanceof RestError && error.statusCode === 404) {
      console.log(`Blob "${blobName}" not found; skipping delete.`);
    } else {
      throw error;
    }
  }
}

async function deleteContainer(
  containerClient: ContainerClient
): Promise<void> {
  try {
    await containerClient.delete();
    console.log(`Deleted container "${containerName}".`);
  } catch (error: unknown) {
    if (error instanceof RestError && error.statusCode === 404) {
      console.log(`Container "${containerName}" not found; skipping delete.`);
    } else {
      throw error;
    }
  }
}

async function streamToString(
  stream: NodeJS.ReadableStream
): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf-8");
}

async function main(): Promise<void> {
  const credential = new DefaultAzureCredential();
  const blobServiceClient = new BlobServiceClient(blobServiceUrl, credential);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  try {
    await createContainerIfNotExists(containerClient);
    await uploadBlob(containerClient);
    await listBlobs(containerClient);
    await downloadBlob(containerClient);
    await deleteBlob(containerClient);
    await deleteContainer(containerClient);

    console.log("\nAll CRUD operations completed successfully.");
  } catch (error: unknown) {
    if (error instanceof RestError) {
      console.error(`\nAzure Storage error: ${error.message}`);
      console.error(`  Status code : ${error.statusCode}`);
      console.error(`  Error code  : ${error.code}`);
    } else if (error instanceof Error) {
      console.error(`\nUnexpected error: ${error.message}`);
    }
    process.exitCode = 1;
  }
}

main();
