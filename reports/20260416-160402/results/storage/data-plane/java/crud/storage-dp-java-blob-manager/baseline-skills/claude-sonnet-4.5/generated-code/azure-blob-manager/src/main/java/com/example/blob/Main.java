package com.example.blob;

import com.azure.core.http.policy.HttpLogDetailLevel;
import com.azure.storage.blob.BlobServiceAsyncClient;
import com.azure.storage.blob.BlobServiceClient;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Main {
    private static final String CONTAINER_NAME = "demo-container";
    private static final String BLOB_NAME = "demo-file.txt";
    private static final String DOWNLOAD_PATH = "downloaded-file.txt";

    public static void main(String[] args) {
        try {
            System.out.println("=== Azure Blob Storage Manager Demo ===\n");

            BlobStorageConfiguration config = new BlobStorageConfiguration.Builder()
                    .storageAccountEndpointFromEnv("AZURE_STORAGE_ENDPOINT")
                    .maxRetries(3)
                    .retryDelay(Duration.ofSeconds(2))
                    .requestTimeout(Duration.ofSeconds(60))
                    .logLevel(HttpLogDetailLevel.BASIC)
                    .build();

            System.out.println("Configuration created successfully");
            System.out.println("- Max Retries: 3");
            System.out.println("- Retry Delay: 2 seconds");
            System.out.println("- Request Timeout: 60 seconds");
            System.out.println("- Log Level: BASIC\n");

            // Demo with sync implementation
            demoSyncOperations(config);

            // Demo with async implementation
            demoAsyncOperations(config);

            System.out.println("\n=== Demo completed successfully ===");

        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }

    private static void demoSyncOperations(BlobStorageConfiguration config) throws Exception {
        System.out.println("\n--- SYNC OPERATIONS ---\n");

        BlobServiceClient syncClient = config.createSyncClient();
        BlobStorageService service = new BlobStorageService(syncClient);

        // 1. Upload with metadata and tags
        System.out.println("1. Uploading blob with metadata and index tags...");
        byte[] sampleData = "Hello from Azure Blob Storage! This is a demo file.".getBytes(StandardCharsets.UTF_8);
        
        Map<String, String> metadata = new HashMap<>();
        metadata.put("author", "demo-user");
        metadata.put("purpose", "demonstration");

        Map<String, String> tags = new HashMap<>();
        tags.put("environment", "development");
        tags.put("version", "1.0");

        service.uploadBlobWithData(CONTAINER_NAME, BLOB_NAME, sampleData, metadata, tags);
        System.out.println("   ✓ Blob uploaded successfully with metadata and tags\n");

        // 2. List blobs
        System.out.println("2. Listing blobs in container...");
        List<String> blobs = service.listBlobs(CONTAINER_NAME);
        System.out.println("   Found " + blobs.size() + " blob(s):");
        blobs.forEach(blob -> System.out.println("   - " + blob));
        System.out.println();

        // 3. Download blob
        System.out.println("3. Downloading blob...");
        byte[] downloadedData = service.downloadBlob(CONTAINER_NAME, BLOB_NAME);
        String content = new String(downloadedData, StandardCharsets.UTF_8);
        System.out.println("   ✓ Downloaded " + downloadedData.length + " bytes");
        System.out.println("   Content: " + content + "\n");

        // 4. Acquire lease and overwrite with lease
        System.out.println("4. Acquiring lease and overwriting blob...");
        String leaseId = service.acquireLease(CONTAINER_NAME, BLOB_NAME, 
                                             BlobStorageService.Duration.ofSeconds(30));
        System.out.println("   ✓ Lease acquired: " + leaseId);

        byte[] updatedData = "Updated content with lease protection!".getBytes(StandardCharsets.UTF_8);
        service.uploadBlobWithLease(CONTAINER_NAME, BLOB_NAME, updatedData, leaseId, metadata, tags);
        System.out.println("   ✓ Blob overwritten with lease protection\n");

        service.releaseLease(CONTAINER_NAME, BLOB_NAME, leaseId);
        System.out.println("   ✓ Lease released\n");

        // 5. Delete blob
        System.out.println("5. Deleting blob...");
        service.deleteBlob(CONTAINER_NAME, BLOB_NAME);
        System.out.println("   ✓ Blob deleted successfully\n");
    }

    private static void demoAsyncOperations(BlobStorageConfiguration config) {
        System.out.println("\n--- ASYNC OPERATIONS ---\n");

        BlobServiceAsyncClient asyncClient = config.createAsyncClient();
        BlobStorageServiceAsync asyncService = new BlobStorageServiceAsync(asyncClient);

        // 1. Upload with metadata and tags
        System.out.println("1. Uploading blob asynchronously with metadata and index tags...");
        byte[] sampleData = "Hello from async Azure Blob Storage! This is an async demo.".getBytes(StandardCharsets.UTF_8);
        
        Map<String, String> metadata = new HashMap<>();
        metadata.put("author", "async-demo-user");
        metadata.put("purpose", "async-demonstration");

        Map<String, String> tags = new HashMap<>();
        tags.put("environment", "production");
        tags.put("version", "2.0");

        asyncService.uploadBlobWithData(CONTAINER_NAME, BLOB_NAME, sampleData, metadata, tags)
                .doOnSuccess(v -> System.out.println("   ✓ Blob uploaded asynchronously\n"))
                .block();

        // 2. List blobs
        System.out.println("2. Listing blobs asynchronously...");
        List<String> blobs = asyncService.listBlobs(CONTAINER_NAME)
                .doOnSuccess(list -> {
                    System.out.println("   Found " + list.size() + " blob(s):");
                    list.forEach(blob -> System.out.println("   - " + blob));
                    System.out.println();
                })
                .block();

        // 3. Download blob
        System.out.println("3. Downloading blob asynchronously...");
        byte[] downloadedData = asyncService.downloadBlob(CONTAINER_NAME, BLOB_NAME)
                .doOnSuccess(data -> {
                    String content = new String(data, StandardCharsets.UTF_8);
                    System.out.println("   ✓ Downloaded " + data.length + " bytes");
                    System.out.println("   Content: " + content + "\n");
                })
                .block();

        // 4. Acquire lease and overwrite
        System.out.println("4. Acquiring lease and overwriting blob asynchronously...");
        String leaseId = asyncService.acquireLease(CONTAINER_NAME, BLOB_NAME,
                                                   BlobStorageServiceAsync.Duration.ofSeconds(30))
                .doOnSuccess(id -> System.out.println("   ✓ Lease acquired: " + id))
                .block();

        byte[] updatedData = "Async updated content with lease!".getBytes(StandardCharsets.UTF_8);
        asyncService.uploadBlobWithLease(CONTAINER_NAME, BLOB_NAME, updatedData, leaseId, metadata, tags)
                .doOnSuccess(v -> System.out.println("   ✓ Blob overwritten asynchronously with lease\n"))
                .block();

        asyncService.releaseLease(CONTAINER_NAME, BLOB_NAME, leaseId)
                .doOnSuccess(v -> System.out.println("   ✓ Lease released\n"))
                .block();

        // 5. Delete blob
        System.out.println("5. Deleting blob asynchronously...");
        asyncService.deleteBlob(CONTAINER_NAME, BLOB_NAME)
                .doOnSuccess(v -> System.out.println("   ✓ Blob deleted successfully\n"))
                .block();
    }

    private static class Duration {
        public static Duration ofSeconds(long seconds) {
            return new Duration(seconds);
        }

        private final long seconds;

        private Duration(long seconds) {
            this.seconds = seconds;
        }

        public long getSeconds() {
            return seconds;
        }
    }
}
