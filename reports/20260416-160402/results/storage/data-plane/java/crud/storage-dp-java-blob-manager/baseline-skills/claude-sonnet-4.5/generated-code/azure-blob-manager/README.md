# Azure Blob Storage Manager

A reusable Java 17 Maven utility for managing Azure Blob Storage operations with both synchronous and asynchronous implementations.

## Features

### Service Classes
- **BlobStorageService** (Sync): Synchronous blob operations
- **BlobStorageServiceAsync** (Async): Asynchronous blob operations using Project Reactor

Both implementations support:
- **Upload**: Handles large files efficiently using streaming with 4MB blocks
- **Download**: Downloads blobs to memory or files
- **List**: Lists all blobs in a container
- **Delete**: Removes blobs from storage
- **Metadata & Tags**: Attaches custom metadata and blob index tags for querying
- **Lease Management**: Prevents concurrent writers using blob leases

### Configuration
- **Managed Identity**: Secure authentication using Azure Managed Identity (no keys/connection strings)
- **Custom Retry Policy**: Exponential backoff with configurable max retries and delays
- **Request Timeout**: Per-request timeout configuration
- **HTTP Logging**: Configurable logging levels for debugging

### Demo Application
The `Main` class demonstrates all operations using both sync and async implementations:
1. Upload blob with metadata and index tags
2. List blobs in container
3. Download blob
4. Acquire lease and safely overwrite blob
5. Release lease
6. Delete blob

## Prerequisites

- Java 17 or higher
- Maven 3.6+
- Azure Storage Account with Managed Identity enabled
- `AZURE_STORAGE_ENDPOINT` environment variable set to your storage endpoint (e.g., `https://youraccount.blob.core.windows.net`)

## Building

```bash
mvn clean install
```

## Running

Set the environment variable:
```bash
export AZURE_STORAGE_ENDPOINT=https://youraccount.blob.core.windows.net
```

Run the demo:
```bash
mvn exec:java -Dexec.mainClass="com.example.blob.Main"
```

Or run the compiled JAR:
```bash
java -jar target/azure-blob-manager-1.0.0.jar
```

## Usage Example

### Sync Operations
```java
BlobStorageConfiguration config = new BlobStorageConfiguration.Builder()
    .storageAccountEndpointFromEnv("AZURE_STORAGE_ENDPOINT")
    .maxRetries(3)
    .retryDelay(Duration.ofSeconds(2))
    .requestTimeout(Duration.ofSeconds(60))
    .logLevel(HttpLogDetailLevel.BASIC)
    .build();

BlobServiceClient client = config.createSyncClient();
BlobStorageService service = new BlobStorageService(client);

// Upload with tags
Map<String, String> tags = Map.of("env", "prod", "version", "1.0");
service.uploadBlobWithData("container", "file.txt", data, null, tags);

// List and download
List<String> blobs = service.listBlobs("container");
byte[] content = service.downloadBlob("container", "file.txt");
```

### Async Operations
```java
BlobServiceAsyncClient asyncClient = config.createAsyncClient();
BlobStorageServiceAsync asyncService = new BlobStorageServiceAsync(asyncClient);

asyncService.uploadBlobWithData("container", "file.txt", data, null, tags)
    .then(asyncService.listBlobs("container"))
    .flatMap(blobs -> asyncService.downloadBlob("container", "file.txt"))
    .subscribe(content -> System.out.println("Downloaded!"));
```

## Key Implementation Details

### Large File Handling
- Uses `BlobParallelUploadOptions` with 4MB blocks
- Streams data to avoid loading entire files into memory
- Supports parallel upload for better performance

### Concurrency Protection
- Uses blob leases to prevent concurrent modifications
- Upload methods support `BlobRequestConditions` with lease IDs
- Ensures data integrity in multi-writer scenarios

### Retry & Resilience
- Exponential backoff with configurable parameters
- Per-request timeouts prevent hanging operations
- HTTP logging for debugging transient failures

## Dependencies

- `azure-storage-blob`: 12.25.1
- `azure-identity`: 1.11.2
- `slf4j-api`: 2.0.9
- `slf4j-simple`: 2.0.9

## License

MIT
