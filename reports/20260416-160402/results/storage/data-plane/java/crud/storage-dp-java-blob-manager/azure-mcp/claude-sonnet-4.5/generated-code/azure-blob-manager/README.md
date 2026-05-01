# Azure Blob Storage Manager

A reusable Java 17 Maven utility for managing Azure Blob Storage operations with both synchronous and asynchronous implementations.

## Features

- **Dual API**: Complete sync and async implementations using Azure SDK and Project Reactor
- **Efficient Large File Handling**: Streaming uploads with configurable block size (4MB) and parallel transfers
- **Concurrency Control**: Lease-based locking to prevent concurrent write conflicts
- **Metadata & Index Tags**: Support for blob metadata and searchable index tags
- **Secure Authentication**: Uses Azure Managed Identity (no connection strings or keys)
- **Resilient**: Configurable exponential backoff retry policy with timeouts
- **Observable**: HTTP request/response logging at configurable levels

## Requirements

- Java 17 or higher
- Maven 3.6+
- Azure Storage Account
- Azure Managed Identity configured (when running in Azure) or Azure CLI authenticated locally

## Project Structure

```
azure-blob-manager/
├── pom.xml
├── src/main/java/com/azure/storage/manager/
│   ├── BlobStorageConfig.java        # Configuration with retry and logging
│   ├── BlobStorageService.java       # Synchronous blob operations
│   ├── BlobStorageAsyncService.java  # Asynchronous blob operations
│   └── Main.java                     # Demo application
└── src/main/resources/
    └── logback.xml                   # Logging configuration
```

## Configuration

Set the storage account endpoint as an environment variable:

```bash
export AZURE_STORAGE_ENDPOINT="https://<your-account>.blob.core.windows.net/"
```

### Configuration Options

```java
BlobStorageConfig config = BlobStorageConfig.builder()
    .storageEndpointFromEnv("AZURE_STORAGE_ENDPOINT")
    .maxRetries(3)                              // Max retry attempts
    .retryDelay(Duration.ofSeconds(2))          // Initial retry delay
    .maxRetryDelay(Duration.ofSeconds(30))      // Max retry delay
    .requestTimeout(Duration.ofSeconds(120))    // Per-request timeout
    .logLevel(HttpLogDetailLevel.BASIC)         // HTTP logging level
    .build();
```

## Usage

### Synchronous API

```java
BlobStorageConfig config = BlobStorageConfig.builder()
    .storageEndpointFromEnv("AZURE_STORAGE_ENDPOINT")
    .build();

BlobStorageService service = new BlobStorageService(config, "my-container");

// Upload with metadata and tags
Map<String, String> metadata = Map.of("author", "user1");
Map<String, String> tags = Map.of("env", "prod");
String etag = service.upload("file.txt", Path.of("/path/to/file"), metadata, tags);

// Download
service.download("file.txt", Path.of("/path/to/destination"));

// List blobs
List<String> blobs = service.listBlobs();

// Upload with lease (prevents concurrent overwrites)
String etagWithLease = service.uploadWithLease("file.txt", filePath, 
    metadata, tags, Duration.ofSeconds(30));

// Delete
boolean deleted = service.delete("file.txt");
```

### Asynchronous API

```java
BlobStorageAsyncService asyncService = new BlobStorageAsyncService(config, "my-container");

// Upload asynchronously
asyncService.upload("file.txt", Path.of("/path/to/file"), metadata, tags)
    .subscribe(etag -> System.out.println("Uploaded: " + etag));

// Download asynchronously
asyncService.download("file.txt", Path.of("/path/to/destination"))
    .subscribe();

// List blobs asynchronously
asyncService.listBlobs()
    .subscribe(blobs -> blobs.forEach(System.out::println));

// Upload with lease asynchronously
asyncService.uploadWithLease("file.txt", filePath, metadata, tags, Duration.ofSeconds(30))
    .subscribe(etag -> System.out.println("Updated: " + etag));

// Delete asynchronously
asyncService.delete("file.txt")
    .subscribe(deleted -> System.out.println("Deleted: " + deleted));
```

## Building

```bash
cd azure-blob-manager
mvn clean package
```

This creates:
- `target/azure-blob-manager-1.0.0.jar` - Regular JAR
- `target/azure-blob-manager-1.0.0-shaded.jar` - Uber JAR with all dependencies

## Running the Demo

```bash
# Set storage endpoint
export AZURE_STORAGE_ENDPOINT="https://<your-account>.blob.core.windows.net/"

# Run the demo
mvn exec:java -Dexec.mainClass="com.azure.storage.manager.Main"

# Or with the uber JAR
java -jar target/azure-blob-manager-1.0.0-shaded.jar
```

The demo performs operations with both sync and async APIs:
1. Uploads a sample file with metadata and index tags
2. Lists blobs in the container
3. Downloads the blob
4. Acquires a lease and overwrites the blob
5. Deletes the blob

## Key Features Explained

### Efficient Large File Upload

Files are uploaded using streaming with 4MB blocks and 4 parallel transfers, preventing memory exhaustion:

```java
ParallelTransferOptions options = new ParallelTransferOptions()
    .setBlockSizeLong(4L * 1024 * 1024)  // 4MB blocks
    .setMaxConcurrency(4);               // 4 parallel uploads
```

### Concurrency Control with Leases

Leases provide exclusive write access, preventing race conditions:

```java
// Acquire 30-second lease
String leaseId = service.acquireLease("file.txt", Duration.ofSeconds(30));

// Upload with lease ensures no concurrent overwrites
service.uploadWithLease("file.txt", path, metadata, tags, Duration.ofSeconds(30));
```

### Managed Identity Authentication

Uses `DefaultAzureCredential` which automatically discovers credentials from:
1. Environment variables
2. Managed Identity (when running in Azure)
3. Azure CLI (for local development)
4. Visual Studio Code
5. IntelliJ IDEA

No secrets in code or configuration files.

## Dependencies

- `azure-storage-blob` (12.25.1): Azure Blob Storage SDK
- `azure-identity` (1.11.4): Azure authentication
- `logback-classic` (1.4.14): Logging implementation

## License

This is a demo project. Adapt as needed for your use case.
