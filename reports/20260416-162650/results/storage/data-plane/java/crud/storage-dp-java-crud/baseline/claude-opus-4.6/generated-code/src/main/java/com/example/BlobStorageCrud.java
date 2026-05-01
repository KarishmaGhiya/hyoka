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

public class BlobStorageCrud {

    private static final String CONTAINER_NAME = "my-container";
    private static final String BLOB_NAME = "uploads/data.txt";
    private static final String LOCAL_FILE = "data.txt";
    private static final String DOWNLOADED_FILE = "data-downloaded.txt";

    public static void main(String[] args) {
        String accountUrl = System.getenv("AZURE_STORAGE_ACCOUNT_URL");
        if (accountUrl == null || accountUrl.isEmpty()) {
            System.err.println("Set the AZURE_STORAGE_ACCOUNT_URL environment variable "
                    + "(e.g., https://<account>.blob.core.windows.net)");
            System.exit(1);
        }

        // 1. Create BlobServiceClient using DefaultAzureCredential
        BlobServiceClient serviceClient = new BlobServiceClientBuilder()
                .endpoint(accountUrl)
                .credential(new DefaultAzureCredentialBuilder().build())
                .buildClient();

        System.out.println("Connected to storage account: " + accountUrl);

        try {
            createContainer(serviceClient);
            uploadBlob(serviceClient);
            listBlobs(serviceClient);
            downloadBlob(serviceClient);
            deleteBlob(serviceClient);
            deleteContainer(serviceClient);

            System.out.println("\nAll CRUD operations completed successfully.");
        } catch (BlobStorageException e) {
            System.err.printf("Azure Blob Storage error: [%d] %s%n",
                    e.getStatusCode(), e.getServiceMessage());
        } catch (IOException e) {
            System.err.println("Local file I/O error: " + e.getMessage());
        }
    }

    // 2. Create container if it doesn't exist
    private static void createContainer(BlobServiceClient serviceClient) {
        System.out.println("\n--- Creating container ---");
        BlobContainerClient containerClient = serviceClient
                .getBlobContainerClient(CONTAINER_NAME);
        try {
            containerClient.create();
            System.out.println("Container '" + CONTAINER_NAME + "' created.");
        } catch (BlobStorageException e) {
            if (e.getStatusCode() == 409) {
                System.out.println("Container '" + CONTAINER_NAME + "' already exists.");
            } else {
                throw e;
            }
        }
    }

    // 3. Upload a local file as a blob
    private static void uploadBlob(BlobServiceClient serviceClient) throws IOException {
        System.out.println("\n--- Uploading blob ---");

        Path localPath = Paths.get(LOCAL_FILE);
        if (!Files.exists(localPath)) {
            // Create a sample file for demonstration
            Files.writeString(localPath, "Hello, Azure Blob Storage!\n");
            System.out.println("Created sample file: " + LOCAL_FILE);
        }

        BlobClient blobClient = serviceClient
                .getBlobContainerClient(CONTAINER_NAME)
                .getBlobClient(BLOB_NAME);

        blobClient.uploadFromFile(localPath.toString(), true);
        System.out.printf("Uploaded '%s' as blob '%s'.%n", LOCAL_FILE, BLOB_NAME);
    }

    // 4. List all blobs and print their names and sizes
    private static void listBlobs(BlobServiceClient serviceClient) {
        System.out.println("\n--- Listing blobs ---");
        BlobContainerClient containerClient = serviceClient
                .getBlobContainerClient(CONTAINER_NAME);

        for (BlobItem blobItem : containerClient.listBlobs()) {
            System.out.printf("  Name: %-30s Size: %d bytes%n",
                    blobItem.getName(),
                    blobItem.getProperties().getContentLength());
        }
    }

    // 5. Download the blob to a local file
    private static void downloadBlob(BlobServiceClient serviceClient) {
        System.out.println("\n--- Downloading blob ---");
        BlobClient blobClient = serviceClient
                .getBlobContainerClient(CONTAINER_NAME)
                .getBlobClient(BLOB_NAME);

        Path downloadPath = Paths.get(DOWNLOADED_FILE);
        // Overwrite if the file already exists
        downloadPath.toFile().delete();
        blobClient.downloadToFile(downloadPath.toString());
        System.out.printf("Downloaded blob '%s' to '%s'.%n", BLOB_NAME, DOWNLOADED_FILE);
    }

    // 6. Delete the blob, then delete the container
    private static void deleteBlob(BlobServiceClient serviceClient) {
        System.out.println("\n--- Deleting blob ---");
        BlobClient blobClient = serviceClient
                .getBlobContainerClient(CONTAINER_NAME)
                .getBlobClient(BLOB_NAME);

        try {
            blobClient.delete();
            System.out.println("Blob '" + BLOB_NAME + "' deleted.");
        } catch (BlobStorageException e) {
            if (e.getStatusCode() == 404) {
                System.out.println("Blob '" + BLOB_NAME + "' not found (already deleted).");
            } else {
                throw e;
            }
        }
    }

    private static void deleteContainer(BlobServiceClient serviceClient) {
        System.out.println("\n--- Deleting container ---");
        BlobContainerClient containerClient = serviceClient
                .getBlobContainerClient(CONTAINER_NAME);

        try {
            containerClient.delete();
            System.out.println("Container '" + CONTAINER_NAME + "' deleted.");
        } catch (BlobStorageException e) {
            if (e.getStatusCode() == 404) {
                System.out.println("Container '" + CONTAINER_NAME
                        + "' not found (already deleted).");
            } else {
                throw e;
            }
        }
    }
}
