package com.azure.storage.blobmanager;

import com.azure.core.http.policy.HttpLogDetailLevel;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Main {

    private static final String CONTAINER_NAME = "demo-container";
    private static final String BLOB_NAME = "sample-file.txt";
    private static final String UPDATED_BLOB_NAME = "updated-sample-file.txt";

    public static void main(String[] args) {
        try {
            System.out.println("=== Azure Blob Storage Manager Demo ===\n");

            // Build configuration
            BlobStorageConfig config = BlobStorageConfig.builder()
                    .storageAccountEndpoint(getStorageEndpoint())
                    .maxRetries(3)
                    .retryDelay(Duration.ofSeconds(2))
                    .maxRetryDelay(Duration.ofSeconds(30))
                    .requestTimeout(Duration.ofMinutes(5))
                    .logLevel(HttpLogDetailLevel.BASIC)
                    .build();

            // Create a sample file for testing
            Path sampleFile = createSampleFile();
            Path downloadedFile = Path.of("downloaded-sample.txt");
            Path updatedFile = createUpdatedSampleFile();

            System.out.println("--- SYNCHRONOUS OPERATIONS ---\n");
            demonstrateSyncOperations(config, sampleFile, downloadedFile, updatedFile);

            System.out.println("\n--- ASYNCHRONOUS OPERATIONS ---\n");
            demonstrateAsyncOperations(config, sampleFile, downloadedFile, updatedFile);

            // Cleanup
            cleanup(sampleFile, downloadedFile, updatedFile);

            System.out.println("\n=== Demo completed successfully ===");

        } catch (Exception e) {
            System.err.println("Error during demo: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static void demonstrateSyncOperations(BlobStorageConfig config, Path sampleFile, 
                                                 Path downloadedFile, Path updatedFile) throws IOException {
        BlobStorageService service = new BlobStorageService(config);

        // 1. Upload blob with metadata and tags
        System.out.println("1. Uploading blob with metadata and index tags...");
        Map<String, String> metadata = new HashMap<>();
        metadata.put("author", "demo-user");
        metadata.put("department", "engineering");

        Map<String, String> tags = new HashMap<>();
        tags.put("environment", "demo");
        tags.put("project", "blob-manager");
        tags.put("classification", "public");

        service.uploadBlob(CONTAINER_NAME, BLOB_NAME, sampleFile, metadata, tags);
        System.out.println("   ✓ Blob uploaded successfully\n");

        // 2. List blobs
        System.out.println("2. Listing blobs in container...");
        List<String> blobs = service.listBlobs(CONTAINER_NAME);
        System.out.println("   Found " + blobs.size() + " blob(s):");
        for (String blob : blobs) {
            System.out.println("   - " + blob);
        }
        System.out.println();

        // 3. Download blob
        System.out.println("3. Downloading blob...");
        service.downloadBlob(CONTAINER_NAME, BLOB_NAME, downloadedFile);
        System.out.println("   ✓ Blob downloaded to: " + downloadedFile);
        System.out.println("   Downloaded content: " + Files.readString(downloadedFile) + "\n");

        // 4. Acquire lease and overwrite blob
        System.out.println("4. Acquiring lease and updating blob...");
        String leaseId = service.acquireLease(CONTAINER_NAME, BLOB_NAME, Duration.ofSeconds(30));
        System.out.println("   ✓ Lease acquired: " + leaseId);

        service.uploadBlobWithLease(CONTAINER_NAME, BLOB_NAME, updatedFile, leaseId);
        System.out.println("   ✓ Blob updated with lease protection");

        service.releaseLease(CONTAINER_NAME, BLOB_NAME, leaseId);
        System.out.println("   ✓ Lease released\n");

        // Verify update
        System.out.println("5. Verifying updated content...");
        byte[] content = service.downloadBlobToMemory(CONTAINER_NAME, BLOB_NAME);
        System.out.println("   Updated content: " + new String(content) + "\n");

        // 6. Delete blob
        System.out.println("6. Deleting blob...");
        service.deleteBlob(CONTAINER_NAME, BLOB_NAME);
        System.out.println("   ✓ Blob deleted successfully");

        service.close();
    }

    private static void demonstrateAsyncOperations(BlobStorageConfig config, Path sampleFile, 
                                                  Path downloadedFile, Path updatedFile) {
        BlobStorageAsyncService asyncService = new BlobStorageAsyncService(config);

        // 1. Upload blob with metadata and tags
        System.out.println("1. Uploading blob (async) with metadata and index tags...");
        Map<String, String> metadata = new HashMap<>();
        metadata.put("author", "async-demo-user");
        metadata.put("department", "engineering");

        Map<String, String> tags = new HashMap<>();
        tags.put("environment", "demo");
        tags.put("project", "blob-manager-async");
        tags.put("classification", "public");

        asyncService.uploadBlob(CONTAINER_NAME, BLOB_NAME, sampleFile, metadata, tags)
                .block();
        System.out.println("   ✓ Blob uploaded successfully (async)\n");

        // 2. List blobs
        System.out.println("2. Listing blobs in container (async)...");
        List<String> blobs = asyncService.listBlobs(CONTAINER_NAME).block();
        System.out.println("   Found " + blobs.size() + " blob(s):");
        for (String blob : blobs) {
            System.out.println("   - " + blob);
        }
        System.out.println();

        // 3. Download blob
        System.out.println("3. Downloading blob (async)...");
        asyncService.downloadBlob(CONTAINER_NAME, BLOB_NAME, downloadedFile).block();
        try {
            System.out.println("   ✓ Blob downloaded to: " + downloadedFile);
            System.out.println("   Downloaded content: " + Files.readString(downloadedFile) + "\n");
        } catch (IOException e) {
            System.err.println("   Error reading downloaded file: " + e.getMessage());
        }

        // 4. Acquire lease and overwrite blob
        System.out.println("4. Acquiring lease and updating blob (async)...");
        String leaseId = asyncService.acquireLease(CONTAINER_NAME, BLOB_NAME, Duration.ofSeconds(30))
                .block();
        System.out.println("   ✓ Lease acquired: " + leaseId);

        asyncService.uploadBlobWithLease(CONTAINER_NAME, BLOB_NAME, updatedFile, leaseId)
                .block();
        System.out.println("   ✓ Blob updated with lease protection");

        asyncService.releaseLease(CONTAINER_NAME, BLOB_NAME, leaseId).block();
        System.out.println("   ✓ Lease released\n");

        // Verify update
        System.out.println("5. Verifying updated content (async)...");
        byte[] content = asyncService.downloadBlobToMemory(CONTAINER_NAME, BLOB_NAME).block();
        System.out.println("   Updated content: " + new String(content) + "\n");

        // 6. Delete blob
        System.out.println("6. Deleting blob (async)...");
        asyncService.deleteBlob(CONTAINER_NAME, BLOB_NAME).block();
        System.out.println("   ✓ Blob deleted successfully");

        asyncService.close();
    }

    private static String getStorageEndpoint() {
        // Try to get from environment variable first
        String endpoint = System.getenv("AZURE_STORAGE_ENDPOINT");
        
        if (endpoint == null || endpoint.isEmpty()) {
            // For demo purposes, provide a placeholder
            // In production, this should always come from environment
            System.out.println("⚠ AZURE_STORAGE_ENDPOINT not set. Using placeholder.");
            System.out.println("⚠ Set the environment variable to run against real storage.");
            endpoint = "https://your-storage-account.blob.core.windows.net";
        }
        
        return endpoint;
    }

    private static Path createSampleFile() throws IOException {
        Path sampleFile = Path.of("sample-file.txt");
        String content = "This is a sample file for Azure Blob Storage demo.\n" +
                        "It demonstrates upload, download, and delete operations.\n" +
                        "Created for testing purposes.";
        Files.writeString(sampleFile, content);
        return sampleFile;
    }

    private static Path createUpdatedSampleFile() throws IOException {
        Path updatedFile = Path.of("updated-sample-file.txt");
        String content = "This is the UPDATED content of the sample file.\n" +
                        "This demonstrates blob overwrite with lease protection.\n" +
                        "Updated via lease to prevent concurrent modifications.";
        Files.writeString(updatedFile, content);
        return updatedFile;
    }

    private static void cleanup(Path... files) {
        for (Path file : files) {
            try {
                Files.deleteIfExists(file);
            } catch (IOException e) {
                System.err.println("Failed to delete file: " + file);
            }
        }
    }
}
