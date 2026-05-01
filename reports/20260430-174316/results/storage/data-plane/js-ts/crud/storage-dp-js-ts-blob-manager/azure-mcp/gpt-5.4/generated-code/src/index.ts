import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BlobStorageService } from "./blobStorageService";
import { createBlobServiceClient, loadBlobStorageConfig } from "./config";

async function createSampleFile(
  directory: string,
  fileName: string,
  content: string,
): Promise<string> {
  const filePath = join(directory, fileName);
  await writeFile(filePath, content, "utf8");
  return filePath;
}

async function main(): Promise<void> {
  const config = loadBlobStorageConfig();
  const blobServiceClient = createBlobServiceClient(config);
  const containerClient = blobServiceClient.getContainerClient(config.containerName);
  const storageService = new BlobStorageService(containerClient);
  const workingDirectory = await mkdtemp(join(tmpdir(), "azure-blob-demo-"));
  const blobName = "sample.txt";

  try {
    console.log(`Using container "${config.containerName}" at ${config.endpoint}`);
    console.log("Creating the sample file for upload...");
    const initialFilePath = await createSampleFile(
      workingDirectory,
      "sample.txt",
      "Hello from the Azure Blob Storage demo.",
    );

    console.log(`Uploading "${blobName}" with metadata and index tags...`);
    await storageService.uploadFile(blobName, initialFilePath, {
      metadata: {
        source: "demo",
        stage: "initial-upload",
      },
      tags: {
        category: "demo",
        state: "original",
      },
    });
    console.log("Upload complete.");

    console.log("Listing blobs in the container...");
    const blobs = await storageService.listBlobs();
    for (const blob of blobs) {
      console.log(`- ${blob.name}`);
    }

    console.log(`Downloading "${blobName}"...`);
    const downloadedContent = await storageService.downloadBlob(blobName);
    console.log(downloadedContent.toString("utf8"));

    console.log(`Acquiring a lease for "${blobName}" before overwriting it...`);
    const lease = await storageService.acquireLease(blobName);
    try {
      const updatedFilePath = await createSampleFile(
        workingDirectory,
        "sample-updated.txt",
        "Hello again. This blob was safely overwritten under a lease.",
      );

      console.log("Uploading the updated version of the blob...");
      await storageService.uploadFile(blobName, updatedFilePath, {
        metadata: {
          source: "demo",
          stage: "leased-overwrite",
        },
        tags: {
          category: "demo",
          state: "updated",
        },
        leaseId: lease.leaseId,
      });
      console.log("Overwrite complete.");
    } finally {
      await lease.release();
      console.log("Lease released.");
    }

    console.log(`Deleting "${blobName}"...`);
    await storageService.deleteBlob(blobName);
    console.log("Blob deleted.");
  } finally {
    await rm(workingDirectory, { recursive: true, force: true });
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`Blob storage demo failed: ${message}`);
  process.exitCode = 1;
});
