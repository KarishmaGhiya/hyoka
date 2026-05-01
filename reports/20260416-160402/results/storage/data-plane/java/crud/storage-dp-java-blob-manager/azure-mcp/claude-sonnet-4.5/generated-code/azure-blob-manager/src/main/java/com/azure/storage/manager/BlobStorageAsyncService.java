package com.azure.storage.manager;

import com.azure.storage.blob.BlobAsyncClient;
import com.azure.storage.blob.BlobContainerAsyncClient;
import com.azure.storage.blob.models.BlobHttpHeaders;
import com.azure.storage.blob.models.BlobItem;
import com.azure.storage.blob.models.BlobRequestConditions;
import com.azure.storage.blob.models.ListBlobsOptions;
import com.azure.storage.blob.models.ParallelTransferOptions;
import com.azure.storage.blob.options.BlobParallelUploadOptions;
import com.azure.storage.blob.specialized.BlobLeaseAsyncClient;
import com.azure.storage.blob.specialized.BlobLeaseClientBuilder;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.Map;

public class BlobStorageAsyncService {

    private final BlobContainerAsyncClient containerClient;
    private final Duration requestTimeout;

    public BlobStorageAsyncService(BlobStorageConfig config, String containerName) {
        this.containerClient = config.createContainerAsyncClient(containerName);
        this.requestTimeout = config.getRequestTimeout();
        ensureContainerExists().block();
    }

    private Mono<Void> ensureContainerExists() {
        return containerClient.exists()
                .flatMap(exists -> {
                    if (!exists) {
                        return containerClient.create().then();
                    }
                    return Mono.empty();
                });
    }

    /**
     * Upload a file to blob storage with optional metadata and index tags (async).
     * Uses streaming upload for efficient handling of large files.
     * 
     * @param blobName the name of the blob
     * @param filePath the local file path
     * @param metadata optional metadata
     * @param indexTags optional index tags for querying
     * @return Mono containing the blob's ETag
     */
    public Mono<String> upload(String blobName, Path filePath,
                               Map<String, String> metadata,
                               Map<String, String> indexTags) {
        
        BlobAsyncClient blobClient = containerClient.getBlobAsyncClient(blobName);
        
        return Mono.fromCallable(() -> {
            // Read file as Flux for streaming
            Flux<ByteBuffer> dataFlux = Flux.using(
                    () -> Files.newInputStream(filePath),
                    inputStream -> Flux.generate(
                            () -> new byte[4 * 1024 * 1024], // 4MB buffer
                            (buffer, sink) -> {
                                try {
                                    int bytesRead = inputStream.read(buffer);
                                    if (bytesRead == -1) {
                                        sink.complete();
                                    } else {
                                        sink.next(ByteBuffer.wrap(buffer, 0, bytesRead));
                                    }
                                } catch (IOException e) {
                                    sink.error(e);
                                }
                                return buffer;
                            }
                    ),
                    inputStream -> {
                        try {
                            inputStream.close();
                        } catch (IOException e) {
                            // Log error
                        }
                    }
            );

            ParallelTransferOptions parallelTransferOptions = new ParallelTransferOptions()
                    .setBlockSizeLong(4L * 1024 * 1024)
                    .setMaxConcurrency(4);

            BlobParallelUploadOptions options = new BlobParallelUploadOptions(dataFlux)
                    .setParallelTransferOptions(parallelTransferOptions)
                    .setMetadata(metadata)
                    .setTags(indexTags)
                    .setHeaders(new BlobHttpHeaders().setContentType(determineContentType(filePath)));

            return options;
        }).flatMap(options -> 
            blobClient.uploadWithResponse(options)
                    .timeout(requestTimeout)
                    .map(response -> response.getValue().getETag())
        );
    }

    /**
     * Upload with lease-based concurrency control (async).
     * 
     * @param blobName the name of the blob
     * @param filePath the local file path
     * @param metadata optional metadata
     * @param indexTags optional index tags
     * @param leaseDuration duration to hold the lease
     * @return Mono containing the blob's ETag
     */
    public Mono<String> uploadWithLease(String blobName, Path filePath,
                                        Map<String, String> metadata,
                                        Map<String, String> indexTags,
                                        Duration leaseDuration) {
        
        BlobAsyncClient blobClient = containerClient.getBlobAsyncClient(blobName);
        BlobLeaseAsyncClient leaseClient = new BlobLeaseClientBuilder()
                .blobAsyncClient(blobClient)
                .buildAsyncClient();

        return leaseClient.acquireLease((int) leaseDuration.getSeconds())
                .flatMap(leaseId -> {
                    BlobRequestConditions conditions = new BlobRequestConditions()
                            .setLeaseId(leaseId);

                    return Mono.fromCallable(() -> {
                        Flux<ByteBuffer> dataFlux = Flux.using(
                                () -> Files.newInputStream(filePath),
                                inputStream -> Flux.generate(
                                        () -> new byte[4 * 1024 * 1024],
                                        (buffer, sink) -> {
                                            try {
                                                int bytesRead = inputStream.read(buffer);
                                                if (bytesRead == -1) {
                                                    sink.complete();
                                                } else {
                                                    sink.next(ByteBuffer.wrap(buffer, 0, bytesRead));
                                                }
                                            } catch (IOException e) {
                                                sink.error(e);
                                            }
                                            return buffer;
                                        }
                                ),
                                inputStream -> {
                                    try {
                                        inputStream.close();
                                    } catch (IOException e) {
                                        // Log error
                                    }
                                }
                        );

                        ParallelTransferOptions parallelTransferOptions = new ParallelTransferOptions()
                                .setBlockSizeLong(4L * 1024 * 1024)
                                .setMaxConcurrency(4);

                        return new BlobParallelUploadOptions(dataFlux)
                                .setParallelTransferOptions(parallelTransferOptions)
                                .setMetadata(metadata)
                                .setTags(indexTags)
                                .setHeaders(new BlobHttpHeaders().setContentType(determineContentType(filePath)))
                                .setRequestConditions(conditions);
                    }).flatMap(options -> 
                        blobClient.uploadWithResponse(options)
                                .timeout(requestTimeout)
                                .map(response -> response.getValue().getETag())
                                .doFinally(signal -> leaseClient.releaseLease().subscribe())
                    );
                });
    }

    /**
     * Download a blob to a local file (async).
     * 
     * @param blobName the name of the blob
     * @param destinationPath the local destination path
     * @return Mono that completes when download finishes
     */
    public Mono<Void> download(String blobName, Path destinationPath) {
        BlobAsyncClient blobClient = containerClient.getBlobAsyncClient(blobName);
        
        return Mono.fromCallable(() -> {
            Files.createDirectories(destinationPath.getParent());
            return destinationPath;
        }).flatMap(path -> 
            blobClient.downloadToFile(path.toString(), true)
                    .timeout(requestTimeout)
                    .then()
        );
    }

    /**
     * List all blobs in the container (async).
     * 
     * @return Mono containing list of blob names
     */
    public Mono<List<String>> listBlobs() {
        return containerClient.listBlobs()
                .map(BlobItem::getName)
                .collectList();
    }

    /**
     * List blobs with specific prefix (async).
     * 
     * @param prefix the blob name prefix
     * @return Mono containing list of blob names
     */
    public Mono<List<String>> listBlobs(String prefix) {
        ListBlobsOptions options = new ListBlobsOptions().setPrefix(prefix);
        return containerClient.listBlobs(options)
                .map(BlobItem::getName)
                .collectList();
    }

    /**
     * Delete a blob (async).
     * 
     * @param blobName the name of the blob
     * @return Mono containing true if deleted
     */
    public Mono<Boolean> delete(String blobName) {
        BlobAsyncClient blobClient = containerClient.getBlobAsyncClient(blobName);
        return blobClient.deleteIfExists();
    }

    /**
     * Check if a blob exists (async).
     * 
     * @param blobName the name of the blob
     * @return Mono containing true if exists
     */
    public Mono<Boolean> exists(String blobName) {
        BlobAsyncClient blobClient = containerClient.getBlobAsyncClient(blobName);
        return blobClient.exists();
    }

    /**
     * Acquire a lease on a blob (async).
     * 
     * @param blobName the name of the blob
     * @param leaseDuration duration in seconds
     * @return Mono containing the lease ID
     */
    public Mono<String> acquireLease(String blobName, Duration leaseDuration) {
        BlobAsyncClient blobClient = containerClient.getBlobAsyncClient(blobName);
        BlobLeaseAsyncClient leaseClient = new BlobLeaseClientBuilder()
                .blobAsyncClient(blobClient)
                .buildAsyncClient();
        
        return leaseClient.acquireLease((int) leaseDuration.getSeconds());
    }

    /**
     * Release a lease on a blob (async).
     * 
     * @param blobName the name of the blob
     * @param leaseId the lease ID
     * @return Mono that completes when lease is released
     */
    public Mono<Void> releaseLease(String blobName, String leaseId) {
        BlobAsyncClient blobClient = containerClient.getBlobAsyncClient(blobName);
        BlobLeaseAsyncClient leaseClient = new BlobLeaseClientBuilder()
                .blobAsyncClient(blobClient)
                .buildAsyncClient();
        
        return leaseClient.releaseLease();
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
