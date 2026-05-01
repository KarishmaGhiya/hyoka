import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { AzureBlobStorageService } from "./blobService";
import { createBlobServiceClient, loadBlobStorageConfig } from "./config";

async function main(): Promise<void> {
  const config = loadBlobStorageConfig();
  const blobServiceClient = createBlobServiceClient(config);
  const service = new AzureBlobStorageService(
    blobServiceClient.getContainerClient(config.containerName),
  );
  const demoDirectory = await mkdtemp(join(tmpdir(), "azure-blob-demo-"));
  const blobName = "sample-blob.txt";
  const sampleFilePath = join(demoDirectory, blobName);
  const initialContent = "Hello from the Azure Blob Storage demo.";
  const updatedContent = "Hello again from the leased overwrite demo.";

  try {
    console.log(`Using storage endpoint: ${config.endpoint}`);
    console.log(`Using container: ${config.containerName}`);

    console.log("Ensuring the container exists...");
    await service.ensureContainerExists();

    console.log("Creating a sample file...");
    await writeFile(sampleFilePath, initialContent, "utf8");

    console.log("Uploading the sample file with metadata and index tags...");
    await service.upload(blobName, sampleFilePath, {
      metadata: {
        source: "demo-script",
        contentType: "text",
      },
      tags: {
        scenario: "demo",
        stage: "initial-upload",
      },
    });

    console.log("Listing blobs in the container...");
    const blobs = await service.listBlobs();
    for (const blob of blobs) {
      console.log(
        `- ${blob.name} (${blob.sizeInBytes} bytes)${
          blob.lastModified ? `, last modified ${blob.lastModified}` : ""
        }`,
      );
    }

    console.log("Downloading the blob...");
    const downloadedContent = await service.download(blobName);
    console.log(downloadedContent.toString("utf8"));

    console.log("Updating the local sample file...");
    await writeFile(sampleFilePath, updatedContent, "utf8");

    console.log("Acquiring a lease before overwriting the blob...");
    const leaseClient = await service.acquireLease(blobName);

    try {
      console.log(`Lease acquired: ${leaseClient.leaseId}`);
      console.log("Overwriting the blob while holding the lease...");
      await service.upload(blobName, sampleFilePath, {
        metadata: {
          source: "demo-script",
          contentType: "text",
          revision: "2",
        },
        tags: {
          scenario: "demo",
          stage: "leased-overwrite",
        },
        leaseId: leaseClient.leaseId,
      });
    } finally {
      console.log("Releasing the lease...");
      await leaseClient.releaseLease();
    }

    console.log("Deleting the blob...");
    await service.delete(blobName);

    console.log("Demo completed.");
  } finally {
    await rm(demoDirectory, { recursive: true, force: true });
  }
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`Demo failed: ${message}`);
  process.exitCode = 1;
});
