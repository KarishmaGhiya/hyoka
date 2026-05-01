package com.azure.storage.manager;

import com.azure.core.http.policy.HttpLogDetailLevel;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Main {

    private static final String STORAGE_ENDPOINT_ENV = "AZURE_STORAGE_ENDPOINT";
    private static final String CONTAINER_NAME = "demo-container";
    private static final String SAMPLE_BLOB_NAME = "sample-file.txt";

    public static void main(String[] args) {
        try {
            System.out.println("=== Azure Blob Storage Manager Demo ===\n");

            // Check if storage endpoint is configured
            String endpoint = System.getenv(STORAGE_ENDPOINT_ENV);
            if (endpoint == null || endpoint.isEmpty()) {
                System.err.println("ERROR: Environment variable '" + STORAGE_ENDPOINT_ENV + 
                    "' is not set.");
                System.err.println("Please set it to your storage account endpoint, e.g.:");
                System.err.println("  https://<your-account>.blob.core.windows.net/");
                System.err.println("\nThis demo requires Azure Managed Identity authentication.");
                System.exit(1);
            }

            // Create configuration
            BlobStorageConfig config = BlobStorageConfig.builder()
                    .storageEndpointFromEnv(STORAGE_ENDPOINT_ENV)
                    .maxRetries(3)
                    .retryDelay(Duration.ofSeconds(2))
                    .maxRetryDelay(Duration.ofSeconds(30))
                    .requestTimeout(Duration.ofSeconds(120))
                    .logLevel(HttpLogDetailLevel.BASIC)
                    .build();

            System.out.println("Configuration:");
            System.out.println("  Storage Endpoint: " + endpoint);
            System.out.println("  Container: " + CONTAINER_NAME);
            System.out.println("  Max Retries: 3");
            System.out.println("  Request Timeout: 120s\n");

            // Demo sync operations
            System.out.println("=== SYNC OPERATIONS ===\n");
            runSyncDemo(config);

            System.out.println("\n=== ASYNC OPERATIONS ===\n");
            runAsyncDemo(config);

            System.out.println("\n=== Demo completed successfully! ===");

        } catch (Exception e) {
            System.err.println("ERROR: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }

    private static void runSyncDemo(BlobStorageConfig config) throws IOException {
        BlobStorageService service = new BlobStorageService(config, CONTAINER_NAME);

        // Create a sample file
        Path sampleFile = createSampleFile("This is a sample file for Azure Blob Storage demo.\n" +
                "It demonstrates efficient upload of files with metadata and tags.");
        
        System.out.println("1. Creating sample file: " + sampleFile);

        // Prepare metadata and tags
        Map<String, String> metadata = new HashMap<>();
        metadata.put("author", "demo-user");
        metadata.put("purpose", "testing");

        Map<String, String> indexTags = new HashMap<>();
        indexTags.put("environment", "development");
        indexTags.put("category", "sample");

        // Upload with metadata and tags
        System.out.println("\n2. Uploading blob with metadata and index tags...");
        String etag = service.upload(SAMPLE_BLOB_NAME, sampleFile, metadata, indexTags);
        System.out.println("   ✓ Uploaded successfully. ETag: " + etag);

        // List blobs
        System.out.println("\n3. Listing blobs in container...");
        List<String> blobs = service.listBlobs();
        System.out.println("   Found " + blobs.size() + " blob(s):");
        for (String blob : blobs) {
            System.out.println("   - " + blob);
        }

        // Download blob
        Path downloadPath = Files.createTempFile("downloaded-", ".txt");
        System.out.println("\n4. Downloading blob to: " + downloadPath);
        service.download(SAMPLE_BLOB_NAME, downloadPath);
        String content = Files.readString(downloadPath);
        System.out.println("   ✓ Downloaded successfully. Content preview:");
        System.out.println("   " + content.substring(0, Math.min(50, content.length())) + "...");

        // Acquire lease and overwrite
        System.out.println("\n5. Acquiring lease and overwriting blob...");
        String leaseId = service.acquireLease(SAMPLE_BLOB_NAME, Duration.ofSeconds(30));
        System.out.println("   ✓ Lease acquired: " + leaseId);

        Path updatedFile = createSampleFile("This file has been updated with lease-based concurrency control.\n" +
                "The lease ensures no other writers can modify this blob during the update.");
        
        String newEtag = service.uploadWithLease(SAMPLE_BLOB_NAME, updatedFile, 
                metadata, indexTags, Duration.ofSeconds(30));
        System.out.println("   ✓ Blob overwritten successfully. New ETag: " + newEtag);

        // Verify updated content
        Path verifyPath = Files.createTempFile("verify-", ".txt");
        service.download(SAMPLE_BLOB_NAME, verifyPath);
        String updatedContent = Files.readString(verifyPath);
        System.out.println("   ✓ Verified update. Content preview:");
        System.out.println("   " + updatedContent.substring(0, Math.min(50, updatedContent.length())) + "...");

        // Delete blob
        System.out.println("\n6. Deleting blob...");
        boolean deleted = service.delete(SAMPLE_BLOB_NAME);
        System.out.println("   ✓ Blob deleted: " + deleted);

        // Cleanup
        Files.deleteIfExists(sampleFile);
        Files.deleteIfExists(downloadPath);
        Files.deleteIfExists(updatedFile);
        Files.deleteIfExists(verifyPath);

        System.out.println("\n✓ Sync demo completed successfully!");
    }

    private static void runAsyncDemo(BlobStorageConfig config) throws IOException {
        BlobStorageAsyncService service = new BlobStorageAsyncService(config, CONTAINER_NAME);

        // Create a sample file
        Path sampleFile = createSampleFile("Async demo: This file is uploaded using reactive streams.\n" +
                "The async API provides non-blocking operations for better scalability.");
        
        System.out.println("1. Creating sample file: " + sampleFile);

        // Prepare metadata and tags
        Map<String, String> metadata = new HashMap<>();
        metadata.put("author", "async-demo-user");
        metadata.put("mode", "async");

        Map<String, String> indexTags = new HashMap<>();
        indexTags.put("environment", "async-test");
        indexTags.put("category", "reactive");

        // Upload with metadata and tags
        System.out.println("\n2. Uploading blob asynchronously with metadata and index tags...");
        String etag = service.upload(SAMPLE_BLOB_NAME, sampleFile, metadata, indexTags)
                .block();
        System.out.println("   ✓ Uploaded successfully. ETag: " + etag);

        // List blobs
        System.out.println("\n3. Listing blobs asynchronously...");
        List<String> blobs = service.listBlobs().block();
        System.out.println("   Found " + blobs.size() + " blob(s):");
        for (String blob : blobs) {
            System.out.println("   - " + blob);
        }

        // Download blob
        Path downloadPath = Files.createTempFile("async-downloaded-", ".txt");
        System.out.println("\n4. Downloading blob asynchronously to: " + downloadPath);
        service.download(SAMPLE_BLOB_NAME, downloadPath).block();
        String content = Files.readString(downloadPath);
        System.out.println("   ✓ Downloaded successfully. Content preview:");
        System.out.println("   " + content.substring(0, Math.min(50, content.length())) + "...");

        // Acquire lease and overwrite
        System.out.println("\n5. Acquiring lease and overwriting blob asynchronously...");
        String leaseId = service.acquireLease(SAMPLE_BLOB_NAME, Duration.ofSeconds(30))
                .block();
        System.out.println("   ✓ Lease acquired: " + leaseId);

        Path updatedFile = createSampleFile("Async update: Lease-based concurrency control with reactive streams.\n" +
                "This ensures thread-safe updates even in highly concurrent environments.");
        
        String newEtag = service.uploadWithLease(SAMPLE_BLOB_NAME, updatedFile, 
                metadata, indexTags, Duration.ofSeconds(30))
                .block();
        System.out.println("   ✓ Blob overwritten successfully. New ETag: " + newEtag);

        // Verify updated content
        Path verifyPath = Files.createTempFile("async-verify-", ".txt");
        service.download(SAMPLE_BLOB_NAME, verifyPath).block();
        String updatedContent = Files.readString(verifyPath);
        System.out.println("   ✓ Verified update. Content preview:");
        System.out.println("   " + updatedContent.substring(0, Math.min(50, updatedContent.length())) + "...");

        // Delete blob
        System.out.println("\n6. Deleting blob asynchronously...");
        Boolean deleted = service.delete(SAMPLE_BLOB_NAME).block();
        System.out.println("   ✓ Blob deleted: " + deleted);

        // Cleanup
        Files.deleteIfExists(sampleFile);
        Files.deleteIfExists(downloadPath);
        Files.deleteIfExists(updatedFile);
        Files.deleteIfExists(verifyPath);

        System.out.println("\n✓ Async demo completed successfully!");
    }

    private static Path createSampleFile(String content) throws IOException {
        Path tempFile = Files.createTempFile("sample-", ".txt");
        Files.writeString(tempFile, content);
        return tempFile;
    }
}
