import { BlobStorageService } from './blob-service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Demo script showcasing all blob storage operations
 */
async function main() {
  console.log('=== Azure Blob Storage Manager Demo ===\n');

  const blobService = new BlobStorageService();

  try {
    // Ensure container exists
    console.log('Step 1: Ensuring container exists...');
    await blobService.ensureContainer();
    console.log();

    // Create a sample file to upload
    const sampleFileName = 'sample-data.txt';
    const sampleFilePath = path.join(__dirname, '..', sampleFileName);
    const sampleContent = `This is a sample file for Azure Blob Storage demo.
Created at: ${new Date().toISOString()}
This file demonstrates:
- Streaming upload for memory-efficient handling of large files
- Metadata and index tags for organization and querying
- Lease-based concurrency control to prevent overwrites
- Download and delete operations

Lorem ipsum dolor sit amet, consectetur adipiscing elit.
`.repeat(100); // Make it larger to better demonstrate streaming

    fs.writeFileSync(sampleFilePath, sampleContent);
    console.log(`Created sample file: ${sampleFilePath} (${sampleContent.length} bytes)\n`);

    // Step 2: Upload with metadata and tags
    console.log('Step 2: Uploading file with metadata and index tags...');
    const blobName = 'demo-file.txt';
    await blobService.uploadFile(sampleFilePath, blobName, {
      metadata: {
        author: 'demo-user',
        category: 'documentation',
        version: '1.0'
      },
      tags: {
        environment: 'development',
        project: 'blob-manager',
        dataClassification: 'public'
      },
      contentType: 'text/plain'
    });
    console.log();

    // Step 3: List all blobs
    console.log('Step 3: Listing all blobs in container...');
    const blobs = await blobService.listBlobs();
    console.log('\nBlobs found:');
    for (const blob of blobs) {
      console.log(`  - ${blob.name}`);
      console.log(`    Size: ${blob.size} bytes`);
      console.log(`    Last Modified: ${blob.lastModified}`);
      console.log(`    Content Type: ${blob.contentType}`);
      if (blob.metadata && Object.keys(blob.metadata).length > 0) {
        console.log(`    Metadata: ${JSON.stringify(blob.metadata)}`);
      }
      if (blob.tags && Object.keys(blob.tags).length > 0) {
        console.log(`    Tags: ${JSON.stringify(blob.tags)}`);
      }
    }
    console.log();

    // Step 4: Download the file
    console.log('Step 4: Downloading blob...');
    const downloadPath = path.join(__dirname, '..', 'downloaded-file.txt');
    await blobService.downloadFile(blobName, downloadPath);
    
    const downloadedContent = fs.readFileSync(downloadPath, 'utf-8');
    console.log('\nFirst 200 characters of downloaded content:');
    console.log(downloadedContent.substring(0, 200) + '...\n');

    // Step 5: Acquire lease and overwrite with protection
    console.log('Step 5: Acquiring lease and overwriting blob with concurrency protection...');
    const leaseId = await blobService.acquireLease(blobName, 30); // 30 second lease

    // Create updated content
    const updatedContent = `UPDATED FILE - Modified at ${new Date().toISOString()}
This file has been updated while protected by a lease.
No other writer could modify this blob during the lease period.
`;
    const updatedFilePath = path.join(__dirname, '..', 'updated-file.txt');
    fs.writeFileSync(updatedFilePath, updatedContent);

    // Upload with lease protection
    await blobService.uploadWithLease(updatedFilePath, blobName, leaseId, {
      metadata: {
        author: 'demo-user',
        category: 'documentation',
        version: '2.0',
        updated: new Date().toISOString()
      },
      tags: {
        environment: 'development',
        project: 'blob-manager',
        dataClassification: 'public',
        status: 'updated'
      },
      contentType: 'text/plain'
    });

    // Release the lease
    await blobService.releaseLease(blobName, leaseId);
    console.log();

    // Verify the update
    console.log('Step 6: Verifying the update...');
    const properties = await blobService.getBlobProperties(blobName);
    console.log('Updated blob properties:');
    console.log(`  Metadata: ${JSON.stringify(properties.metadata)}`);
    console.log(`  Tags: ${JSON.stringify(properties.tags)}`);
    console.log();

    // Download and display updated content
    const updatedDownloadPath = path.join(__dirname, '..', 'downloaded-updated.txt');
    await blobService.downloadFile(blobName, updatedDownloadPath);
    const updatedDownloadedContent = fs.readFileSync(updatedDownloadPath, 'utf-8');
    console.log('Updated content:');
    console.log(updatedDownloadedContent);
    console.log();

    // Step 7: Delete the blob
    console.log('Step 7: Deleting blob...');
    await blobService.deleteBlob(blobName);
    console.log();

    // Verify deletion
    console.log('Step 8: Verifying deletion...');
    const remainingBlobs = await blobService.listBlobs();
    console.log(`Blobs remaining in container: ${remainingBlobs.length}`);
    console.log();

    // Cleanup local files
    console.log('Cleaning up local test files...');
    [sampleFilePath, downloadPath, updatedFilePath, updatedDownloadPath].forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`  Deleted: ${file}`);
      }
    });

    console.log('\n=== Demo completed successfully! ===');

  } catch (error) {
    console.error('Error during demo:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the demo
main().catch(console.error);
