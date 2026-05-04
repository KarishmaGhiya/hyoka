import { createStorageConfig } from "./config.js";
import { BlobStorageService } from "./blob-storage.service.js";
import * as fs from "node:fs";
import * as path from "node:path";

async function main() {
  console.log("=".repeat(60));
  console.log("Azure Blob Storage Manager - Demo");
  console.log("=".repeat(60));
  console.log();

  const config = createStorageConfig();
  const blobService = new BlobStorageService(
    config.getClient(),
    config.getContainerName()
  );

  await blobService.initialize();
  console.log();

  const sampleFileName = "demo-file.txt";
  const sampleFilePath = path.join(process.cwd(), sampleFileName);
  const downloadedFilePath = path.join(process.cwd(), "downloaded-demo-file.txt");

  fs.writeFileSync(
    sampleFilePath,
    `Hello from Azure Blob Storage!\n` +
      `This is a demo file created at ${new Date().toISOString()}\n` +
      `Testing blob operations with metadata and tags.\n`
  );
  console.log(`✓ Created sample file: ${sampleFileName}`);
  console.log();

  console.log("--- Step 1: Upload with Metadata and Tags ---");
  await blobService.uploadFile(sampleFileName, sampleFilePath, {
    metadata: {
      author: "demo-app",
      environment: "development",
      version: "1.0.0",
    },
    tags: {
      project: "azure-demo",
      type: "sample",
      status: "test",
    },
    contentType: "text/plain",
    onProgress: (bytes) => {
      process.stdout.write(`\r  Progress: ${bytes} bytes`);
    },
  });
  console.log();
  console.log();

  console.log("--- Step 2: List All Blobs in Container ---");
  const blobs = await blobService.listBlobs();
  console.log(`Found ${blobs.length} blob(s):`);
  for (const blob of blobs) {
    console.log(`  • ${blob.name}`);
    console.log(`    Size: ${blob.size} bytes`);
    console.log(`    Last Modified: ${blob.lastModified.toISOString()}`);
    console.log(`    Content-Type: ${blob.contentType || "N/A"}`);
    if (blob.metadata && Object.keys(blob.metadata).length > 0) {
      console.log(`    Metadata:`, blob.metadata);
    }
    if (blob.tags && Object.keys(blob.tags).length > 0) {
      console.log(`    Tags:`, blob.tags);
    }
  }
  console.log();

  console.log("--- Step 3: Download and Display Content ---");
  await blobService.downloadToFile(sampleFileName, downloadedFilePath);
  const content = fs.readFileSync(downloadedFilePath, "utf-8");
  console.log("Downloaded content:");
  console.log("-".repeat(40));
  console.log(content);
  console.log("-".repeat(40));
  console.log();

  console.log("--- Step 4: Update Blob with Lease Protection ---");
  const updatedContent = `Updated at ${new Date().toISOString()}\n` +
    `This blob was safely updated using lease-based concurrency control.\n` +
    `No other writer could modify it while the lease was held.\n`;

  await blobService.uploadWithLease(sampleFileName, updatedContent, {
    metadata: {
      author: "demo-app",
      environment: "development",
      version: "1.0.1",
      updated: "true",
    },
    tags: {
      project: "azure-demo",
      type: "sample",
      status: "updated",
    },
    contentType: "text/plain",
  });
  console.log();

  console.log("--- Step 5: Verify Updated Content ---");
  const updatedContentDownloaded = await blobService.downloadToString(sampleFileName);
  console.log("Updated content:");
  console.log("-".repeat(40));
  console.log(updatedContentDownloaded);
  console.log("-".repeat(40));
  console.log();

  console.log("--- Step 6: Get Blob Properties ---");
  const properties = await blobService.getBlobProperties(sampleFileName);
  if (properties) {
    console.log("Blob properties:");
    console.log(`  Name: ${properties.name}`);
    console.log(`  Size: ${properties.size} bytes`);
    console.log(`  Last Modified: ${properties.lastModified.toISOString()}`);
    console.log(`  Content-Type: ${properties.contentType}`);
    console.log(`  Metadata:`, properties.metadata);
    console.log(`  Tags:`, properties.tags);
  }
  console.log();

  console.log("--- Step 7: Delete Blob ---");
  await blobService.deleteBlob(sampleFileName);
  console.log();

  console.log("--- Step 8: Verify Deletion ---");
  const exists = await blobService.blobExists(sampleFileName);
  console.log(`Blob exists: ${exists}`);
  console.log();

  console.log("--- Cleanup ---");
  if (fs.existsSync(sampleFilePath)) {
    fs.unlinkSync(sampleFilePath);
    console.log(`✓ Deleted local file: ${sampleFileName}`);
  }
  if (fs.existsSync(downloadedFilePath)) {
    fs.unlinkSync(downloadedFilePath);
    console.log(`✓ Deleted local file: ${path.basename(downloadedFilePath)}`);
  }
  console.log();

  console.log("=".repeat(60));
  console.log("Demo completed successfully!");
  console.log("=".repeat(60));
}

main().catch((error) => {
  console.error("\n❌ Error:", error.message);
  if (error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
});
