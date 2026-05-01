package com.example;

import com.azure.identity.DefaultAzureCredentialBuilder;
import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.BlobServiceClientBuilder;
import com.azure.storage.blob.models.BlobItem;
import com.azure.storage.blob.models.BlobStorageException;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Demonstrates CRUD operations on Azure Blob Storage using DefaultAzureCredential.
 *
 * <p>Set the environment variable {@code AZURE_STORAGE_ACCOUNT_NAME} to your storage account name
 * before running this application.</p>
 */
public class BlobStorageCrud {

    private static final String CONTAINER_NAME = "my-container";
    private static final String BLOB_NAME = "uploads/data.txt";
    private static final String LOCAL_FILE_PATH = "data.txt";
    private static final String DOWNLOADED_FILE_PATH = "data-downloaded.txt";

    public static void main(String[] args) {
        String accountName = System.getenv("AZURE_STORAGE_ACCOUNT_NAME");
        if (accountName == null || accountName.isBlank()) {
            System.err.println("Error: set the AZURE_STORAGE_ACCOUNT_NAME environment variable.");
            System.exit(1);
        }

        String endpoint = String.format("https://%s.blob.core.windows.net", accountName);

        // 1. Create a BlobServiceClient using DefaultAzureCredential
        BlobServiceClient serviceClient = new BlobServiceClientBuilder()
                .endpoint(endpoint)
                .credential(new DefaultAzureCredentialBuilder().build())
                .buildClient();
        System.out.println("Connected to storage account: " + accountName);

        try {
            createContainer(serviceClient);
            uploadBlob(serviceClient);
            listBlobs(serviceClient);
            downloadBlob(serviceClient);
            deleteBlob(serviceClient);
            deleteContainer(serviceClient);

            System.out.println("\nAll CRUD operations completed successfully.");
        } catch (BlobStorageException e) {
            System.err.printf("Azure Blob Storage error (HTTP %d): %s%n",
                    e.getStatusCode(), e.getServiceMessage());
        } catch (UncheckedIOException | IOException e) {
            System.err.println("I/O error: " + e.getMessage());
        }
    }

    /** 2. Create a container named "my-container" if it doesn't exist. */
    private static void createContainer(BlobServiceClient serviceClient) {
        System.out.println("\n--- Creating container ---");
        BlobContainerClient containerClient = serviceClient.getBlobContainerClient(CONTAINER_NAME);
        try {
            containerClient.create();
            System.out.println("Container created: " + CONTAINER_NAME);
        } catch (BlobStorageException e) {
            if (e.getStatusCode() == 409) {
                System.out.println("Container already exists: " + CONTAINER_NAME);
            } else {
                throw e;
            }
        }
    }

    /** 3. Upload a local file "data.txt" as a blob named "uploads/data.txt". */
    private static void uploadBlob(BlobServiceClient serviceClient) throws IOException {
        System.out.println("\n--- Uploading blob ---");

        Path localPath = Paths.get(LOCAL_FILE_PATH);
        if (!Files.exists(localPath)) {
            System.out.println("Local file not found; creating sample " + LOCAL_FILE_PATH);
            Files.writeString(localPath, "Hello, Azure Blob Storage!\n");
        }

        BlobClient blobClient = serviceClient
                .getBlobContainerClient(CONTAINER_NAME)
                .getBlobClient(BLOB_NAME);

        blobClient.uploadFromFile(localPath.toString(), true);
        System.out.printf("Uploaded '%s' as blob '%s'%n", LOCAL_FILE_PATH, BLOB_NAME);
    }

    /** 4. List all blobs in the container and print their names and sizes. */
    private static void listBlobs(BlobServiceClient serviceClient) {
        System.out.println("\n--- Listing blobs ---");
        BlobContainerClient containerClient = serviceClient.getBlobContainerClient(CONTAINER_NAME);

        for (BlobItem blobItem : containerClient.listBlobs()) {
            long size = blobItem.getProperties().getContentLength();
            System.out.printf("  Name: %-30s Size: %d bytes%n", blobItem.getName(), size);
        }
    }

    /** 5. Download the blob back to a local file "data-downloaded.txt". */
    private static void downloadBlob(BlobServiceClient serviceClient) {
        System.out.println("\n--- Downloading blob ---");
        BlobClient blobClient = serviceClient
                .getBlobContainerClient(CONTAINER_NAME)
                .getBlobClient(BLOB_NAME);

        blobClient.downloadToFile(DOWNLOADED_FILE_PATH, true);
        System.out.printf("Downloaded blob '%s' to '%s'%n", BLOB_NAME, DOWNLOADED_FILE_PATH);
    }

    /** 6. Delete the blob and then delete the container. */
    private static void deleteBlob(BlobServiceClient serviceClient) {
        System.out.println("\n--- Deleting blob ---");
        BlobClient blobClient = serviceClient
                .getBlobContainerClient(CONTAINER_NAME)
                .getBlobClient(BLOB_NAME);

        try {
            blobClient.delete();
            System.out.println("Deleted blob: " + BLOB_NAME);
        } catch (BlobStorageException e) {
            if (e.getStatusCode() == 404) {
                System.out.println("Blob not found (already deleted): " + BLOB_NAME);
            } else {
                throw e;
            }
        }
    }

    private static void deleteContainer(BlobServiceClient serviceClient) {
        System.out.println("\n--- Deleting container ---");
        BlobContainerClient containerClient = serviceClient.getBlobContainerClient(CONTAINER_NAME);

        try {
            containerClient.delete();
            System.out.println("Deleted container: " + CONTAINER_NAME);
        } catch (BlobStorageException e) {
            if (e.getStatusCode() == 404) {
                System.out.println("Container not found (already deleted): " + CONTAINER_NAME);
            } else {
                throw e;
            }
        }
    }
}
