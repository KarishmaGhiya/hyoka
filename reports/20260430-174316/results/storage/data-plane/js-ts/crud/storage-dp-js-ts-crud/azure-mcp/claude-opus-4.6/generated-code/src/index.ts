import {
  BlobServiceClient,
  ContainerClient,
  BlockBlobClient,
  RestError,
} from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
if (!accountName) {
  throw new Error(
    "AZURE_STORAGE_ACCOUNT_NAME environment variable is required"
  );
}

const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  new DefaultAzureCredential()
);

const containerName = "my-container";
const blobName = "greeting.txt";
const blobContent = "Hello Azure!";

async function createContainer(
  client: BlobServiceClient,
  name: string
): Promise<ContainerClient> {
  const containerClient = client.getContainerClient(name);
  const createResponse = await containerClient.createIfNotExists();
  if (createResponse.succeeded) {
    console.log(`Container "${name}" created.`);
  } else {
    console.log(`Container "${name}" already exists.`);
  }
  return containerClient;
}

async function uploadBlob(
  containerClient: ContainerClient,
  name: string,
  content: string
): Promise<BlockBlobClient> {
  const blockBlobClient = containerClient.getBlockBlobClient(name);
  const uploadResponse = await blockBlobClient.upload(content, content.length);
  console.log(
    `Blob "${name}" uploaded (request id: ${uploadResponse.requestId}).`
  );
  return blockBlobClient;
}

async function listBlobs(containerClient: ContainerClient): Promise<void> {
  console.log(`\nBlobs in "${containerClient.containerName}":`);
  for await (const blob of containerClient.listBlobsFlat()) {
    console.log(`  - ${blob.name}`);
  }
}

async function downloadBlob(
  blockBlobClient: BlockBlobClient
): Promise<string> {
  const downloadResponse = await blockBlobClient.download(0);
  const body = downloadResponse.readableStreamBody;
  if (!body) {
    throw new Error("Expected a readable stream from download response.");
  }
  const downloaded = await streamToString(body);
  console.log(`\nDownloaded blob content: "${downloaded}"`);
  return downloaded;
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

async function deleteBlob(blockBlobClient: BlockBlobClient): Promise<void> {
  await blockBlobClient.delete();
  console.log(`Blob "${blockBlobClient.name}" deleted.`);
}

async function deleteContainer(
  containerClient: ContainerClient
): Promise<void> {
  await containerClient.delete();
  console.log(`Container "${containerClient.containerName}" deleted.`);
}

async function main(): Promise<void> {
  try {
    // 1. Create container
    const containerClient = await createContainer(
      blobServiceClient,
      containerName
    );

    // 2. Upload blob
    const blockBlobClient = await uploadBlob(
      containerClient,
      blobName,
      blobContent
    );

    // 3. List blobs
    await listBlobs(containerClient);

    // 4. Download blob
    await downloadBlob(blockBlobClient);

    // 5. Delete blob, then container
    await deleteBlob(blockBlobClient);
    await deleteContainer(containerClient);

    console.log("\nAll CRUD operations completed successfully.");
  } catch (error: unknown) {
    if (error instanceof RestError) {
      console.error(`Azure RestError: ${error.message}`);
      console.error(`  Status code : ${error.statusCode}`);
      console.error(`  Error code  : ${error.code}`);
      console.error(`  Request ID  : ${error.request?.requestId}`);
    } else if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error("An unknown error occurred.", error);
    }
    process.exitCode = 1;
  }
}

main();
