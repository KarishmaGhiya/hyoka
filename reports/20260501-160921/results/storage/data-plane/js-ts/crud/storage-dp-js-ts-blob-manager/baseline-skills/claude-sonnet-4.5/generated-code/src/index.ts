import * as fs from "fs";
import * as path from "path";
import { BlobStorageConfiguration } from "./config";
import { BlobStorageService } from "./blob-service";

/**
 * Demo script showing all blob storage operations
 */
async function main() {
  console.log("=== Azure Blob Storage Manager Demo ===\n");

  try {
    // Step 1: Initialize configuration from environment
    console.log("1. Initializing configuration...");
    const config = BlobStorageConfiguration.fromEnvironment();
    console.log(`   ✓ Endpoint: ${config.getConfig().endpoint}`);
    console.log(`   ✓ Container: ${config.getContainerName()}`);
    console.log(`   ✓ Max Retries: ${config.getConfig().maxRetries}`);
    console.log(`   ✓ Retry Delay: ${config.getConfig().retryDelayMs}ms`);
    console.log(`   ✓ Log Level: ${config.getConfig().logLevel}\n`);

    // Step 2: Create service instance
    console.log("2. Creating blob storage service...");
    const service = new BlobStorageService(
      config.getServiceClient(),
      config.getContainerName()
    );
    await service.ensureContainer();
    console.log("   ✓ Service ready\n");

    // Step 3: Create a sample file to upload
    console.log("3. Creating sample file...");
    const sampleFileName = "sample-data.txt";
    const sampleFilePath = path.join(process.cwd(), sampleFileName);
    const sampleContent = `Azure Blob Storage Demo
Created at: ${new Date().toISOString()}

This file demonstrates:
- Streaming upload for large files
- Blob metadata and index tags
- Download operations
- Lease-based concurrency control
- List and delete operations

Large file simulation content:
${"x".repeat(10000)}
`;
    fs.writeFileSync(sampleFilePath, sampleContent);
    console.log(`   ✓ Sample file created: ${sampleFilePath}`);
    console.log(`   ✓ File size: ${fs.statSync(sampleFilePath).size} bytes\n`);

    // Step 4: Upload blob with metadata and index tags
    console.log("4. Uploading blob with metadata and index tags...");
    const blobName = `demo-${Date.now()}.txt`;
    const uploadResult = await service.uploadBlob(
      blobName,
      sampleFilePath,
      {
        metadata: {
          uploadedBy: "demo-script",
          environment: "development",
          purpose: "testing"
        },
        tags: {
          category: "demo",
          status: "active",
          version: "1.0"
        },
        contentType: "text/plain"
      }
    );
    console.log(`   ✓ Blob uploaded: ${uploadResult.blobName}`);
    console.log(`   ✓ ETag: ${uploadResult.etag}`);
    console.log(`   ✓ Last Modified: ${uploadResult.lastModified.toISOString()}`);
    console.log(`   ✓ Size: ${uploadResult.contentLength} bytes\n`);

    // Step 5: List all blobs in container
    console.log("5. Listing all blobs in container...");
    const blobs = await service.listBlobs();
    console.log(`   ✓ Found ${blobs.length} blob(s):`);
    blobs.forEach((blob) => {
      console.log(`     - ${blob.name}`);
      console.log(`       Size: ${blob.size} bytes`);
      console.log(`       Last Modified: ${blob.lastModified.toISOString()}`);
      console.log(`       Content Type: ${blob.contentType ?? "unknown"}`);
    });
    console.log();

    // Step 6: Download the blob
    console.log("6. Downloading blob...");
    const downloadResult = await service.downloadBlob(blobName);
    console.log(`   ✓ Blob downloaded: ${downloadResult.blobName}`);
    console.log(`   ✓ Content Type: ${downloadResult.contentType}`);
    console.log(`   ✓ Metadata:`);
    Object.entries(downloadResult.metadata ?? {}).forEach(([key, value]) => {
      console.log(`     - ${key}: ${value}`);
    });
    console.log(`   ✓ Tags:`);
    Object.entries(downloadResult.tags ?? {}).forEach(([key, value]) => {
      console.log(`     - ${key}: ${value}`);
    });
    console.log(`   ✓ Content preview (first 200 chars):`);
    const contentPreview = downloadResult.content?.toString("utf-8").substring(0, 200) ?? "";
    console.log(`     ${contentPreview.replace(/\n/g, "\n     ")}...\n`);

    // Step 7: Upload with lease acquisition (prevents concurrent writes)
    console.log("7. Overwriting blob with lease acquisition...");
    const updatedContent = `Updated content at ${new Date().toISOString()}\n\nThis update was protected by a lease.`;
    const tempUpdateFile = path.join(process.cwd(), "temp-update.txt");
    fs.writeFileSync(tempUpdateFile, updatedContent);

    const leaseUploadResult = await service.uploadBlobWithLease(
      blobName,
      tempUpdateFile,
      {
        metadata: {
          uploadedBy: "demo-script",
          environment: "development",
          purpose: "testing",
          updated: "true"
        },
        tags: {
          category: "demo",
          status: "updated",
          version: "2.0"
        },
        contentType: "text/plain"
      }
    );
    console.log(`   ✓ Blob updated with lease protection`);
    console.log(`   ✓ New ETag: ${leaseUploadResult.etag}`);
    console.log(`   ✓ Last Modified: ${leaseUploadResult.lastModified.toISOString()}\n`);

    // Verify the update
    console.log("8. Verifying updated content...");
    const verifyDownload = await service.downloadBlob(blobName);
    console.log(`   ✓ Updated content:`);
    console.log(`     ${verifyDownload.content?.toString("utf-8").replace(/\n/g, "\n     ")}\n`);

    // Step 8: Delete the blob
    console.log("9. Deleting blob...");
    await service.deleteBlob(blobName);
    console.log(`   ✓ Blob deleted: ${blobName}\n`);

    // Step 9: Verify deletion
    console.log("10. Verifying deletion...");
    const finalBlobs = await service.listBlobs();
    console.log(`   ✓ Remaining blobs: ${finalBlobs.length}\n`);

    // Cleanup
    fs.unlinkSync(sampleFilePath);
    fs.unlinkSync(tempUpdateFile);

    console.log("=== Demo completed successfully! ===");
  } catch (error) {
    console.error("\n❌ Error occurred:");
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
      if (error.stack) {
        console.error("\nStack trace:");
        console.error(error.stack);
      }
    } else {
      console.error(`   ${error}`);
    }
    process.exit(1);
  }
}

// Run the demo
main();
