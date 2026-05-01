import { BlobStorageConfiguration } from './config';
import { BlobStorageService } from './blobService';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';

async function main() {
  console.log('=== Azure Blob Storage Manager Demo ===\n');

  console.log('[1/7] Initializing configuration...');
  const config = new BlobStorageConfiguration();
  const blobServiceClient = config.getBlobServiceClient();
  const containerName = config.getContainerName();

  console.log(`[Config] Account: ${config.getConfig().accountName}`);
  console.log(`[Config] Container: ${containerName}`);
  console.log(`[Config] Max Retries: ${config.getConfig().maxRetries}`);
  console.log(`[Config] Retry Delay: ${config.getConfig().retryDelayMs}ms`);
  console.log(`[Config] Log Level: ${config.getConfig().logLevel}\n`);

  console.log('[2/7] Creating blob service...');
  const blobService = new BlobStorageService(blobServiceClient, containerName);
  await blobService.ensureContainerExists();
  console.log(`[Success] Container '${containerName}' is ready\n`);

  const sampleFileName = 'demo-file.txt';
  const sampleFilePath = path.join(__dirname, sampleFileName);
  const sampleContent = `Hello from Azure Blob Storage Manager!
This is a demo file uploaded at ${new Date().toISOString()}.
The service supports streaming uploads for large files.`;

  console.log('[3/7] Creating and uploading sample file...');
  fs.writeFileSync(sampleFilePath, sampleContent);

  const uploadTags = {
    environment: 'demo',
    category: 'sample',
    uploadedBy: 'blob-manager',
  };

  const uploadMetadata = {
    author: 'Demo Script',
    version: '1.0',
  };

  await blobService.uploadFile(sampleFileName, sampleFilePath, {
    tags: uploadTags,
    metadata: uploadMetadata,
    contentType: 'text/plain',
  });

  console.log(`[Success] Uploaded '${sampleFileName}' with tags and metadata\n`);

  console.log('[4/7] Listing all blobs in container...');
  const blobs = await blobService.listBlobs();
  console.log(`[Found] ${blobs.length} blob(s):`);
  blobs.forEach((blob) => {
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
  });
  console.log();

  console.log('[5/7] Downloading blob and displaying content...');
  const downloadedContent = await blobService.download(sampleFileName);
  console.log('[Downloaded Content]:');
  console.log('---');
  console.log(downloadedContent.toString('utf-8'));
  console.log('---\n');

  console.log('[6/7] Acquiring lease and overwriting blob...');
  const updatedContent = `Updated content at ${new Date().toISOString()}.
This demonstrates lease-based concurrency control.
Multiple writers cannot overwrite simultaneously.`;

  const updatedStream = Readable.from([updatedContent]);
  await blobService.uploadWithLease(sampleFileName, updatedStream, {
    metadata: {
      author: 'Demo Script',
      version: '2.0',
    },
    contentType: 'text/plain',
  });

  console.log(`[Success] Blob '${sampleFileName}' overwritten with lease protection\n`);

  const updatedBlob = await blobService.download(sampleFileName);
  console.log('[Updated Content]:');
  console.log('---');
  console.log(updatedBlob.toString('utf-8'));
  console.log('---\n');

  console.log('[7/7] Deleting blob...');
  await blobService.deleteBlob(sampleFileName);
  console.log(`[Success] Blob '${sampleFileName}' deleted\n`);

  const blobStillExists = await blobService.blobExists(sampleFileName);
  console.log(`[Verification] Blob exists: ${blobStillExists}`);

  fs.unlinkSync(sampleFilePath);
  console.log('\n=== Demo Complete ===');
}

main().catch((error) => {
  console.error('\n[ERROR] Demo failed:', error.message);
  if (error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
});
