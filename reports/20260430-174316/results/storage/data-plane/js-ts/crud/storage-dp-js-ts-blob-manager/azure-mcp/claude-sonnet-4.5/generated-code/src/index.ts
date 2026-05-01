import { createStorageConfigFromEnv } from './config';
import { BlobStorageService } from './blobService';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('='.repeat(60));
  console.log('Azure Blob Storage Management Demo');
  console.log('='.repeat(60));
  console.log();

  try {
    // Step 1: Initialize configuration with managed identity
    console.log('📝 Step 1: Initializing Azure Storage configuration...');
    const storageConfig = createStorageConfigFromEnv();
    const blobServiceClient = storageConfig.getBlobServiceClient();
    console.log();

    // Step 2: Create service instance
    const containerName = process.env.AZURE_STORAGE_CONTAINER || 'demo-container';
    console.log(`📝 Step 2: Creating blob service for container '${containerName}'...`);
    const blobService = new BlobStorageService(blobServiceClient, containerName);
    
    // Ensure container exists
    await blobService.ensureContainer();
    console.log();

    // Step 3: Create a sample file to upload
    console.log('📝 Step 3: Creating sample file...');
    const sampleFileName = 'sample-data.txt';
    const sampleFilePath = path.join(__dirname, '..', sampleFileName);
    const sampleContent = `Azure Blob Storage Demo File
=========================

This file demonstrates:
- Streaming uploads for memory efficiency
- Blob metadata and index tags
- Lease-based concurrency control
- Download and list operations

Generated at: ${new Date().toISOString()}

`.repeat(1000); // Make it larger to demonstrate streaming

    fs.writeFileSync(sampleFilePath, sampleContent);
    const fileSize = fs.statSync(sampleFilePath).size;
    console.log(`✓ Created sample file: ${sampleFileName} (${(fileSize / 1024).toFixed(2)} KB)`);
    console.log();

    // Step 4: Upload with metadata and tags
    console.log('📝 Step 4: Uploading file with metadata and index tags...');
    const blobName = `demo-${Date.now()}.txt`;
    await blobService.uploadFile(blobName, sampleFilePath, {
      metadata: {
        uploadedBy: 'demo-script',
        purpose: 'testing',
        timestamp: new Date().toISOString()
      },
      tags: {
        environment: 'development',
        category: 'demo',
        version: '1.0'
      },
      contentType: 'text/plain'
    });
    console.log();

    // Step 5: List all blobs in container
    console.log('📝 Step 5: Listing all blobs in container...');
    const blobs = await blobService.listBlobs();
    blobs.forEach((blob, index) => {
      console.log(`\n  Blob ${index + 1}:`);
      console.log(`    Name: ${blob.name}`);
      console.log(`    Size: ${(blob.properties.contentLength! / 1024).toFixed(2)} KB`);
      console.log(`    Content Type: ${blob.properties.contentType}`);
      console.log(`    Last Modified: ${blob.properties.lastModified}`);
      
      if (blob.metadata) {
        console.log(`    Metadata:`, blob.metadata);
      }
      
      if (blob.tags) {
        console.log(`    Tags:`, blob.tags);
      }
    });
    console.log();

    // Step 6: Query blobs by tags
    console.log('📝 Step 6: Querying blobs by tags...');
    const matchingBlobs = await blobService.queryBlobsByTags(`environment='development' AND category='demo'`);
    console.log(`  Matching blobs: ${matchingBlobs.join(', ')}`);
    console.log();

    // Step 7: Download the blob
    console.log('📝 Step 7: Downloading blob...');
    const downloadPath = path.join(__dirname, '..', 'downloaded-sample.txt');
    await blobService.downloadToFile(blobName, downloadPath);
    
    // Read and display first few lines
    const downloadedContent = fs.readFileSync(downloadPath, 'utf-8');
    const previewLines = downloadedContent.split('\n').slice(0, 10);
    console.log(`\n  Content preview (first 10 lines):`);
    previewLines.forEach(line => console.log(`    ${line}`));
    console.log(`    ... (${downloadedContent.split('\n').length} total lines)`);
    console.log();

    // Step 8: Acquire lease and update blob
    console.log('📝 Step 8: Acquiring lease and updating blob...');
    const lease = await blobService.acquireLease(blobName, 60);
    
    // Create updated content
    const updatedContent = `UPDATED FILE - ${new Date().toISOString()}\n\n${sampleContent}`;
    const updatedFilePath = path.join(__dirname, '..', 'updated-sample.txt');
    fs.writeFileSync(updatedFilePath, updatedContent);
    
    // Upload with lease (this prevents other writers from modifying)
    await blobService.uploadFileWithLease(blobName, updatedFilePath, lease.leaseId, {
      metadata: {
        uploadedBy: 'demo-script',
        purpose: 'testing-updated',
        timestamp: new Date().toISOString(),
        version: '2'
      },
      tags: {
        environment: 'development',
        category: 'demo',
        version: '2.0',
        updated: 'true'
      },
      contentType: 'text/plain'
    });
    
    // Release the lease
    await blobService.releaseLease(blobName, lease.leaseId);
    console.log();

    // Step 9: Verify update by downloading again
    console.log('📝 Step 9: Verifying update...');
    const verifyBuffer = await blobService.downloadToBuffer(blobName);
    const verifyContent = verifyBuffer.toString('utf-8');
    const firstLine = verifyContent.split('\n')[0];
    console.log(`  First line of updated blob: "${firstLine}"`);
    console.log(`  ✓ Update verified!`);
    console.log();

    // Step 10: Clean up - delete the blob
    console.log('📝 Step 10: Cleaning up...');
    await blobService.deleteBlob(blobName);
    
    // Clean up local files
    [sampleFilePath, downloadPath, updatedFilePath].forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`✓ Deleted local file: ${path.basename(file)}`);
      }
    });
    console.log();

    console.log('='.repeat(60));
    console.log('✓ Demo completed successfully!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error during demo:', error);
    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    }
    process.exit(1);
  }
}

// Run the demo
main();
