package com.azure.storage.manager;

import com.azure.core.util.Context;
import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.models.BlobHttpHeaders;
import com.azure.storage.blob.models.BlobItem;
import com.azure.storage.blob.models.BlobRequestConditions;
import com.azure.storage.blob.models.ListBlobsOptions;
import com.azure.storage.blob.models.ParallelTransferOptions;
import com.azure.storage.blob.options.BlobParallelUploadOptions;
import com.azure.storage.blob.specialized.BlobLeaseClient;
import com.azure.storage.blob.specialized.BlobLeaseClientBuilder;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

public class BlobStorageService {

    private final BlobContainerClient containerClient;
    private final Duration requestTimeout;

    public BlobStorageService(BlobStorageConfig config, String containerName) {
        this.containerClient = config.createContainerClient(containerName);
        this.requestTimeout = config.getRequestTimeout();
        ensureContainerExists();
    }

    private void ensureContainerExists() {
        if (!containerClient.exists()) {
            containerClient.create();
        }
    }

    /**
     * Upload a file to blob storage with optional metadata and index tags.
     * Uses streaming upload for efficient handling of large files.
     * 
     * @param blobName the name of the blob
     * @param filePath the local file path
     * @param metadata optional metadata
     * @param indexTags optional index tags for querying
     * @return the blob's ETag
     */
    public String upload(String blobName, Path filePath, 
                        Map<String, String> metadata,
                        Map<String, String> indexTags) throws IOException {
        
        BlobClient blobClient = containerClient.getBlobClient(blobName);
        
        // Configure parallel transfer for large files
        // Uses streaming to avoid loading entire file in memory
        ParallelTransferOptions parallelTransferOptions = new ParallelTransferOptions()
                .setBlockSizeLong(4L * 1024 * 1024) // 4MB blocks
                .setMaxConcurrency(4);

        BlobParallelUploadOptions options = new BlobParallelUploadOptions(filePath)
                .setParallelTransferOptions(parallelTransferOptions)
                .setMetadata(metadata)
                .setTags(indexTags)
                .setHeaders(new BlobHttpHeaders().setContentType(determineContentType(filePath)));

        var response = blobClient.uploadWithResponse(
                options,
                requestTimeout,
                Context.NONE);

        return response.getValue().getETag();
    }

    /**
     * Upload with lease-based concurrency control to prevent overwrites.
     * Acquires a lease before uploading to ensure exclusive write access.
     * 
     * @param blobName the name of the blob
     * @param filePath the local file path
     * @param metadata optional metadata
     * @param indexTags optional index tags
     * @param leaseDuration duration to hold the lease (15-60 seconds, or infinite with -1)
     * @return the blob's ETag
     */
    public String uploadWithLease(String blobName, Path filePath,
                                  Map<String, String> metadata,
                                  Map<String, String> indexTags,
                                  Duration leaseDuration) throws IOException {
        
        BlobClient blobClient = containerClient.getBlobClient(blobName);
        BlobLeaseClient leaseClient = new BlobLeaseClientBuilder()
                .blobClient(blobClient)
                .buildClient();

        String leaseId = null;
        try {
            // Acquire lease for exclusive access
            leaseId = leaseClient.acquireLease((int) leaseDuration.getSeconds());

            // Upload with lease condition to prevent concurrent modifications
            BlobRequestConditions conditions = new BlobRequestConditions()
                    .setLeaseId(leaseId);

            ParallelTransferOptions parallelTransferOptions = new ParallelTransferOptions()
                    .setBlockSizeLong(4L * 1024 * 1024)
                    .setMaxConcurrency(4);

            BlobParallelUploadOptions options = new BlobParallelUploadOptions(filePath)
                    .setParallelTransferOptions(parallelTransferOptions)
                    .setMetadata(metadata)
                    .setTags(indexTags)
                    .setHeaders(new BlobHttpHeaders().setContentType(determineContentType(filePath)))
                    .setRequestConditions(conditions);

            var response = blobClient.uploadWithResponse(
                    options,
                    requestTimeout,
                    Context.NONE);

            return response.getValue().getETag();
        } finally {
            if (leaseId != null) {
                leaseClient.releaseLease();
            }
        }
    }

    /**
     * Download a blob to a local file.
     * 
     * @param blobName the name of the blob
     * @param destinationPath the local destination path
     */
    public void download(String blobName, Path destinationPath) throws IOException {
        BlobClient blobClient = containerClient.getBlobClient(blobName);
        
        Files.createDirectories(destinationPath.getParent());
        
        blobClient.downloadToFileWithResponse(
                destinationPath.toString(),
                null, // range
                null, // parallelTransferOptions
                null, // downloadRetryOptions
                null, // requestConditions
                false, // rangeGetContentMd5
                requestTimeout,
                Context.NONE);
    }

    /**
     * Download a blob to an output stream.
     * 
     * @param blobName the name of the blob
     * @param outputStream the output stream
     */
    public void download(String blobName, OutputStream outputStream) {
        BlobClient blobClient = containerClient.getBlobClient(blobName);
        blobClient.downloadStreamWithResponse(
                outputStream,
                null, // range
                null, // downloadRetryOptions
                null, // requestConditions
                false, // rangeGetContentMd5
                requestTimeout,
                Context.NONE);
    }

    /**
     * List all blobs in the container.
     * 
     * @return list of blob names
     */
    public List<String> listBlobs() {
        return StreamSupport.stream(
                containerClient.listBlobs().spliterator(),
                false)
                .map(BlobItem::getName)
                .collect(Collectors.toList());
    }

    /**
     * List blobs with specific prefix.
     * 
     * @param prefix the blob name prefix
     * @return list of blob names
     */
    public List<String> listBlobs(String prefix) {
        ListBlobsOptions options = new ListBlobsOptions().setPrefix(prefix);
        return StreamSupport.stream(
                containerClient.listBlobs(options, requestTimeout).spliterator(),
                false)
                .map(BlobItem::getName)
                .collect(Collectors.toList());
    }

    /**
     * Delete a blob.
     * 
     * @param blobName the name of the blob
     * @return true if deleted, false if blob didn't exist
     */
    public boolean delete(String blobName) {
        BlobClient blobClient = containerClient.getBlobClient(blobName);
        return blobClient.deleteIfExists();
    }

    /**
     * Check if a blob exists.
     * 
     * @param blobName the name of the blob
     * @return true if exists
     */
    public boolean exists(String blobName) {
        BlobClient blobClient = containerClient.getBlobClient(blobName);
        return blobClient.exists();
    }

    /**
     * Acquire a lease on a blob for exclusive access.
     * 
     * @param blobName the name of the blob
     * @param leaseDuration duration in seconds (15-60, or -1 for infinite)
     * @return the lease ID
     */
    public String acquireLease(String blobName, Duration leaseDuration) {
        BlobClient blobClient = containerClient.getBlobClient(blobName);
        BlobLeaseClient leaseClient = new BlobLeaseClientBuilder()
                .blobClient(blobClient)
                .buildClient();
        
        return leaseClient.acquireLease((int) leaseDuration.getSeconds());
    }

    /**
     * Release a lease on a blob.
     * 
     * @param blobName the name of the blob
     * @param leaseId the lease ID
     */
    public void releaseLease(String blobName, String leaseId) {
        BlobClient blobClient = containerClient.getBlobClient(blobName);
        BlobLeaseClient leaseClient = new BlobLeaseClientBuilder()
                .blobClient(blobClient)
                .buildClient();
        
        leaseClient.releaseLease();
    }

    private String determineContentType(Path filePath) {
        try {
            String contentType = Files.probeContentType(filePath);
            return contentType != null ? contentType : "application/octet-stream";
        } catch (IOException e) {
            return "application/octet-stream";
        }
    }
}
