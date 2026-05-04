import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { createBlobServiceClient } from "./config";
import { BlobStorageService } from "./blobService";

async function main(): Promise<void> {
  // --- Setup ---
  const serviceClient = createBlobServiceClient();
  const blobService = new BlobStorageService(serviceClient);

  const containerName = "demo-container";
  const blobName = "sample.txt";

  // Create a temporary sample file
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "blob-demo-"));
  const sampleFile = path.join(tmpDir, "sample.txt");
  const sampleContent = "Hello from Azure Blob Storage manager!";
  fs.writeFileSync(sampleFile, sampleContent, "utf-8");

  try {
    // 1. Upload with metadata and index tags
    console.log("=== 1. Uploading blob ===");
    await blobService.upload(containerName, blobName, sampleFile, {
      contentType: "text/plain",
      metadata: { source: "demo", createdBy: "blob-manager" },
      tags: { environment: "dev", project: "blob-manager" },
    });
    console.log(`  Uploaded "${blobName}" to "${containerName}".`);

    // 2. List blobs
    console.log("\n=== 2. Listing blobs ===");
    const blobs = await blobService.listBlobs(containerName);
    for (const blob of blobs) {
      console.log(
        `  - ${blob.name}  (${blob.contentLength ?? "?"} bytes, ${blob.contentType})`
      );
    }

    // 3. Download and print content
    console.log("\n=== 3. Downloading blob ===");
    const content = await blobService.download(containerName, blobName);
    console.log(`  Content: "${content}"`);

    // 4. Lease-protected update
    console.log("\n=== 4. Lease-protected update ===");
    const updatedFile = path.join(tmpDir, "updated.txt");
    fs.writeFileSync(updatedFile, "Updated content via lease!", "utf-8");

    await blobService.leaseAndUpdate(containerName, blobName, updatedFile, {
      contentType: "text/plain",
      metadata: { source: "demo", updatedBy: "blob-manager" },
      tags: { environment: "dev", project: "blob-manager", updated: "true" },
    });

    const updatedContent = await blobService.download(containerName, blobName);
    console.log(`  New content: "${updatedContent}"`);

    // 5. Delete
    console.log("\n=== 5. Deleting blob ===");
    await blobService.delete(containerName, blobName);
    console.log(`  Deleted "${blobName}".`);

    console.log("\n=== Demo complete ===");
  } finally {
    // Clean up temp files
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
