package com.example.blob;

import com.azure.core.http.rest.PagedIterable;
import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.models.BlobItem;
import com.azure.storage.blob.models.BlobRequestConditions;
import com.azure.storage.blob.options.BlobParallelUploadOptions;
import com.azure.storage.blob.specialized.BlobLeaseClient;
import com.azure.storage.blob.specialized.BlobLeaseClientBuilder;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class BlobStorageService {
    private final BlobServiceClient blobServiceClient;
    private static final int BLOCK_SIZE = 4 * 1024 * 1024; // 4MB blocks

    public BlobStorageService(BlobServiceClient blobServiceClient) {
        this.blobServiceClient = blobServiceClient;
    }

    public void uploadBlob(String containerName, String blobName, Path filePath, 
                          Map<String, String> metadata, Map<String, String> tags) throws Exception {
        BlobContainerClient containerClient = getOrCreateContainer(containerName);
        BlobClient blobClient = containerClient.getBlobClient(blobName);

        try (InputStream inputStream = Files.newInputStream(filePath)) {
            BlobParallelUploadOptions options = new BlobParallelUploadOptions(inputStream)
                    .setBlockSizeLong((long) BLOCK_SIZE)
                    .setMetadata(metadata)
                    .setTags(tags);

            blobClient.uploadWithResponse(options, null, null);
        }
    }

    public void uploadBlobWithData(String containerName, String blobName, byte[] data,
                                   Map<String, String> metadata, Map<String, String> tags) throws Exception {
        BlobContainerClient containerClient = getOrCreateContainer(containerName);
        BlobClient blobClient = containerClient.getBlobClient(blobName);

        try (InputStream inputStream = new ByteArrayInputStream(data)) {
            BlobParallelUploadOptions options = new BlobParallelUploadOptions(inputStream)
                    .setBlockSizeLong((long) BLOCK_SIZE)
                    .setMetadata(metadata)
                    .setTags(tags);

            blobClient.uploadWithResponse(options, null, null);
        }
    }

    public void uploadBlobWithLease(String containerName, String blobName, byte[] data,
                                   String leaseId, Map<String, String> metadata, 
                                   Map<String, String> tags) throws Exception {
        BlobContainerClient containerClient = getOrCreateContainer(containerName);
        BlobClient blobClient = containerClient.getBlobClient(blobName);

        BlobRequestConditions conditions = new BlobRequestConditions()
                .setLeaseId(leaseId);

        try (InputStream inputStream = new ByteArrayInputStream(data)) {
            BlobParallelUploadOptions options = new BlobParallelUploadOptions(inputStream)
                    .setBlockSizeLong((long) BLOCK_SIZE)
                    .setMetadata(metadata)
                    .setTags(tags)
                    .setRequestConditions(conditions);

            blobClient.uploadWithResponse(options, null, null);
        }
    }

    public byte[] downloadBlob(String containerName, String blobName) throws Exception {
        BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);
        BlobClient blobClient = containerClient.getBlobClient(blobName);

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        blobClient.downloadStream(outputStream);
        return outputStream.toByteArray();
    }

    public void downloadBlobToFile(String containerName, String blobName, Path destinationPath) throws Exception {
        BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);
        BlobClient blobClient = containerClient.getBlobClient(blobName);

        blobClient.downloadToFile(destinationPath.toString(), true);
    }

    public List<String> listBlobs(String containerName) {
        BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);
        PagedIterable<BlobItem> blobs = containerClient.listBlobs();

        List<String> blobNames = new ArrayList<>();
        blobs.forEach(blobItem -> blobNames.add(blobItem.getName()));
        return blobNames;
    }

    public void deleteBlob(String containerName, String blobName) {
        BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);
        BlobClient blobClient = containerClient.getBlobClient(blobName);
        blobClient.delete();
    }

    public String acquireLease(String containerName, String blobName, Duration leaseDuration) {
        BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);
        BlobClient blobClient = containerClient.getBlobClient(blobName);

        BlobLeaseClient leaseClient = new BlobLeaseClientBuilder()
                .blobClient(blobClient)
                .buildClient();

        return leaseClient.acquireLease((int) leaseDuration.getSeconds());
    }

    public void releaseLease(String containerName, String blobName, String leaseId) {
        BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);
        BlobClient blobClient = containerClient.getBlobClient(blobName);

        BlobLeaseClient leaseClient = new BlobLeaseClientBuilder()
                .blobClient(blobClient)
                .leaseId(leaseId)
                .buildClient();

        leaseClient.releaseLease();
    }

    private BlobContainerClient getOrCreateContainer(String containerName) {
        BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);
        if (!containerClient.exists()) {
            containerClient.create();
        }
        return containerClient;
    }

    private static class Duration {
        public static Duration ofSeconds(int seconds) {
            return new Duration(seconds);
        }

        private final int seconds;

        private Duration(int seconds) {
            this.seconds = seconds;
        }

        public int getSeconds() {
            return seconds;
        }
    }
}
