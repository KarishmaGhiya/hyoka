import { promises as fs } from "node:fs";
import { join } from "node:path";
import { Tags } from "@azure/storage-blob";
import { BlobStorageService } from "./blobStorageService";
import { createBlobServiceClient, loadBlobStorageConfig } from "./config";

async function main(): Promise<void> {
  const config = loadBlobStorageConfig();
  const blobServiceClient = createBlobServiceClient(config);
  const blobStorageService = new BlobStorageService(blobServiceClient);

  const workingDirectory = join(process.cwd(), "demo-artifacts");
  const uploadFilePath = join(workingDirectory, "sample-upload.txt");
  const downloadFilePath = join(workingDirectory, "downloaded-sample.txt");
  const blobName = "sample-upload.txt";
  const initialTags: Tags = {
    project: "azure-blob-manager",
    scenario: "demo",
    stage: "initial"
  };
  const updatedTags: Tags = {
    project: "azure-blob-manager",
    scenario: "demo",
    stage: "updated"
  };

  await fs.mkdir(workingDirectory, { recursive: true });

  console.log(`Using container "${config.containerName}" at ${config.endpoint}`);
  console.log("Ensuring container exists...");
  await blobStorageService.ensureContainer(config.containerName);

  console.log("Preparing sample file...");
  await fs.writeFile(uploadFilePath, "Initial blob content written from the TypeScript demo.\n", "utf8");

  console.log("Uploading sample blob with index tags...");
  const uploadResult = await blobStorageService.uploadBlob(config.containerName, blobName, uploadFilePath, {
    metadata: {
      source: "demo-script",
      stage: "initial"
    },
    tags: initialTags
  });
  console.log(`Upload complete. Lease used: ${uploadResult.usedLease}`);

  console.log("Listing blobs in container...");
  const blobs = await blobStorageService.listBlobs(config.containerName);
  for (const blob of blobs) {
    const tags = blob.tags ? JSON.stringify(blob.tags) : "{}";
    console.log(`- ${blob.name} | tags=${tags}`);
  }

  console.log("Downloading blob...");
  await blobStorageService.downloadBlob(config.containerName, blobName, downloadFilePath);
  const downloadedContent = await fs.readFile(downloadFilePath, "utf8");
  console.log("Downloaded content:");
  console.log(downloadedContent.trimEnd());

  console.log("Overwriting blob while holding a lease...");
  await fs.writeFile(uploadFilePath, "Updated blob content written after lease acquisition.\n", "utf8");
  const overwriteResult = await blobStorageService.uploadBlob(config.containerName, blobName, uploadFilePath, {
    metadata: {
      source: "demo-script",
      stage: "updated"
    },
    tags: updatedTags
  });
  console.log(`Overwrite complete. Lease used: ${overwriteResult.usedLease}`);

  console.log("Deleting blob...");
  await blobStorageService.deleteBlob(config.containerName, blobName);
  console.log("Blob deleted.");
}

main().catch((error: unknown) => {
  console.error("Blob demo failed.");

  if (error instanceof Error) {
    console.error(error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } else {
    console.error(error);
  }

  process.exitCode = 1;
});
