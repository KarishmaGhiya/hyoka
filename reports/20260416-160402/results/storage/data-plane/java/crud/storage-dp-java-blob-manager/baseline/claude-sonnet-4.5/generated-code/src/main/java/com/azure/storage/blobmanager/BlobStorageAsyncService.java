package com.azure.storage.blobmanager;

import com.azure.storage.blob.BlobAsyncClient;
import com.azure.storage.blob.BlobContainerAsyncClient;
import com.azure.storage.blob.BlobServiceAsyncClient;
import com.azure.storage.blob.models.BlobHttpHeaders;
import com.azure.storage.blob.models.BlobItem;
import com.azure.storage.blob.models.BlobRequestConditions;
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

    private final BlobServiceAsyncClient serviceClient;
    private final Duration requestTimeout;

    public BlobStorageAsyncService(BlobStorageConfig config) {
        this.serviceClient = config.createAsyncClient();
        this.requestTimeout = config.getRequestTimeout();
    }

    public Mono<Void> uploadBlob(String containerName, String blobName, Path filePath,
                                Map<String, String> metadata, Map<String, String> tags) {
        return Mono.defer(() -> {
            try {
                BlobContainerAsyncClient containerClient = serviceClient.getBlobContainerAsyncClient(containerName);
                
                return containerClient.createIfNotExists()
                        .then(Mono.fromCallable(() -> {
                            BlobAsyncClient blobClient = containerClient.getBlobAsyncClient(blobName);
                            
                            // Read file into flux for async upload
                            long fileSize = Files.size(filePath);
                            Flux<ByteBuffer> dataFlux = Flux.using(
                                    () -> Files.newInputStream(filePath),
                                    inputStream -> Flux.create(sink -> {
                                        byte[] buffer = new byte[4 * 1024 * 1024]; // 4MB chunks
                                        try {
                                            int bytesRead;
                                            while ((bytesRead = inputStream.read(buffer)) != -1) {
                                                byte[] data = new byte[bytesRead];
                                                System.arraycopy(buffer, 0, data, 0, bytesRead);
                                                sink.next(ByteBuffer.wrap(data));
                                            }
                                            sink.complete();
                                        } catch (IOException e) {
                                            sink.error(e);
                                        }
                                    }),
                                    inputStream -> {
                                        try {
                                            inputStream.close();
                                        } catch (IOException e) {
                                            // Log error
                                        }
                                    }
                            );
                            
                            BlobParallelUploadOptions options = new BlobParallelUploadOptions(dataFlux)
                                    .setMetadata(metadata)
                                    .setTags(tags)
                                    .setHeaders(new BlobHttpHeaders().setContentType(determineContentType(filePath)));
                            
                            return blobClient.uploadWithResponse(options).then();
                        }))
                        .flatMap(mono -> mono);
            } catch (IOException e) {
                return Mono.error(e);
            }
        });
    }

    public Mono<Void> uploadBlobWithLease(String containerName, String blobName, Path filePath,
                                         String leaseId) {
        return Mono.defer(() -> {
            try {
                BlobContainerAsyncClient containerClient = serviceClient.getBlobContainerAsyncClient(containerName);
                BlobAsyncClient blobClient = containerClient.getBlobAsyncClient(blobName);
                
                long fileSize = Files.size(filePath);
                Flux<ByteBuffer> dataFlux = Flux.using(
                        () -> Files.newInputStream(filePath),
                        inputStream -> Flux.create(sink -> {
                            byte[] buffer = new byte[4 * 1024 * 1024];
                            try {
                                int bytesRead;
                                while ((bytesRead = inputStream.read(buffer)) != -1) {
                                    byte[] data = new byte[bytesRead];
                                    System.arraycopy(buffer, 0, data, 0, bytesRead);
                                    sink.next(ByteBuffer.wrap(data));
                                }
                                sink.complete();
                            } catch (IOException e) {
                                sink.error(e);
                            }
                        }),
                        inputStream -> {
                            try {
                                inputStream.close();
                            } catch (IOException e) {
                                // Log error
                            }
                        }
                );
                
                BlobRequestConditions conditions = new BlobRequestConditions().setLeaseId(leaseId);
                BlobParallelUploadOptions options = new BlobParallelUploadOptions(dataFlux)
                        .setRequestConditions(conditions)
                        .setHeaders(new BlobHttpHeaders().setContentType(determineContentType(filePath)));
                
                return blobClient.uploadWithResponse(options).then();
            } catch (IOException e) {
                return Mono.error(e);
            }
        });
    }

    public Mono<Void> downloadBlob(String containerName, String blobName, Path destination) {
        BlobContainerAsyncClient containerClient = serviceClient.getBlobContainerAsyncClient(containerName);
        BlobAsyncClient blobClient = containerClient.getBlobAsyncClient(blobName);
        
        return blobClient.downloadToFile(destination.toString(), true);
    }

    public Mono<byte[]> downloadBlobToMemory(String containerName, String blobName) {
        BlobContainerAsyncClient containerClient = serviceClient.getBlobContainerAsyncClient(containerName);
        BlobAsyncClient blobClient = containerClient.getBlobAsyncClient(blobName);
        
        return blobClient.downloadContent()
                .map(content -> content.toBytes());
    }

    public Mono<List<String>> listBlobs(String containerName) {
        BlobContainerAsyncClient containerClient = serviceClient.getBlobContainerAsyncClient(containerName);
        
        return containerClient.listBlobs()
                .map(BlobItem::getName)
                .collectList();
    }

    public Mono<Boolean> deleteBlob(String containerName, String blobName) {
        BlobContainerAsyncClient containerClient = serviceClient.getBlobContainerAsyncClient(containerName);
        BlobAsyncClient blobClient = containerClient.getBlobAsyncClient(blobName);
        
        return blobClient.deleteIfExists();
    }

    public Mono<String> acquireLease(String containerName, String blobName, Duration duration) {
        BlobContainerAsyncClient containerClient = serviceClient.getBlobContainerAsyncClient(containerName);
        BlobAsyncClient blobClient = containerClient.getBlobAsyncClient(blobName);
        
        BlobLeaseAsyncClient leaseClient = new BlobLeaseClientBuilder()
                .blobAsyncClient(blobClient)
                .buildAsyncClient();
        
        return leaseClient.acquireLease((int) duration.getSeconds());
    }

    public Mono<Void> releaseLease(String containerName, String blobName, String leaseId) {
        BlobContainerAsyncClient containerClient = serviceClient.getBlobContainerAsyncClient(containerName);
        BlobAsyncClient blobClient = containerClient.getBlobAsyncClient(blobName);
        
        BlobLeaseAsyncClient leaseClient = new BlobLeaseClientBuilder()
                .blobAsyncClient(blobClient)
                .leaseId(leaseId)
                .buildAsyncClient();
        
        return leaseClient.releaseLease();
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
        // BlobServiceAsyncClient doesn't need explicit closing
    }
}
