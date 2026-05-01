import * as fs from 'fs';
import * as path from 'path';
import { createBlobStorageConfig } from './config';
import { BlobStorageService } from './blob-service';

/**
 * Demo script that showcases all Azure Blob Storage operations
 */
async function main() {
  console.log('=== Azure Blob Storage Manager Demo ===\n');

  // Step 1: Initialize configuration and service
  console.log('Step 1: Initializing Azure Blob Storage client...');
  
  // For demo purposes, set a default endpoint if not provided
  if (!process.env.AZURE_STORAGE_ACCOUNT_ENDPOINT) {
    console.log('Note: AZURE_STORAGE_ACCOUNT_ENDPOINT not set.');
    console.log('For production use, set: AZURE_STORAGE_ACCOUNT_ENDPOINT=https://<account>.blob.core.windows.net');
    console.log('For this demo, we\'ll use a placeholder (will fail at API calls without valid credentials)\n');
    process.env.AZURE_STORAGE_ACCOUNT_ENDPOINT = 'https://mystorageaccount.blob.core.windows.net';
  }

  const config = createBlobStorageConfig();
  const containerName = process.env.AZURE_CONTAINER_NAME || 'demo-container';
  const containerClient = config.getContainerClient(containerName);
  const blobService = new BlobStorageService(containerClient);

  console.log(`✓ Connected to container: ${containerName}\n`);

  // Ensure container exists
  console.log('Step 2: Ensuring container exists...');
  try {
    await blobService.ensureContainerExists();
    console.log('✓ Container ready\n');
  } catch (error: any) {
    console.error('✗ Failed to ensure container exists:', error.message);
    console.log('Note: This is expected if running without valid Azure credentials\n');
    console.log('To run successfully, you need:');
    console.log('1. Valid AZURE_STORAGE_ACCOUNT_ENDPOINT environment variable');
    console.log('2. Azure authentication configured (DefaultAzureCredential)');
    console.log('3. Appropriate permissions to the storage account\n');
    return;
  }

  // Step 3: Create a sample file to upload
  console.log('Step 3: Creating sample file...');
  const sampleFileName = 'sample.txt';
  const sampleFilePath = path.join(__dirname, sampleFileName);
  const sampleContent = 'Hello from Azure Blob Storage!\nThis is a demo file with streaming upload support.\n';
  fs.writeFileSync(sampleFilePath, sampleContent);
  console.log(`✓ Created sample file: ${sampleFileName}\n`);

  // Step 4: Upload the file with metadata and index tags
  console.log('Step 4: Uploading file with metadata and index tags...');
  const blobName = 'demo-file.txt';
  
  try {
    const uploadResponse = await blobService.uploadBlob(blobName, sampleFilePath, {
      metadata: {
        author: 'Azure Demo',
        version: '1.0',
      },
      tags: {
        environment: 'demo',
        project: 'blob-manager',
        category: 'sample',
      },
      contentType: 'text/plain',
    });
    
    console.log(`✓ Uploaded blob: ${blobName}`);
    console.log(`  ETag: ${uploadResponse.etag}`);
    console.log(`  Request ID: ${uploadResponse.requestId}\n`);
  } catch (error: any) {
    console.error('✗ Upload failed:', error.message, '\n');
  }

  // Step 5: List all blobs in the container
  console.log('Step 5: Listing all blobs in container...');
  
  try {
    const blobs = await blobService.listBlobs();
    console.log(`✓ Found ${blobs.length} blob(s):\n`);
    
    for (const blob of blobs) {
      console.log(`  - ${blob.name}`);
      console.log(`    Size: ${blob.size} bytes`);
      console.log(`    Content-Type: ${blob.contentType}`);
      console.log(`    Last Modified: ${blob.lastModified}`);
      
      if (blob.metadata && Object.keys(blob.metadata).length > 0) {
        console.log(`    Metadata:`, blob.metadata);
      }
      
      if (blob.tags && Object.keys(blob.tags).length > 0) {
        console.log(`    Tags:`, blob.tags);
      }
      console.log();
    }
  } catch (error: any) {
    console.error('✗ List failed:', error.message, '\n');
  }

  // Step 6: Download the blob and print its content
  console.log('Step 6: Downloading blob and reading content...');
  
  try {
    const buffer = await blobService.downloadBlobToBuffer(blobName);
    const content = buffer.toString('utf-8');
    
    console.log('✓ Downloaded blob content:');
    console.log('---');
    console.log(content);
    console.log('---\n');
  } catch (error: any) {
    console.error('✗ Download failed:', error.message, '\n');
  }

  // Step 7: Acquire a lease and overwrite the blob (prevents concurrent writes)
  console.log('Step 7: Acquiring lease and overwriting blob...');
  
  try {
    // Acquire lease for 30 seconds
    const leaseId = await blobService.acquireLease(blobName, 30);
    console.log(`✓ Acquired lease: ${leaseId}`);
    
    // Update the file content
    const updatedContent = 'Updated content with lease protection!\nNo concurrent writers can modify this.\n';
    fs.writeFileSync(sampleFilePath, updatedContent);
    
    // Upload with the lease
    const uploadResponse = await blobService.uploadBlobWithLease(
      blobName,
      sampleFilePath,
      leaseId,
      {
        metadata: {
          author: 'Azure Demo',
          version: '2.0',
          updated: 'true',
        },
        contentType: 'text/plain',
      }
    );
    
    console.log('✓ Overwrote blob with lease protection');
    console.log(`  ETag: ${uploadResponse.etag}\n`);
    
    // Release the lease
    await blobService.releaseLease(blobName, leaseId);
    console.log('✓ Released lease\n');
    
    // Verify the updated content
    console.log('Verifying updated content...');
    const updatedBuffer = await blobService.downloadBlobToBuffer(blobName);
    const updatedContentRead = updatedBuffer.toString('utf-8');
    
    console.log('✓ Updated blob content:');
    console.log('---');
    console.log(updatedContentRead);
    console.log('---\n');
  } catch (error: any) {
    console.error('✗ Lease/Update failed:', error.message, '\n');
  }

  // Step 8: Delete the blob
  console.log('Step 8: Deleting blob...');
  
  try {
    await blobService.deleteBlob(blobName);
    console.log(`✓ Deleted blob: ${blobName}\n`);
  } catch (error: any) {
    console.error('✗ Delete failed:', error.message, '\n');
  }

  // Cleanup: Remove local sample file
  console.log('Cleanup: Removing local sample file...');
  if (fs.existsSync(sampleFilePath)) {
    fs.unlinkSync(sampleFilePath);
    console.log('✓ Cleaned up local files\n');
  }

  console.log('=== Demo Complete ===');
}

// Run the demo
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
