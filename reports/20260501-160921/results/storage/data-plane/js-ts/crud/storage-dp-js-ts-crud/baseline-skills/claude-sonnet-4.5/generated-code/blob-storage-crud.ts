import { DefaultAzureCredential } from "@azure/identity";
import {
  BlobServiceClient,
  ContainerClient,
  BlockBlobClient,
  RestError,
} from "@azure/storage-blob";

/**
 * Azure Blob Storage CRUD Operations Demo
 * 
 * Prerequisites:
 * - Azure Storage Account
 * - Authentication configured (Azure CLI login, environment variables, or managed identity)
 * - Appropriate RBAC permissions (Storage Blob Data Contributor)
 */

async function main(): Promise<void> {
  // Configuration
  const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  if (!storageAccountName) {
    throw new Error("AZURE_STORAGE_ACCOUNT_NAME environment variable is required");
  }

  const accountUrl = `https://${storageAccountName}.blob.core.windows.net`;
  const containerName = "my-container";
  const blobName = "greeting.txt";
  const blobContent = "Hello Azure!";

  try {
    // 1. Create BlobServiceClient using DefaultAzureCredential
    console.log("1. Creating BlobServiceClient...");
    const credential = new DefaultAzureCredential();
    const blobServiceClient = new BlobServiceClient(accountUrl, credential);
    console.log(`   ✓ Connected to: ${accountUrl}\n`);

    // 2. Create a container if it doesn't exist
    console.log("2. Creating container...");
    const containerClient: ContainerClient = blobServiceClient.getContainerClient(containerName);
    
    const createContainerResponse = await containerClient.createIfNotExists({
      access: "private",
    });

    if (createContainerResponse.succeeded) {
      console.log(`   ✓ Container "${containerName}" created`);
    } else {
      console.log(`   ℹ Container "${containerName}" already exists`);
    }
    console.log();

    // 3. Upload a block blob
    console.log("3. Uploading blob...");
    const blockBlobClient: BlockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    const uploadResponse = await blockBlobClient.upload(
      blobContent,
      Buffer.byteLength(blobContent),
      {
        blobHTTPHeaders: {
          blobContentType: "text/plain",
        },
      }
    );

    console.log(`   ✓ Uploaded "${blobName}"`);
    console.log(`   ℹ ETag: ${uploadResponse.etag}`);
    console.log(`   ℹ Request ID: ${uploadResponse.requestId}\n`);

    // 4. List all blobs in the container
    console.log("4. Listing blobs in container...");
    let blobCount = 0;
    
    for await (const blob of containerClient.listBlobsFlat()) {
      blobCount++;
      console.log(`   • ${blob.name}`);
      console.log(`     - Size: ${blob.properties.contentLength} bytes`);
      console.log(`     - Content Type: ${blob.properties.contentType}`);
      console.log(`     - Last Modified: ${blob.properties.lastModified}`);
    }
    
    console.log(`   ✓ Total blobs: ${blobCount}\n`);

    // 5. Download the blob and print its content
    console.log("5. Downloading blob...");
    const downloadResponse = await blockBlobClient.download(0);
    
    if (!downloadResponse.readableStreamBody) {
      throw new Error("No readable stream available");
    }

    const downloadedContent = await streamToString(downloadResponse.readableStreamBody);
    console.log(`   ✓ Downloaded "${blobName}"`);
    console.log(`   ℹ Content: "${downloadedContent}"\n`);

    // 6. Delete the blob
    console.log("6. Deleting blob...");
    const deleteResponse = await blockBlobClient.delete({
      deleteSnapshots: "include",
    });
    
    console.log(`   ✓ Deleted blob "${blobName}"`);
    console.log(`   ℹ Request ID: ${deleteResponse.requestId}\n`);

    // 7. Delete the container
    console.log("7. Deleting container...");
    const deleteContainerResponse = await containerClient.delete();
    
    console.log(`   ✓ Deleted container "${containerName}"`);
    console.log(`   ℹ Request ID: ${deleteContainerResponse.requestId}\n`);

    console.log("✅ All operations completed successfully!");

  } catch (error) {
    handleError(error);
    process.exit(1);
  }
}

/**
 * Convert a readable stream to a string
 */
async function streamToString(readableStream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on("data", (data) => {
      chunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data));
    });
    readableStream.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf-8"));
    });
    readableStream.on("error", reject);
  });
}

/**
 * Handle errors with proper RestError checking
 */
function handleError(error: unknown): void {
  console.error("\n❌ Error occurred:");

  if (error instanceof RestError) {
    // Azure Storage specific error
    console.error(`   Code: ${error.code}`);
    console.error(`   Status: ${error.statusCode}`);
    console.error(`   Message: ${error.message}`);
    
    if (error.details) {
      console.error(`   Details: ${JSON.stringify(error.details, null, 2)}`);
    }

    // Common error codes and suggestions
    switch (error.code) {
      case "AuthenticationFailed":
        console.error("\n   💡 Suggestion: Check your authentication credentials");
        console.error("      - Run 'az login' if using Azure CLI");
        console.error("      - Verify environment variables if using service principal");
        break;
      case "AuthorizationPermissionMismatch":
        console.error("\n   💡 Suggestion: Ensure you have the required RBAC role");
        console.error("      - Role needed: Storage Blob Data Contributor");
        break;
      case "ContainerNotFound":
        console.error("\n   💡 Suggestion: The container does not exist");
        break;
      case "BlobNotFound":
        console.error("\n   💡 Suggestion: The blob does not exist");
        break;
      case "AccountNotFound":
        console.error("\n   💡 Suggestion: Check the storage account name");
        break;
      default:
        console.error(`\n   💡 See: https://learn.microsoft.com/rest/api/storageservices/blob-service-error-codes`);
    }
  } else if (error instanceof Error) {
    // Generic error
    console.error(`   Message: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
  } else {
    // Unknown error type
    console.error(`   ${String(error)}`);
  }
}

// Execute the main function
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
