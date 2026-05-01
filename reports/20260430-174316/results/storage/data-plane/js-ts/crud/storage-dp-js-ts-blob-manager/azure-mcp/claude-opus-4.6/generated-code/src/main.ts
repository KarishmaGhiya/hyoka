import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { createBlobServiceClient } from "./config";
import { BlobStorageService } from "./blobService";

const CONTAINER_NAME = "demo-container";
const BLOB_NAME = "sample.txt";

async function main(): Promise<void> {
  console.log("=== Azure Blob Storage Manager Demo ===\n");

  // 1. Initialise client & service
  const serviceClient = createBlobServiceClient();
  const blobService = new BlobStorageService(serviceClient);

  // Ensure the container exists
  await blobService.ensureContainer(CONTAINER_NAME);
  console.log(`✔ Container "${CONTAINER_NAME}" is ready.\n`);

  // 2. Create a sample file and upload it with metadata + index tags
  const sampleDir = fs.mkdtempSync(path.join(os.tmpdir(), "blob-demo-"));
  const sampleFile = path.join(sampleDir, "sample.txt");
  fs.writeFileSync(sampleFile, "Hello from the Azure Blob Manager demo!");

  console.log("Uploading sample file…");
  await blobService.uploadFile(CONTAINER_NAME, BLOB_NAME, sampleFile, {
    contentType: "text/plain",
    metadata: { createdBy: "blob-manager-demo", version: "1" },
    tags: { environment: "development", project: "blob-manager" },
  });
  console.log(`✔ Uploaded "${BLOB_NAME}" with metadata and index tags.\n`);

  // 3. List blobs in the container
  console.log(`Listing blobs in "${CONTAINER_NAME}":`);
  const blobs = await blobService.listBlobs(CONTAINER_NAME);
  for (const blob of blobs) {
    console.log(`  • ${blob.name}  (size: ${blob.properties.contentLength} bytes)`);
  }
  console.log();

  // 4. Download and print content
  console.log("Downloading blob…");
  const downloaded = await blobService.download(CONTAINER_NAME, BLOB_NAME);
  console.log(`✔ Downloaded ${downloaded.contentLength} bytes.`);
  console.log(`  Content: "${downloaded.content}"`);
  console.log(`  Metadata:`, downloaded.metadata);
  console.log();

  // 5. Overwrite the blob using a lease to prevent concurrent writes
  console.log("Acquiring lease and overwriting blob…");
  await blobService.uploadWithLease(
    CONTAINER_NAME,
    BLOB_NAME,
    "Updated content — written under lease protection.",
    { contentType: "text/plain", metadata: { version: "2" } }
  );
  console.log("✔ Blob overwritten under lease.\n");

  // Verify the update
  const updated = await blobService.download(CONTAINER_NAME, BLOB_NAME);
  console.log(`  Updated content: "${updated.content}"\n`);

  // 6. Delete the blob
  console.log("Deleting blob…");
  await blobService.delete(CONTAINER_NAME, BLOB_NAME);
  console.log(`✔ Blob "${BLOB_NAME}" deleted.\n`);

  // Clean up temp files
  fs.unlinkSync(sampleFile);
  fs.rmdirSync(sampleDir);

  console.log("=== Demo complete ===");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
