package com.example.blob;

import com.azure.core.http.rest.PagedFlux;
import com.azure.storage.blob.BlobAsyncClient;
import com.azure.storage.blob.BlobContainerAsyncClient;
import com.azure.storage.blob.BlobServiceAsyncClient;
import com.azure.storage.blob.models.BlobItem;
import com.azure.storage.blob.models.BlobRequestConditions;
import com.azure.storage.blob.options.BlobParallelUploadOptions;
import com.azure.storage.blob.specialized.BlobLeaseAsyncClient;
import com.azure.storage.blob.specialized.BlobLeaseClientBuilder;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.io.ByteArrayInputStream;
import java.nio.ByteBuffer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

public class BlobStorageServiceAsync {
    private final BlobServiceAsyncClient blobServiceAsyncClient;
    private static final int BLOCK_SIZE = 4 * 1024 * 1024; // 4MB blocks

    public BlobStorageServiceAsync(BlobServiceAsyncClient blobServiceAsyncClient) {
        this.blobServiceAsyncClient = blobServiceAsyncClient;
    }

    public Mono<Void> uploadBlob(String containerName, String blobName, Path filePath,
                                 Map<String, String> metadata, Map<String, String> tags) {
        return getOrCreateContainer(containerName)
                .flatMap(containerClient -> {
                    BlobAsyncClient blobClient = containerClient.getBlobAsyncClient(blobName);
                    
                    return Mono.fromCallable(() -> Files.newInputStream(filePath))
                            .flatMap(inputStream -> {
                                BlobParallelUploadOptions options = new BlobParallelUploadOptions(
                                        Flux.using(
                                            () -> inputStream,
                                            stream -> Flux.fromStream(
                                                java.util.stream.Stream.generate(() -> {
                                                    try {
                                                        byte[] buffer = new byte[BLOCK_SIZE];
                                                        int bytesRead = stream.read(buffer);
                                                        if (bytesRead == -1) return null;
                                                        return ByteBuffer.wrap(buffer, 0, bytesRead);
                                                    } catch (Exception e) {
                                                        throw new RuntimeException(e);
                                                    }
                                                }).takeWhile(bb -> bb != null)
                                            ),
                                            stream -> {
                                                try {
                                                    stream.close();
                                                } catch (Exception e) {
                                                    // Log or handle
                                                }
                                            }
                                        )
                                )
                                .setBlockSizeLong((long) BLOCK_SIZE)
                                .setMetadata(metadata)
                                .setTags(tags);

                                return blobClient.uploadWithResponse(options);
                            })
                            .then();
                });
    }

    public Mono<Void> uploadBlobWithData(String containerName, String blobName, byte[] data,
                                        Map<String, String> metadata, Map<String, String> tags) {
        return getOrCreateContainer(containerName)
                .flatMap(containerClient -> {
                    BlobAsyncClient blobClient = containerClient.getBlobAsyncClient(blobName);
                    
                    Flux<ByteBuffer> dataFlux = Flux.just(ByteBuffer.wrap(data));
                    BlobParallelUploadOptions options = new BlobParallelUploadOptions(dataFlux)
                            .setBlockSizeLong((long) BLOCK_SIZE)
                            .setMetadata(metadata)
                            .setTags(tags);

                    return blobClient.uploadWithResponse(options).then();
                });
    }

    public Mono<Void> uploadBlobWithLease(String containerName, String blobName, byte[] data,
                                         String leaseId, Map<String, String> metadata,
                                         Map<String, String> tags) {
        return getOrCreateContainer(containerName)
                .flatMap(containerClient -> {
                    BlobAsyncClient blobClient = containerClient.getBlobAsyncClient(blobName);

                    BlobRequestConditions conditions = new BlobRequestConditions()
                            .setLeaseId(leaseId);

                    Flux<ByteBuffer> dataFlux = Flux.just(ByteBuffer.wrap(data));
                    BlobParallelUploadOptions options = new BlobParallelUploadOptions(dataFlux)
                            .setBlockSizeLong((long) BLOCK_SIZE)
                            .setMetadata(metadata)
                            .setTags(tags)
                            .setRequestConditions(conditions);

                    return blobClient.uploadWithResponse(options).then();
                });
    }

    public Mono<byte[]> downloadBlob(String containerName, String blobName) {
        BlobContainerAsyncClient containerClient = blobServiceAsyncClient.getBlobContainerAsyncClient(containerName);
        BlobAsyncClient blobClient = containerClient.getBlobAsyncClient(blobName);

        return blobClient.downloadContent()
                .map(content -> content.toBytes());
    }

    public Mono<Void> downloadBlobToFile(String containerName, String blobName, Path destinationPath) {
        BlobContainerAsyncClient containerClient = blobServiceAsyncClient.getBlobContainerAsyncClient(containerName);
        BlobAsyncClient blobClient = containerClient.getBlobAsyncClient(blobName);

        return blobClient.downloadToFile(destinationPath.toString(), true);
    }

    public Mono<List<String>> listBlobs(String containerName) {
        BlobContainerAsyncClient containerClient = blobServiceAsyncClient.getBlobContainerAsyncClient(containerName);
        PagedFlux<BlobItem> blobs = containerClient.listBlobs();

        return blobs
                .map(BlobItem::getName)
                .collectList();
    }

    public Mono<Void> deleteBlob(String containerName, String blobName) {
        BlobContainerAsyncClient containerClient = blobServiceAsyncClient.getBlobContainerAsyncClient(containerName);
        BlobAsyncClient blobClient = containerClient.getBlobAsyncClient(blobName);
        return blobClient.delete();
    }

    public Mono<String> acquireLease(String containerName, String blobName, Duration leaseDuration) {
        BlobContainerAsyncClient containerClient = blobServiceAsyncClient.getBlobContainerAsyncClient(containerName);
        BlobAsyncClient blobClient = containerClient.getBlobAsyncClient(blobName);

        BlobLeaseAsyncClient leaseClient = new BlobLeaseClientBuilder()
                .blobAsyncClient(blobClient)
                .buildAsyncClient();

        return leaseClient.acquireLease((int) leaseDuration.getSeconds());
    }

    public Mono<Void> releaseLease(String containerName, String blobName, String leaseId) {
        BlobContainerAsyncClient containerClient = blobServiceAsyncClient.getBlobContainerAsyncClient(containerName);
        BlobAsyncClient blobClient = containerClient.getBlobAsyncClient(blobName);

        BlobLeaseAsyncClient leaseClient = new BlobLeaseClientBuilder()
                .blobAsyncClient(blobClient)
                .leaseId(leaseId)
                .buildAsyncClient();

        return leaseClient.releaseLease().then();
    }

    private Mono<BlobContainerAsyncClient> getOrCreateContainer(String containerName) {
        BlobContainerAsyncClient containerClient = blobServiceAsyncClient.getBlobContainerAsyncClient(containerName);
        return containerClient.exists()
                .flatMap(exists -> {
                    if (!exists) {
                        return containerClient.create().thenReturn(containerClient);
                    }
                    return Mono.just(containerClient);
                });
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
