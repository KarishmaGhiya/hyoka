package com.example;

import com.azure.identity.DefaultAzureCredentialBuilder;
import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.BlobServiceClientBuilder;
import com.azure.storage.blob.models.BlobItem;
import com.azure.storage.blob.models.BlobStorageException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class BlobCrudApp {

    private static final String CONTAINER_NAME = "my-container";
    private static final String BLOB_NAME = "uploads/data.txt";
    private static final String LOCAL_FILE = "data.txt";
    private static final String DOWNLOADED_FILE = "data-downloaded.txt";

    public static void main(String[] args) {
        String accountUrl = System.getenv("AZURE_STORAGE_ACCOUNT_URL");
        if (accountUrl == null || accountUrl.isEmpty()) {
            System.err.println("Set AZURE_STORAGE_ACCOUNT_URL (e.g. https://<account>.blob.core.windows.net)");
            System.exit(1);
        }

        // 1. Create BlobServiceClient using DefaultAzureCredential
        BlobServiceClient serviceClient = new BlobServiceClientBuilder()
                .endpoint(accountUrl)
                .credential(new DefaultAzureCredentialBuilder().build())
                .buildClient();
        System.out.println("Connected to: " + accountUrl);

        BlobContainerClient containerClient = null;

        try {
            // 2. Create container if it doesn't exist
            containerClient = createContainer(serviceClient);

            // 3. Upload a local file as a blob
            uploadBlob(containerClient);

            // 4. List all blobs and print names/sizes
            listBlobs(containerClient);

            // 5. Download the blob to a local file
            downloadBlob(containerClient);

            // 6. Delete the blob, then delete the container
            deleteBlobAndContainer(containerClient);

        } catch (BlobStorageException e) {
            System.err.printf("Azure Blob Storage error: [%d] %s%n",
                    e.getStatusCode(), e.getMessage());
        } catch (Exception e) {
            System.err.println("Unexpected error: " + e.getMessage());
        }
    }

    private static BlobContainerClient createContainer(BlobServiceClient serviceClient) {
        System.out.println("\n--- Creating container ---");
        try {
            BlobContainerClient container = serviceClient.createBlobContainerIfNotExists(CONTAINER_NAME);
            System.out.println("Container created: " + CONTAINER_NAME);
            return container;
        } catch (BlobStorageException e) {
            if (e.getStatusCode() == 409) {
                System.out.println("Container already exists: " + CONTAINER_NAME);
                return serviceClient.getBlobContainerClient(CONTAINER_NAME);
            }
            throw e;
        }
    }

    private static void uploadBlob(BlobContainerClient containerClient) throws IOException {
        System.out.println("\n--- Uploading blob ---");
        Path localPath = Paths.get(LOCAL_FILE);
        if (!Files.exists(localPath)) {
            Files.writeString(localPath, "Hello, Azure Blob Storage!\nThis is sample data.\n");
            System.out.println("Created local file: " + LOCAL_FILE);
        }

        try {
            BlobClient blobClient = containerClient.getBlobClient(BLOB_NAME);
            blobClient.uploadFromFile(localPath.toString(), true);
            System.out.printf("Uploaded '%s' as blob '%s'%n", LOCAL_FILE, BLOB_NAME);
        } catch (BlobStorageException e) {
            System.err.printf("Upload failed: [%d] %s%n", e.getStatusCode(), e.getMessage());
            throw e;
        }
    }

    private static void listBlobs(BlobContainerClient containerClient) {
        System.out.println("\n--- Listing blobs ---");
        try {
            boolean found = false;
            for (BlobItem blobItem : containerClient.listBlobs()) {
                found = true;
                System.out.printf("  Name: %-30s Size: %d bytes%n",
                        blobItem.getName(),
                        blobItem.getProperties().getContentLength());
            }
            if (!found) {
                System.out.println("  (no blobs found)");
            }
        } catch (BlobStorageException e) {
            System.err.printf("List failed: [%d] %s%n", e.getStatusCode(), e.getMessage());
            throw e;
        }
    }

    private static void downloadBlob(BlobContainerClient containerClient) {
        System.out.println("\n--- Downloading blob ---");
        try {
            BlobClient blobClient = containerClient.getBlobClient(BLOB_NAME);
            Path downloadPath = Paths.get(DOWNLOADED_FILE);
            Files.deleteIfExists(downloadPath);
            blobClient.downloadToFile(downloadPath.toString());
            System.out.printf("Downloaded blob '%s' to '%s' (%d bytes)%n",
                    BLOB_NAME, DOWNLOADED_FILE, Files.size(downloadPath));
        } catch (BlobStorageException e) {
            System.err.printf("Download failed: [%d] %s%n", e.getStatusCode(), e.getMessage());
            throw e;
        } catch (IOException e) {
            System.err.println("File I/O error during download: " + e.getMessage());
        }
    }

    private static void deleteBlobAndContainer(BlobContainerClient containerClient) {
        System.out.println("\n--- Cleaning up ---");
        try {
            BlobClient blobClient = containerClient.getBlobClient(BLOB_NAME);
            blobClient.deleteIfExists();
            System.out.println("Deleted blob: " + BLOB_NAME);
        } catch (BlobStorageException e) {
            System.err.printf("Blob deletion failed: [%d] %s%n", e.getStatusCode(), e.getMessage());
        }

        try {
            containerClient.deleteIfExists();
            System.out.println("Deleted container: " + CONTAINER_NAME);
        } catch (BlobStorageException e) {
            System.err.printf("Container deletion failed: [%d] %s%n", e.getStatusCode(), e.getMessage());
        }
    }
}
