import * as fs from "fs";
import * as path from "path";
import { StorageClientFactory } from "./config/storage-config";
import { BlobStorageService } from "./services/blob-storage.service";

/**
 * Main demo script that showcases all blob storage operations:
 * - Upload with metadata and index tags
 * - List blobs in container
 * - Download and print content
 * - Acquire lease and overwrite with concurrency protection
 * - Delete blob
 */
async function main() {
  try {
    console.log("=== Azure Blob Storage Manager Demo ===\n");

    // Step 1: Load configuration from environment
    console.log("📋 Loading configuration...");
    const config = StorageClientFactory.loadConfigFromEnv();
    console.log(`✓ Storage account: ${config.accountName}`);
    console.log(`✓ Retry policy: Max ${config.retryMaxRetries} retries, ${config.retryDelayMs}ms delay`);
    console.log(`✓ Log level: ${config.logLevel}\n`);

    // Step 2: Create blob service client with managed identity
    const blobServiceClient = StorageClientFactory.getClient(config);
    
    // Step 3: Initialize blob storage service
    const containerName = process.env.AZURE_CONTAINER_NAME || "demo-container";
    const blobService = new BlobStorageService(blobServiceClient, containerName);
    
    console.log(`📦 Ensuring container '${containerName}' exists...`);
    await blobService.ensureContainerExists();
    console.log("✓ Container ready\n");

    // Step 4: Create a sample file to upload
    console.log("📝 Creating sample file...");
    const sampleFilePath = path.join(process.cwd(), "sample-data.txt");
    const sampleContent = `Azure Blob Storage Demo
======================

This file demonstrates efficient blob storage operations with:
- Streaming uploads for large files (memory efficient)
- Metadata for additional context
- Blob index tags for queryable properties
- Lease-based concurrency control

Generated at: ${new Date().toISOString()}

`.repeat(100); // Make it larger to show streaming benefits

    fs.writeFileSync(sampleFilePath, sampleContent);
    const fileSizeKB = (fs.statSync(sampleFilePath).size / 1024).toFixed(2);
    console.log(`✓ Created sample file: ${fileSizeKB} KB\n`);

    // Step 5: Upload with metadata and blob index tags
    console.log("⬆️  Step 1: Uploading file with metadata and tags...");
    const blobName = "demo-blob.txt";
    await blobService.uploadFile(blobName, sampleFilePath, {
      metadata: {
        uploader: "demo-script",
        environment: "development",
        version: "1.0",
      },
      tags: {
        department: "engineering",
        project: "blob-storage-demo",
        classification: "public",
      },
      contentType: "text/plain",
    });
    console.log();

    // Step 6: List all blobs in the container
    console.log("📋 Step 2: Listing all blobs in container...");
    const blobs = await blobService.listBlobs();
    console.log(`Found ${blobs.length} blob(s):\n`);
    
    for (const blob of blobs) {
      console.log(`  📄 ${blob.name}`);
      console.log(`     Size: ${(blob.size / 1024).toFixed(2)} KB`);
      console.log(`     Last Modified: ${blob.lastModified.toISOString()}`);
      console.log(`     Content-Type: ${blob.contentType}`);
      
      if (blob.metadata && Object.keys(blob.metadata).length > 0) {
        console.log(`     Metadata: ${JSON.stringify(blob.metadata)}`);
      }
      
      if (blob.tags && Object.keys(blob.tags).length > 0) {
        console.log(`     Tags: ${JSON.stringify(blob.tags)}`);
      }
      console.log();
    }

    // Step 7: Download the blob and print its content
    console.log("⬇️  Step 3: Downloading blob and printing content...");
    const downloadPath = path.join(process.cwd(), "downloaded-blob.txt");
    await blobService.downloadFile(blobName, downloadPath);
    
    const downloadedContent = fs.readFileSync(downloadPath, "utf-8");
    console.log("\n--- First 500 characters of downloaded content ---");
    console.log(downloadedContent.substring(0, 500));
    console.log("...\n");

    // Step 8: Get blob properties
    console.log("🔍 Step 4: Fetching blob properties...");
    const properties = await blobService.getBlobProperties(blobName);
    console.log(`✓ Blob properties retrieved:`);
    console.log(`  Size: ${(properties.size / 1024).toFixed(2)} KB`);
    console.log(`  Metadata: ${JSON.stringify(properties.metadata)}`);
    console.log(`  Tags: ${JSON.stringify(properties.tags)}\n`);

    // Step 9: Acquire lease and overwrite with concurrency protection
    console.log("🔒 Step 5: Acquiring lease to prevent concurrent writes...");
    const leaseId = await blobService.acquireLease(blobName, 30);
    
    console.log("✏️  Overwriting blob with lease protection...");
    const updatedContent = `UPDATED CONTENT (with lease protection)
====================================

This content was written with an active lease.
No other clients can modify this blob while the lease is active.

Updated at: ${new Date().toISOString()}
Lease ID: ${leaseId}
`;

    await blobService.uploadWithLease(
      blobName,
      updatedContent,
      leaseId,
      {
        metadata: {
          uploader: "demo-script",
          environment: "development",
          version: "2.0",
          updated: "true",
        },
        contentType: "text/plain",
      }
    );

    console.log("🔓 Releasing lease...");
    await blobService.releaseLease(blobName, leaseId);
    console.log();

    // Verify the update
    console.log("✓ Verifying update...");
    const updatedBuffer = await blobService.downloadToBuffer(blobName);
    console.log("--- Updated content (first 300 chars) ---");
    console.log(updatedBuffer.toString("utf-8").substring(0, 300));
    console.log("...\n");

    // Step 10: Delete the blob
    console.log("🗑️  Step 6: Deleting blob...");
    await blobService.deleteBlob(blobName);
    console.log();

    // Verify deletion
    const remainingBlobs = await blobService.listBlobs();
    console.log(`✓ Remaining blobs in container: ${remainingBlobs.length}\n`);

    // Cleanup local files
    console.log("🧹 Cleaning up local files...");
    fs.unlinkSync(sampleFilePath);
    fs.unlinkSync(downloadPath);
    console.log("✓ Local files cleaned up\n");

    console.log("=== Demo Complete! ===");
    console.log("\nAll operations completed successfully:");
    console.log("  ✓ Upload with streaming (memory efficient)");
    console.log("  ✓ Metadata and blob index tags");
    console.log("  ✓ List blobs");
    console.log("  ✓ Download to file");
    console.log("  ✓ Lease acquisition for concurrency control");
    console.log("  ✓ Blob deletion");

  } catch (error) {
    console.error("\n❌ Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run the demo
main();
