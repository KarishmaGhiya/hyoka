import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { createBlobServiceClient } from "./config";
import { BlobStorageService } from "./blobService";

const CONTAINER_NAME = "demo-container";
const BLOB_NAME = "sample.txt";

async function main(): Promise<void> {
  console.log("=== Azure Blob Storage Manager Demo ===\n");

  // 1. Build the service from environment-based config.
  const serviceClient = createBlobServiceClient();
  const blobService = new BlobStorageService(serviceClient);

  // 2. Create a temporary sample file to upload.
  const tmpFile = path.join(os.tmpdir(), "blob-demo-sample.txt");
  fs.writeFileSync(tmpFile, "Hello from the Azure Blob Manager demo!\n");

  try {
    // --- Upload with metadata and index tags ---
    console.log("[1] Uploading sample file with index tags...");
    await blobService.uploadFile(CONTAINER_NAME, BLOB_NAME, tmpFile, {
      metadata: { source: "demo", createdBy: "blob-manager" },
      tags: { environment: "dev", project: "blob-manager" },
    });

    // --- List blobs ---
    console.log("\n[2] Listing blobs in container...");
    const blobs = await blobService.listBlobs(CONTAINER_NAME);
    blobs.forEach((name) => console.log(`  - ${name}`));

    // --- Download and print ---
    console.log("\n[3] Downloading blob...");
    const result = await blobService.download(CONTAINER_NAME, BLOB_NAME);
    console.log(`  Content (${result.contentLength} bytes):`);
    console.log(`  "${result.content.trim()}"`);
    if (result.metadata) {
      console.log("  Metadata:", result.metadata);
    }

    // --- Lease-protected update ---
    console.log("\n[4] Acquiring lease and overwriting blob...");
    await blobService.leaseAndUpdate(
      CONTAINER_NAME,
      BLOB_NAME,
      "Updated content — written under lease protection.\n"
    );

    // Verify the update
    const updated = await blobService.download(CONTAINER_NAME, BLOB_NAME);
    console.log(`  New content: "${updated.content.trim()}"`);

    // --- Delete ---
    console.log("\n[5] Deleting blob...");
    await blobService.delete(CONTAINER_NAME, BLOB_NAME);

    console.log("\n=== Demo complete ===");
  } finally {
    // Clean up temp file.
    fs.unlinkSync(tmpFile);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
