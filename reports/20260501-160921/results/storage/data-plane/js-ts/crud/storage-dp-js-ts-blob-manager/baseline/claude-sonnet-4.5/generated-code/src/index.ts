import * as fs from 'fs';
import * as path from 'path';
import { loadConfig, createBlobServiceClient } from './config';
import { BlobStorageService } from './blob-service';

/**
 * Demo script showcasing all blob storage operations:
 * 1. Upload file with metadata and index tags
 * 2. List all blobs in container
 * 3. Download blob and print content
 * 4. Acquire lease and overwrite blob safely
 * 5. Delete blob
 */
async function main() {
  console.log('=== Azure Blob Storage Manager Demo ===\n');

  try {
    // Step 1: Load configuration and create client
    console.log('Step 1: Initializing configuration...');
    const config = loadConfig();
    const blobServiceClient = createBlobServiceClient(config);
    const blobService = new BlobStorageService(blobServiceClient, config.containerName);

    // Ensure container exists
    await blobService.ensureContainer();
    console.log();

    // Step 2: Create a sample file to upload
    console.log('Step 2: Creating sample file...');
    const sampleFileName = 'sample-data.txt';
    const sampleFilePath = path.join(__dirname, '..', sampleFileName);
    const sampleContent = `Azure Blob Storage Demo
${'='.repeat(30)}

This is a sample file demonstrating:
- Streaming upload for large files
- Metadata and index tags
- Lease-based concurrency control
- Download operations

Generated at: ${new Date().toISOString()}

Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
`.repeat(10); // Repeat to make it larger

    fs.writeFileSync(sampleFilePath, sampleContent);
    console.log(`✓ Created sample file: ${sampleFileName} (${sampleContent.length} bytes)`);
    console.log();

    // Step 3: Upload file with metadata and index tags
    console.log('Step 3: Uploading file with metadata and index tags...');
    const blobName = 'demo-file.txt';
    await blobService.uploadFile(blobName, sampleFilePath, {
      metadata: {
        author: 'demo-script',
        version: '1.0',
        environment: 'development',
      },
      tags: {
        project: 'blob-manager',
        type: 'demo',
        status: 'active',
      },
      contentType: 'text/plain',
    });
    console.log();

    // Step 4: List all blobs in the container
    console.log('Step 4: Listing all blobs in container...');
    const blobs = await blobService.listBlobs();
    blobs.forEach((blob, index) => {
      console.log(`\n  Blob ${index + 1}:`);
      console.log(`    Name: ${blob.name}`);
      console.log(`    Size: ${blob.contentLength} bytes`);
      console.log(`    Type: ${blob.contentType}`);
      console.log(`    Modified: ${blob.lastModified?.toISOString()}`);
      if (blob.metadata && Object.keys(blob.metadata).length > 0) {
        console.log(`    Metadata:`, blob.metadata);
      }
      if (blob.tags && Object.keys(blob.tags).length > 0) {
        console.log(`    Tags:`, blob.tags);
      }
    });
    console.log();

    // Step 5: Download blob and print its content
    console.log('Step 5: Downloading blob...');
    const downloadedContent = await blobService.downloadBlob(blobName);
    const contentPreview = downloadedContent.toString('utf-8').substring(0, 200);
    console.log(`\n  Content preview (first 200 chars):`);
    console.log(`  ${'-'.repeat(50)}`);
    console.log(`  ${contentPreview}...`);
    console.log(`  ${'-'.repeat(50)}`);
    console.log();

    // Step 6: Acquire lease and overwrite blob safely
    console.log('Step 6: Acquiring lease and overwriting blob...');
    const leaseClient = await blobService.acquireLease(blobName, 30);

    const newContent = `Updated content at ${new Date().toISOString()}

This blob was safely updated using a lease to prevent concurrent modifications.

Previous operations:
- Initial upload with metadata and tags
- Listed in container
- Downloaded and displayed

This demonstrates lease-based concurrency control!
`;

    await blobService.uploadWithLease(blobName, newContent, leaseClient, {
      metadata: {
        author: 'demo-script',
        version: '2.0',
        environment: 'development',
        updated: 'true',
      },
      tags: {
        project: 'blob-manager',
        type: 'demo',
        status: 'updated',
      },
      contentType: 'text/plain',
    });

    // Release the lease
    await blobService.releaseLease(leaseClient);
    console.log();

    // Step 7: Verify the update by downloading again
    console.log('Step 7: Verifying update...');
    const updatedContent = await blobService.downloadBlob(blobName);
    console.log(`\n  Updated content:`);
    console.log(`  ${'-'.repeat(50)}`);
    console.log(`  ${updatedContent.toString('utf-8')}`);
    console.log(`  ${'-'.repeat(50)}`);
    console.log();

    // Step 8: Delete the blob
    console.log('Step 8: Cleaning up - deleting blob...');
    await blobService.deleteBlob(blobName);
    console.log();

    // Clean up local sample file
    fs.unlinkSync(sampleFilePath);
    console.log('✓ Cleaned up local sample file');

    console.log('\n=== Demo completed successfully! ===');
  } catch (error) {
    console.error('\n❌ Error during demo:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run the demo
main();
