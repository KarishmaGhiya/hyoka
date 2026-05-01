import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { BlobStorageService } from "./blobStorageService";
import { createBlobServiceClient, loadBlobStorageConfig } from "./config";

async function main(): Promise<void> {
  const config = loadBlobStorageConfig();
  const blobServiceClient = createBlobServiceClient(config);
  const containerClient = blobServiceClient.getContainerClient(config.containerName);

  console.log(`Using storage account endpoint ${config.accountEndpoint}`);
  console.log(`Ensuring container "${config.containerName}" exists...`);
  await containerClient.createIfNotExists();

  const blobStorageService = new BlobStorageService(containerClient, {
    uploadBufferSizeBytes: config.uploadBufferSizeBytes,
    uploadConcurrency: config.uploadConcurrency,
    leaseDurationInSeconds: config.leaseDurationInSeconds,
  });

  const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "blob-demo-"));
  const sampleFilePath = path.join(tempDirectory, "sample.txt");
  const blobName = `demo-${Date.now()}.txt`;

  try {
    const initialContent = [
      "Hello from the Azure Blob Storage demo.",
      `Created at ${new Date().toISOString()}.`,
    ].join("\n");

    await fs.writeFile(sampleFilePath, initialContent, "utf8");

    console.log(`Uploading "${blobName}" with metadata and index tags...`);
    await blobStorageService.uploadFile(blobName, sampleFilePath, {
      metadata: {
        source: "demo",
        phase: "initial",
      },
      tags: {
        scenario: "demo",
        phase: "initial",
      },
      contentType: "text/plain; charset=utf-8",
    });
    console.log(`Uploaded "${blobName}".`);

    console.log(`Listing blobs in "${config.containerName}"...`);
    const blobs = await blobStorageService.listBlobs();
    for (const blob of blobs) {
      console.log(
        `- ${blob.name} (${blob.contentLength ?? 0} bytes)${
          blob.lastModified ? ` last modified ${blob.lastModified.toISOString()}` : ""
        }`,
      );
    }

    console.log(`Downloading "${blobName}"...`);
    const downloadedContent = await blobStorageService.downloadBlob(blobName);
    console.log(downloadedContent.toString("utf8"));

    const updatedContent = [
      "This content replaces the original blob body.",
      `Updated at ${new Date().toISOString()}.`,
    ].join("\n");

    await fs.writeFile(sampleFilePath, updatedContent, "utf8");

    console.log(`Overwriting "${blobName}" with lease protection...`);
    const overwriteResult = await blobStorageService.uploadFile(
      blobName,
      sampleFilePath,
      {
        metadata: {
          source: "demo",
          phase: "overwrite",
        },
        tags: {
          scenario: "demo",
          phase: "overwrite",
        },
        contentType: "text/plain; charset=utf-8",
      },
    );
    console.log(
      `Overwrote "${blobName}" using lease ${
        overwriteResult.leaseId ?? "N/A"
      }.`,
    );

    console.log(`Deleting "${blobName}"...`);
    await blobStorageService.deleteBlob(blobName);
    console.log(`Deleted "${blobName}".`);
  } finally {
    await fs.rm(tempDirectory, { recursive: true, force: true });
  }
}

main().catch((error: unknown) => {
  console.error("Blob storage demo failed.", error);
  process.exitCode = 1;
});
