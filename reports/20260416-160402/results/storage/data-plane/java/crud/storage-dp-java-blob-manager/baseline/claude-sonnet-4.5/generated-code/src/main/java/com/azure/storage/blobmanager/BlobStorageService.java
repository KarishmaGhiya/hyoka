package com.azure.storage.blobmanager;

import com.azure.core.util.Context;
import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.models.BlobHttpHeaders;
import com.azure.storage.blob.models.BlobItem;
import com.azure.storage.blob.models.BlobRequestConditions;
import com.azure.storage.blob.options.BlobParallelUploadOptions;
import com.azure.storage.blob.specialized.BlobLeaseClient;
import com.azure.storage.blob.specialized.BlobLeaseClientBuilder;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class BlobStorageService {

    private final BlobServiceClient serviceClient;
    private final Duration requestTimeout;

    public BlobStorageService(BlobStorageConfig config) {
        this.serviceClient = config.createSyncClient();
        this.requestTimeout = config.getRequestTimeout();
    }

    public void uploadBlob(String containerName, String blobName, Path filePath,
                          Map<String, String> metadata, Map<String, String> tags) throws IOException {
        BlobContainerClient containerClient = serviceClient.getBlobContainerClient(containerName);
        containerClient.createIfNotExists();
        
        BlobClient blobClient = containerClient.getBlobClient(blobName);
        
        try (InputStream inputStream = Files.newInputStream(filePath)) {
            long fileSize = Files.size(filePath);
            
            // Use parallel upload for efficient handling of large files
            // This uploads in blocks and doesn't load the entire file into memory
            BlobParallelUploadOptions options = new BlobParallelUploadOptions(inputStream)
                    .setMetadata(metadata)
                    .setTags(tags)
                    .setHeaders(new BlobHttpHeaders().setContentType(determineContentType(filePath)));
            
            blobClient.uploadWithResponse(options, requestTimeout, Context.NONE);
        }
    }

    public void uploadBlobWithLease(String containerName, String blobName, Path filePath,
                                   String leaseId) throws IOException {
        BlobContainerClient containerClient = serviceClient.getBlobContainerClient(containerName);
        BlobClient blobClient = containerClient.getBlobClient(blobName);
        
        try (InputStream inputStream = Files.newInputStream(filePath)) {
            // Use lease ID to prevent concurrent overwrites
            BlobRequestConditions conditions = new BlobRequestConditions().setLeaseId(leaseId);
            
            BlobParallelUploadOptions options = new BlobParallelUploadOptions(inputStream)
                    .setRequestConditions(conditions)
                    .setHeaders(new BlobHttpHeaders().setContentType(determineContentType(filePath)));
            
            blobClient.uploadWithResponse(options, requestTimeout, Context.NONE);
        }
    }

    public void downloadBlob(String containerName, String blobName, Path destination) throws IOException {
        BlobContainerClient containerClient = serviceClient.getBlobContainerClient(containerName);
        BlobClient blobClient = containerClient.getBlobClient(blobName);
        
        try (OutputStream outputStream = Files.newOutputStream(destination)) {
            blobClient.downloadStreamWithResponse(outputStream, null, null, null, 
                false, requestTimeout, Context.NONE);
        }
    }

    public byte[] downloadBlobToMemory(String containerName, String blobName) {
        BlobContainerClient containerClient = serviceClient.getBlobContainerClient(containerName);
        BlobClient blobClient = containerClient.getBlobClient(blobName);
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        blobClient.downloadStreamWithResponse(outputStream, null, null, null, 
            false, requestTimeout, Context.NONE);
        
        return outputStream.toByteArray();
    }

    public List<String> listBlobs(String containerName) {
        BlobContainerClient containerClient = serviceClient.getBlobContainerClient(containerName);
        List<String> blobNames = new ArrayList<>();
        
        for (BlobItem blobItem : containerClient.listBlobs()) {
            blobNames.add(blobItem.getName());
        }
        
        return blobNames;
    }

    public void deleteBlob(String containerName, String blobName) {
        BlobContainerClient containerClient = serviceClient.getBlobContainerClient(containerName);
        BlobClient blobClient = containerClient.getBlobClient(blobName);
        blobClient.deleteIfExists();
    }

    public String acquireLease(String containerName, String blobName, Duration duration) {
        BlobContainerClient containerClient = serviceClient.getBlobContainerClient(containerName);
        BlobClient blobClient = containerClient.getBlobClient(blobName);
        
        BlobLeaseClient leaseClient = new BlobLeaseClientBuilder()
                .blobClient(blobClient)
                .buildClient();
        
        return leaseClient.acquireLease((int) duration.getSeconds());
    }

    public void releaseLease(String containerName, String blobName, String leaseId) {
        BlobContainerClient containerClient = serviceClient.getBlobContainerClient(containerName);
        BlobClient blobClient = containerClient.getBlobClient(blobName);
        
        BlobLeaseClient leaseClient = new BlobLeaseClientBuilder()
                .blobClient(blobClient)
                .leaseId(leaseId)
                .buildClient();
        
        leaseClient.releaseLease();
    }

    private String determineContentType(Path filePath) {
        String fileName = filePath.getFileName().toString().toLowerCase();
        if (fileName.endsWith(".txt")) return "text/plain";
        if (fileName.endsWith(".json")) return "application/json";
        if (fileName.endsWith(".xml")) return "application/xml";
        if (fileName.endsWith(".pdf")) return "application/pdf";
        if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) return "image/jpeg";
        if (fileName.endsWith(".png")) return "image/png";
        return "application/octet-stream";
    }

    public void close() {
        // BlobServiceClient doesn't need explicit closing in current SDK versions
    }
}
