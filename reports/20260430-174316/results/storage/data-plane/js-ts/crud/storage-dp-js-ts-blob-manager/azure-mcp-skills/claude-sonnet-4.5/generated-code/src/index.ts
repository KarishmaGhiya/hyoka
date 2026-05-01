import { BlobStorageService } from './blob-service';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('=== Azure Blob Storage Manager Demo ===\n');

  const blobService = new BlobStorageService();
  const blobName = 'demo-file.txt';
  const sampleFilePath = path.join(__dirname, '..', 'sample.txt');
  const downloadPath = path.join(__dirname, '..', 'downloaded.txt');
  const updatedFilePath = path.join(__dirname, '..', 'updated.txt');

  try {
    // Step 1: Create sample files for demo
    console.log('--- Step 1: Creating sample files ---');
    fs.writeFileSync(sampleFilePath, 'Hello from Azure Blob Storage!\nThis is the original content.');
    fs.writeFileSync(updatedFilePath, 'This is UPDATED content after acquiring a lease.');
    console.log('Sample files created.\n');

    // Step 2: Upload with metadata and index tags
    console.log('--- Step 2: Upload with metadata and index tags ---');
    await blobService.upload(blobName, sampleFilePath, {
      metadata: {
        author: 'demo-user',
        department: 'engineering',
        version: '1.0',
      },
      tags: {
        project: 'azure-demo',
        environment: 'development',
        category: 'sample',
      },
    });
    console.log();

    // Step 3: List all blobs
    console.log('--- Step 3: List all blobs in container ---');
    const blobs = await blobService.listBlobs();
    console.log(`Found ${blobs.length} blob(s):`);
    blobs.forEach((blob) => {
      console.log(`  - ${blob.name}`);
      console.log(`    Size: ${blob.properties.contentLength} bytes`);
      console.log(`    Last Modified: ${blob.properties.lastModified}`);
      if (blob.metadata) {
        console.log(`    Metadata:`, blob.metadata);
      }
      if (blob.tags) {
        console.log(`    Tags:`, blob.tags);
      }
    });
    console.log();

    // Step 4: Download and print content
    console.log('--- Step 4: Download blob and print content ---');
    const downloadedBuffer = await blobService.download(blobName, downloadPath);
    console.log('Content:');
    console.log(downloadedBuffer.toString('utf-8'));
    console.log();

    // Step 5: Acquire lease and overwrite
    console.log('--- Step 5: Acquire lease and overwrite blob ---');
    const leaseInfo = await blobService.acquireLease(blobName, 60);
    
    await blobService.uploadWithLease(leaseInfo, updatedFilePath, {
      metadata: {
        author: 'demo-user',
        department: 'engineering',
        version: '2.0',
      },
      tags: {
        project: 'azure-demo',
        environment: 'development',
        category: 'updated',
      },
    });

    await blobService.releaseLease(leaseInfo);
    console.log();

    // Verify the update
    console.log('--- Verify update ---');
    const updatedBuffer = await blobService.download(blobName);
    console.log('Updated content:');
    console.log(updatedBuffer.toString('utf-8'));
    console.log();

    // Step 6: Delete blob
    console.log('--- Step 6: Delete blob ---');
    await blobService.delete(blobName);
    console.log();

    // Verify deletion
    console.log('--- Verify deletion ---');
    const remainingBlobs = await blobService.listBlobs();
    console.log(`Remaining blobs: ${remainingBlobs.length}`);
    console.log();

    console.log('=== Demo completed successfully! ===');

    // Cleanup local files
    [sampleFilePath, downloadPath, updatedFilePath].forEach((file) => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });

  } catch (error) {
    console.error('Error during demo:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

main();
