import { BlobServiceClient, BlockBlobClient, ContainerClient } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";
import { RestError } from "@azure/core-rest-pipeline";
import { Readable } from "node:stream";

const containerName = "my-container";
const blobName = "greeting.txt";
const blobContent = "Hello Azure!";

function getStorageAccountUrl(): string {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;

  if (!accountName) {
    throw new Error(
      "Set the AZURE_STORAGE_ACCOUNT_NAME environment variable before running this sample.",
    );
  }

  return `https://${accountName}.blob.core.windows.net`;
}

async function streamToString(
  readableStream: Readable | NodeJS.ReadableStream | null | undefined,
): Promise<string> {
  if (!readableStream) {
    throw new Error("Azure Blob download did not return a readable stream.");
  }

  const chunks: Buffer[] = [];

  for await (const chunk of readableStream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf-8");
}

function logError(error: unknown): void {
  if (error instanceof AggregateError) {
    console.error(error.message);

    for (const nestedError of error.errors) {
      logError(nestedError);
    }

    return;
  }

  if (error instanceof RestError) {
    console.error(`Azure request failed: ${error.message}`);
    console.error(`Status: ${error.statusCode ?? "unknown"}, Code: ${error.code ?? "unknown"}`);

    if (error.details) {
      console.error("Details:", error.details);
    }

    return;
  }

  if (error instanceof Error) {
    console.error(error.message);
    return;
  }

  console.error("Unexpected failure:", error);
}

async function cleanupOnFailure(
  containerClient: ContainerClient,
  blobClient: BlockBlobClient,
  blobExists: boolean,
  containerExists: boolean,
): Promise<void> {
  const cleanupErrors: Error[] = [];

  if (blobExists) {
    try {
      const deletedBlob = await blobClient.deleteIfExists();
      console.error(
        deletedBlob.succeeded
          ? `Cleanup deleted blob "${blobName}".`
          : `Cleanup skipped blob "${blobName}" because it was already absent.`,
      );
    } catch (error) {
      cleanupErrors.push(error instanceof Error ? error : new Error(String(error)));
    }
  }

  if (containerExists) {
    try {
      const deletedContainer = await containerClient.deleteIfExists();
      console.error(
        deletedContainer.succeeded
          ? `Cleanup deleted container "${containerName}".`
          : `Cleanup skipped container "${containerName}" because it was already absent.`,
      );
    } catch (error) {
      cleanupErrors.push(error instanceof Error ? error : new Error(String(error)));
    }
  }

  if (cleanupErrors.length === 1) {
    throw cleanupErrors[0];
  }

  if (cleanupErrors.length > 1) {
    throw new AggregateError(cleanupErrors, "Cleanup encountered multiple failures.");
  }
}

async function main(): Promise<void> {
  const credential = new DefaultAzureCredential();
  const serviceClient = new BlobServiceClient(getStorageAccountUrl(), credential);
  const containerClient = serviceClient.getContainerClient(containerName);
  const blobClient = containerClient.getBlockBlobClient(blobName);

  let containerExists = false;
  let blobExists = false;

  try {
    const containerResult = await containerClient.createIfNotExists();
    containerExists = true;
    console.log(
      containerResult.succeeded
        ? `Created container "${containerName}".`
        : `Container "${containerName}" already exists.`,
    );

    await blobClient.upload(blobContent, Buffer.byteLength(blobContent), {
      blobHTTPHeaders: {
        blobContentType: "text/plain; charset=utf-8",
      },
    });
    blobExists = true;
    console.log(`Uploaded blob "${blobName}".`);

    console.log("Blobs in container:");
    for await (const blob of containerClient.listBlobsFlat()) {
      console.log(`- ${blob.name}`);
    }

    const downloadResponse = await blobClient.download();
    const downloadedText = await streamToString(downloadResponse.readableStreamBody);
    console.log(`Downloaded content: ${downloadedText}`);

    await blobClient.delete();
    blobExists = false;
    console.log(`Deleted blob "${blobName}".`);

    await containerClient.delete();
    containerExists = false;
    console.log(`Deleted container "${containerName}".`);
  } catch (error) {
    try {
      await cleanupOnFailure(containerClient, blobClient, blobExists, containerExists);
    } catch (cleanupError) {
      throw new AggregateError(
        [
          error instanceof Error ? error : new Error(String(error)),
          cleanupError instanceof Error ? cleanupError : new Error(String(cleanupError)),
        ],
        "Blob operations failed and cleanup did not complete cleanly.",
      );
    }

    throw error;
  }
}

void main().catch((error: unknown) => {
  logError(error);
  process.exitCode = 1;
});
