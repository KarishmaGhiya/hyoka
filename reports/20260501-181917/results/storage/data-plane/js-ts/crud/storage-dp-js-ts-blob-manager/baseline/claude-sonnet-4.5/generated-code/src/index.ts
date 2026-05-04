import * as fs from 'fs';
import * as path from 'path';
import { BlobStorageConfigManager } from './config/blobConfig';
import { BlobStorageService } from './services/blobService';

/**
 * Main demonstration script for Azure Blob Storage operations
 * 
 * This script demonstrates:
 * 1. Uploading a file with metadata and index tags
 * 2. Listing all blobs in a container
 * 3. Downloading the blob and displaying its content
 * 4. Acquiring a lease and overwriting the blob
 * 5. Deleting the blob
 */
async function main() {
  console.log('='.repeat(80));
  console.log('Azure Blob Storage Management Utility - Demo');
  console.log('='.repeat(80));
  console.log();

  try {
    // Step 1: Initialize configuration and service
    console.log('Step 1: Initializing Azure Blob Storage client...');
    console.log('-'.repeat(80));
    
    const configManager = new BlobStorageConfigManager({
      // Configuration can be passed here or via environment variables
      // accountEndpoint: 'https://youraccount.blob.core.windows.net',
      maxRetries: 3,
      maxRetryDelayMs: 4000,
      logLevel: 'info',
    });
    
    const blobServiceClient = configManager.getBlobServiceClient();
    const blobService = new BlobStorageService(blobServiceClient);
    
    console.log();

    // Configuration for demo
    const containerName = process.env.AZURE_CONTAINER_NAME || 'demo-container';
    const blobName = 'sample-file.txt';
    const sampleFilePath = path.join(__dirname, '..', 'sample-data.txt');
    const downloadPath = path.join(__dirname, '..', 'downloaded-file.txt');

    // Step 2: Ensure container exists
    console.log('Step 2: Ensuring container exists...');
    console.log('-'.repeat(80));
    await blobService.ensureContainer(containerName);
    console.log();

    // Step 3: Create a sample file to upload
    console.log('Step 3: Creating sample file...');
    console.log('-'.repeat(80));
    const sampleContent = `Azure Blob Storage Demo
========================

This is a sample file demonstrating blob operations.

Features demonstrated:
- Streaming upload for large files
- Metadata and index tags
- Lease-based concurrency control
- Download operations
- Blob listing

Timestamp: ${new Date().toISOString()}
`;
    
    fs.writeFileSync(sampleFilePath, sampleContent, 'utf-8');
    console.log(`✓ Sample file created: ${sampleFilePath}`);
    console.log(`✓ File size: ${fs.statSync(sampleFilePath).size} bytes`);
    console.log();

    // Step 4: Upload file with metadata and index tags
    console.log('Step 4: Uploading file with metadata and index tags...');
    console.log('-'.repeat(80));
    
    await blobService.uploadFile(
      containerName,
      blobName,
      sampleFilePath,
      {
        metadata: {
          author: 'demo-script',
          purpose: 'testing',
          environment: 'development',
        },
        tags: {
          project: 'blob-demo',
          type: 'sample',
          status: 'active',
        },
        contentType: 'text/plain',
      }
    );
    console.log();

    // Step 5: List all blobs in the container
    console.log('Step 5: Listing all blobs in the container...');
    console.log('-'.repeat(80));
    
    const blobs = await blobService.listBlobs(containerName, {
      includeMetadata: true,
      includeTags: true,
    });
    
    console.log(`\nBlobs in container "${containerName}":`);
    for (const blob of blobs) {
      console.log(`  - ${blob.name}`);
      console.log(`    Size: ${(blob.properties.contentLength || 0)} bytes`);
      console.log(`    Content Type: ${blob.properties.contentType || 'N/A'}`);
      console.log(`    Last Modified: ${blob.properties.lastModified}`);
      
      if (blob.metadata) {
        console.log(`    Metadata:`, blob.metadata);
      }
      
      if (blob.tags) {
        console.log(`    Tags:`, blob.tags);
      }
    }
    console.log();

    // Step 6: Download the blob and display its content
    console.log('Step 6: Downloading blob and displaying content...');
    console.log('-'.repeat(80));
    
    const downloadedContent = await blobService.downloadToBuffer(containerName, blobName);
    const contentText = downloadedContent.toString('utf-8');
    
    console.log('\nDownloaded content:');
    console.log('─'.repeat(80));
    console.log(contentText);
    console.log('─'.repeat(80));
    console.log();

    // Step 7: Acquire a lease and overwrite the blob
    console.log('Step 7: Acquiring lease and overwriting blob...');
    console.log('-'.repeat(80));
    
    const updatedContent = `${sampleContent}

--- UPDATED ---
This content was updated after acquiring a lease.
This prevents concurrent writes from other clients.
Update time: ${new Date().toISOString()}
`;
    
    await blobService.uploadWithLease(
      containerName,
      blobName,
      updatedContent,
      15, // 15 second lease
      {
        metadata: {
          author: 'demo-script',
          purpose: 'testing',
          environment: 'development',
          updated: 'true',
        },
        tags: {
          project: 'blob-demo',
          type: 'sample',
          status: 'updated',
        },
        contentType: 'text/plain',
      }
    );
    console.log();

    // Step 8: Verify the update by downloading again
    console.log('Step 8: Verifying the update...');
    console.log('-'.repeat(80));
    
    const verifyContent = await blobService.downloadToBuffer(containerName, blobName);
    const verifyText = verifyContent.toString('utf-8');
    
    console.log('Updated content preview (last 200 characters):');
    console.log('─'.repeat(80));
    console.log(verifyText.slice(-200));
    console.log('─'.repeat(80));
    console.log();

    // Step 9: Delete the blob
    console.log('Step 9: Cleaning up - deleting blob...');
    console.log('-'.repeat(80));
    
    await blobService.deleteBlob(containerName, blobName);
    console.log();

    // Step 10: Verify deletion by listing again
    console.log('Step 10: Verifying deletion...');
    console.log('-'.repeat(80));
    
    const blobsAfterDelete = await blobService.listBlobs(containerName);
    console.log(`Blobs remaining in container: ${blobsAfterDelete.length}`);
    console.log();

    // Cleanup local files
    console.log('Cleaning up local files...');
    if (fs.existsSync(sampleFilePath)) {
      fs.unlinkSync(sampleFilePath);
      console.log(`✓ Deleted ${sampleFilePath}`);
    }
    if (fs.existsSync(downloadPath)) {
      fs.unlinkSync(downloadPath);
      console.log(`✓ Deleted ${downloadPath}`);
    }
    console.log();

    console.log('='.repeat(80));
    console.log('✓ Demo completed successfully!');
    console.log('='.repeat(80));

  } catch (error: any) {
    console.error('='.repeat(80));
    console.error('✗ Error during demo:');
    console.error('='.repeat(80));
    console.error(error.message);
    
    if (error.statusCode) {
      console.error(`Status Code: ${error.statusCode}`);
    }
    
    if (error.code) {
      console.error(`Error Code: ${error.code}`);
    }
    
    if (error.details) {
      console.error('Details:', error.details);
    }
    
    console.error();
    console.error('Stack trace:');
    console.error(error.stack);
    
    process.exit(1);
  }
}

// Run the demo
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { main };
