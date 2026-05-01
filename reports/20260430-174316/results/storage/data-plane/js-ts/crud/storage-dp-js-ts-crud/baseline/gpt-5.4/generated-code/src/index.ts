import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";
import { RestError } from "@azure/core-rest-pipeline";

async function streamToString(
  readableStream: NodeJS.ReadableStream | undefined,
): Promise<string> {
  if (!readableStream) {
    return "";
  }

  const chunks: Buffer[] = [];

  for await (const chunk of readableStream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf-8");
}

async function main(): Promise<void> {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;

  if (!accountName) {
    throw new Error(
      "Missing AZURE_STORAGE_ACCOUNT_NAME. Set it to your Azure Storage account name before running this program.",
    );
  }

  const credential = new DefaultAzureCredential();
  const serviceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    credential,
  );

  const containerName = "my-container";
  const blobName = "greeting.txt";
  const content = "Hello Azure!";

  const containerClient = serviceClient.getContainerClient(containerName);
  await containerClient.createIfNotExists();
  console.log(`Container ready: ${containerName}`);

  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.upload(content, Buffer.byteLength(content));
  console.log(`Uploaded blob: ${blobName}`);

  console.log("Blobs in container:");
  for await (const blob of containerClient.listBlobsFlat()) {
    console.log(`- ${blob.name}`);
  }

  const downloadResponse = await blockBlobClient.download();
  const downloadedContent = await streamToString(downloadResponse.readableStreamBody);
  console.log(`Downloaded content: ${downloadedContent}`);

  await blockBlobClient.delete();
  console.log(`Deleted blob: ${blobName}`);

  await containerClient.delete();
  console.log(`Deleted container: ${containerName}`);
}

main().catch((error: unknown) => {
  if (error instanceof RestError) {
    console.error("Azure REST error:");
    console.error(`- name: ${error.name}`);
    console.error(`- code: ${error.code ?? "unknown"}`);
    console.error(`- status code: ${error.statusCode ?? "unknown"}`);
    console.error(`- message: ${error.message}`);
  } else if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
  } else {
    console.error("Unknown error:", error);
  }

  process.exitCode = 1;
});
