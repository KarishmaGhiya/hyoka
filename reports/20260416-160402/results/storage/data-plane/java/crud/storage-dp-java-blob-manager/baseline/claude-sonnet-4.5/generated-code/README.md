# Azure Blob Storage Manager

A reusable Java 17 Maven utility for managing Azure Blob Storage operations with both synchronous and asynchronous implementations.

## Features

- **Secure Authentication**: Uses Azure Managed Identity (no connection strings or account keys)
- **Efficient Large File Handling**: Parallel upload with chunking for multi-gigabyte files
- **Concurrency Protection**: Blob leasing to prevent concurrent overwrites
- **Configurable Retry Policy**: Exponential backoff with customizable parameters
- **HTTP Logging**: Configurable request/response logging for debugging
- **Sync & Async**: Both synchronous and reactive async implementations

## Project Structure

```
blob-manager/
├── pom.xml
└── src/main/java/com/azure/storage/blobmanager/
    ├── BlobStorageConfig.java          # Configuration with managed identity
    ├── BlobStorageService.java         # Synchronous operations
    ├── BlobStorageAsyncService.java    # Asynchronous operations
    └── Main.java                        # Demo application
```

## Usage

### Configuration

```java
BlobStorageConfig config = BlobStorageConfig.builder()
    .storageAccountEndpointFromEnv("AZURE_STORAGE_ENDPOINT")
    .maxRetries(3)
    .retryDelay(Duration.ofSeconds(2))
    .maxRetryDelay(Duration.ofSeconds(30))
    .requestTimeout(Duration.ofMinutes(5))
    .logLevel(HttpLogDetailLevel.BASIC)
    .build();
```

### Synchronous Operations

```java
BlobStorageService service = new BlobStorageService(config);

// Upload with metadata and tags
Map<String, String> metadata = Map.of("author", "user");
Map<String, String> tags = Map.of("environment", "prod");
service.uploadBlob("container", "blob.txt", filePath, metadata, tags);

// List blobs
List<String> blobs = service.listBlobs("container");

// Download
service.downloadBlob("container", "blob.txt", downloadPath);

// Lease and update
String leaseId = service.acquireLease("container", "blob.txt", Duration.ofSeconds(30));
service.uploadBlobWithLease("container", "blob.txt", updatePath, leaseId);
service.releaseLease("container", "blob.txt", leaseId);

// Delete
service.deleteBlob("container", "blob.txt");
```

### Asynchronous Operations

```java
BlobStorageAsyncService asyncService = new BlobStorageAsyncService(config);

// All operations return Mono/Flux for reactive composition
asyncService.uploadBlob("container", "blob.txt", filePath, metadata, tags)
    .then(asyncService.listBlobs("container"))
    .flatMapMany(Flux::fromIterable)
    .subscribe(blob -> System.out.println("Blob: " + blob));
```

## Running the Demo

### Prerequisites

1. Azure Storage Account with Managed Identity enabled
2. Java 17+
3. Maven 3.6+

### Environment Setup

```bash
export AZURE_STORAGE_ENDPOINT=https://your-storage-account.blob.core.windows.net
```

### Build and Run

```bash
mvn clean package
java -jar target/blob-manager-1.0.0.jar
```

## Key Implementation Details

### Large File Handling
- Uses `BlobParallelUploadOptions` with streaming input
- Uploads in blocks (4MB chunks) without loading entire file into memory
- Supports files of any size within Azure limits

### Concurrency Protection
- Blob leasing ensures exclusive write access
- Prevents race conditions when multiple processes update the same blob
- Lease duration is configurable

### Retry Policy
- Exponential backoff with jitter
- Configurable max retries and delays
- Handles transient network failures gracefully

### Authentication
- Uses `DefaultAzureCredential` for managed identity
- No secrets in code or configuration
- Works seamlessly in Azure environments (App Service, Functions, VMs, etc.)

## Dependencies

- `azure-storage-blob` 12.25.1 - Azure Blob Storage SDK
- `azure-identity` 1.11.2 - Azure authentication
- `slf4j-api` & `slf4j-simple` 2.0.9 - Logging

## License

This is a demo/utility project. Adapt as needed for your use case.
