import { DefaultAzureCredential } from "@azure/identity";
import { RestError } from "@azure/core-rest-pipeline";
import { BlobServiceClient } from "@azure/storage-blob";

const containerName = "my-container";
const blobName = "greeting.txt";
const blobContent = "Hello Azure!";

function getRequiredEnvVar(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function createBlobServiceClient(): BlobServiceClient {
  const accountName = getRequiredEnvVar("AZURE_STORAGE_ACCOUNT_NAME");
  const accountUrl = `https://${accountName}.blob.core.windows.net`;
  const credential = new DefaultAzureCredential();

  return new BlobServiceClient(accountUrl, credential);
}

async function streamToString(
  readableStream: NodeJS.ReadableStream | undefined,
): Promise<string> {
  if (!readableStream) {
    throw new Error("The download response did not include a readable stream.");
  }

  return await new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];

    readableStream.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    readableStream.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf-8"));
    });

    readableStream.on("error", reject);
  });
}

function logAzureError(error: RestError): void {
  console.error("Azure request failed.");
  console.error(`Status code: ${error.statusCode ?? "unknown"}`);
  console.error(`Error code: ${error.code ?? "unknown"}`);
  console.error(`Message: ${error.message}`);

  const requestId = error.response?.headers.get("x-ms-request-id");
  if (requestId) {
    console.error(`Request ID: ${requestId}`);
  }
}

async function main(): Promise<void> {
  const blobServiceClient = createBlobServiceClient();
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  // Use a dedicated container for this sample because it deletes the container at the end.
  const createContainerResult = await containerClient.createIfNotExists();
  console.log(
    createContainerResult.succeeded
      ? `Created container "${containerName}".`
      : `Container "${containerName}" already exists.`,
  );

  await blockBlobClient.upload(blobContent, Buffer.byteLength(blobContent));
  console.log(`Uploaded "${blobName}" with content: "${blobContent}"`);

  console.log("Blobs in the container:");
  for await (const blob of containerClient.listBlobsFlat()) {
    console.log(`- ${blob.name}`);
  }

  const downloadResponse = await blockBlobClient.download();
  const downloadedContent = await streamToString(
    downloadResponse.readableStreamBody,
  );
  console.log(`Downloaded content: ${downloadedContent}`);

  await blockBlobClient.delete();
  console.log(`Deleted blob "${blobName}".`);

  await containerClient.delete();
  console.log(`Deleted container "${containerName}".`);
}

main().catch((error: unknown) => {
  if (error instanceof RestError) {
    logAzureError(error);
  } else if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error("Unexpected error:", error);
  }

  process.exitCode = 1;
});
