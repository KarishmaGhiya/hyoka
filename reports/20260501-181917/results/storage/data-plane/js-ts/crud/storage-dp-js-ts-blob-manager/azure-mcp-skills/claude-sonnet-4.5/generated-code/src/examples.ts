/**
 * Additional usage examples for the Azure Blob Storage Manager
 */

import { StorageClientFactory } from './config/storage-config';
import { BlobStorageService } from './services/blob-storage.service';

/**
 * Example 1: Basic file upload and download
 */
async function basicExample() {
  const config = StorageClientFactory.loadConfigFromEnv();
  const client = StorageClientFactory.getClient(config);
  const service = new BlobStorageService(client, 'my-container');

  await service.ensureContainerExists();

  // Upload
  await service.uploadFile('document.pdf', './local/document.pdf', {
    contentType: 'application/pdf',
    metadata: { author: 'John Doe', version: '1.0' },
    tags: { department: 'legal', confidential: 'no' }
  });

  // Download
  await service.downloadFile('document.pdf', './downloads/document.pdf');
}

/**
 * Example 2: Uploading text content directly
 */
async function uploadTextExample() {
  const config = StorageClientFactory.loadConfigFromEnv();
  const client = StorageClientFactory.getClient(config);
  const service = new BlobStorageService(client, 'logs');

  await service.ensureContainerExists();

  const logEntry = `[${new Date().toISOString()}] Application started successfully`;
  
  await service.uploadContent('app.log', logEntry, {
    contentType: 'text/plain',
    tags: { level: 'info', component: 'startup' }
  });
}

/**
 * Example 3: Listing and filtering blobs
 */
async function listBlobsExample() {
  const config = StorageClientFactory.loadConfigFromEnv();
  const client = StorageClientFactory.getClient(config);
  const service = new BlobStorageService(client, 'documents');

  // List all blobs with 'report' prefix
  const blobs = await service.listBlobs('report');

  for (const blob of blobs) {
    console.log(`${blob.name} (${(blob.size / 1024).toFixed(2)} KB)`);
    
    // Check tags
    if (blob.tags?.year === '2026') {
      console.log('  → Recent report from 2026');
    }
  }
}

/**
 * Example 4: Safe concurrent updates with leases
 */
async function safeUpdateExample() {
  const config = StorageClientFactory.loadConfigFromEnv();
  const client = StorageClientFactory.getClient(config);
  const service = new BlobStorageService(client, 'config');

  await service.ensureContainerExists();

  const blobName = 'app-config.json';

  // Acquire lease (30 seconds)
  const leaseId = await service.acquireLease(blobName, 30);

  try {
    // Read current config
    const currentBuffer = await service.downloadToBuffer(blobName);
    const config = JSON.parse(currentBuffer.toString('utf-8'));

    // Modify
    config.lastUpdated = new Date().toISOString();
    config.version = (parseInt(config.version) + 1).toString();

    // Write back with lease protection
    await service.uploadWithLease(
      blobName,
      JSON.stringify(config, null, 2),
      leaseId,
      {
        contentType: 'application/json',
        metadata: { updated_by: 'worker-1' }
      }
    );

    console.log('Config updated successfully!');
  } finally {
    // Always release the lease
    await service.releaseLease(blobName, leaseId);
  }
}

/**
 * Example 5: Batch operations
 */
async function batchOperationsExample() {
  const config = StorageClientFactory.loadConfigFromEnv();
  const client = StorageClientFactory.getClient(config);
  const service = new BlobStorageService(client, 'backups');

  await service.ensureContainerExists();

  // Upload multiple files
  const files = ['backup-1.zip', 'backup-2.zip', 'backup-3.zip'];

  for (const file of files) {
    await service.uploadFile(file, `./backups/${file}`, {
      tags: { 
        type: 'backup', 
        date: new Date().toISOString().split('T')[0] 
      }
    });
  }

  // List all backups
  const blobs = await service.listBlobs();
  console.log(`Total backups: ${blobs.length}`);

  // Delete old backups (keep only latest 5)
  const sorted = blobs.sort((a, b) => 
    b.lastModified.getTime() - a.lastModified.getTime()
  );

  for (const blob of sorted.slice(5)) {
    console.log(`Deleting old backup: ${blob.name}`);
    await service.deleteBlob(blob.name);
  }
}

/**
 * Example 6: Checking if blob exists and getting properties
 */
async function checkBlobExample() {
  const config = StorageClientFactory.loadConfigFromEnv();
  const client = StorageClientFactory.getClient(config);
  const service = new BlobStorageService(client, 'reports');

  const blobName = 'monthly-report.pdf';

  try {
    const properties = await service.getBlobProperties(blobName);
    
    console.log(`Blob exists: ${blobName}`);
    console.log(`Size: ${(properties.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Last modified: ${properties.lastModified.toISOString()}`);
    console.log(`Content type: ${properties.contentType}`);
    console.log(`Metadata:`, properties.metadata);
    console.log(`Tags:`, properties.tags);
  } catch (error) {
    console.log(`Blob does not exist: ${blobName}`);
  }
}

/**
 * Example 7: Large file upload with progress tracking
 */
async function largeFileUploadExample() {
  const config = StorageClientFactory.loadConfigFromEnv();
  const client = StorageClientFactory.getClient(config);
  const service = new BlobStorageService(client, 'videos');

  await service.ensureContainerExists();

  console.log('Uploading large video file...');
  
  // The uploadFile method automatically uses streaming for efficient memory usage
  // Even a 5GB file will only use ~20MB of memory
  await service.uploadFile('training-video.mp4', './videos/large-file.mp4', {
    contentType: 'video/mp4',
    metadata: { 
      duration: '3600',
      resolution: '1920x1080',
      codec: 'h264'
    },
    tags: { 
      category: 'training',
      quality: 'hd',
      language: 'en'
    }
  });

  console.log('Upload complete!');
}

/**
 * Example 8: Download to buffer and process in memory
 */
async function downloadToBufferExample() {
  const config = StorageClientFactory.loadConfigFromEnv();
  const client = StorageClientFactory.getClient(config);
  const service = new BlobStorageService(client, 'data');

  const buffer = await service.downloadToBuffer('data.json');
  const data = JSON.parse(buffer.toString('utf-8'));

  // Process data
  console.log('Data processed:', data);

  // Transform and upload back
  data.processed = true;
  data.timestamp = new Date().toISOString();

  await service.uploadContent(
    'data-processed.json',
    JSON.stringify(data, null, 2),
    { contentType: 'application/json' }
  );
}

/**
 * Example 9: Error handling
 */
async function errorHandlingExample() {
  const config = StorageClientFactory.loadConfigFromEnv();
  const client = StorageClientFactory.getClient(config);
  const service = new BlobStorageService(client, 'test');

  try {
    await service.ensureContainerExists();
    await service.uploadFile('test.txt', './nonexistent-file.txt');
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Upload failed: ${error.message}`);
      
      // Handle specific error types
      if (error.message.includes('ENOENT')) {
        console.error('File not found on local system');
      } else if (error.message.includes('403')) {
        console.error('Permission denied - check RBAC role assignment');
      } else if (error.message.includes('404')) {
        console.error('Container not found');
      }
    }
  }
}

/**
 * Example 10: Working with multiple containers
 */
async function multipleContainersExample() {
  const config = StorageClientFactory.loadConfigFromEnv();
  const client = StorageClientFactory.getClient(config);

  // Create services for different containers
  const docsService = new BlobStorageService(client, 'documents');
  const imagesService = new BlobStorageService(client, 'images');
  const logsService = new BlobStorageService(client, 'logs');

  // Ensure all containers exist
  await Promise.all([
    docsService.ensureContainerExists(),
    imagesService.ensureContainerExists(),
    logsService.ensureContainerExists(),
  ]);

  // Upload to different containers
  await docsService.uploadFile('report.pdf', './report.pdf');
  await imagesService.uploadFile('logo.png', './logo.png');
  await logsService.uploadContent('app.log', 'Application started');

  console.log('Files uploaded to multiple containers');
}

// Export all examples
export {
  basicExample,
  uploadTextExample,
  listBlobsExample,
  safeUpdateExample,
  batchOperationsExample,
  checkBlobExample,
  largeFileUploadExample,
  downloadToBufferExample,
  errorHandlingExample,
  multipleContainersExample,
};
