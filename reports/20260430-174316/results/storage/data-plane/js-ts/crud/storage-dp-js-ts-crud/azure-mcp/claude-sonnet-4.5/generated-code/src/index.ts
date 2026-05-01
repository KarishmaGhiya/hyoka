import { BlobServiceClient, ContainerClient, RestError } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";

const STORAGE_ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT_NAME || "your-storage-account-name";
const CONTAINER_NAME = "my-container";
const BLOB_NAME = "greeting.txt";
const CONTENT = "Hello Azure!";

async function runBlobCrudOperations(): Promise<void> {
  let blobServiceClient: BlobServiceClient;
  let containerClient: ContainerClient;

  try {
    console.log("=== Azure Blob Storage CRUD Operations Demo ===\n");

    // Step 1: Create BlobServiceClient using DefaultAzureCredential
    console.log("1. Creating BlobServiceClient with DefaultAzureCredential...");
    const credential = new DefaultAzureCredential();
    const accountUrl = `https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net`;
    blobServiceClient = new BlobServiceClient(accountUrl, credential);
    console.log(`✓ Connected to storage account: ${STORAGE_ACCOUNT_NAME}\n`);

    // Step 2: Create container if it doesn't exist
    console.log(`2. Creating container "${CONTAINER_NAME}" if it doesn't exist...`);
    containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    
    const createResponse = await containerClient.createIfNotExists();
    if (createResponse.succeeded) {
      console.log(`✓ Container "${CONTAINER_NAME}" created successfully`);
    } else {
      console.log(`✓ Container "${CONTAINER_NAME}" already exists`);
    }
    console.log();

    // Step 3: Upload a block blob
    console.log(`3. Uploading blob "${BLOB_NAME}" with content: "${CONTENT}"...`);
    const blockBlobClient = containerClient.getBlockBlobClient(BLOB_NAME);
    const uploadResponse = await blockBlobClient.upload(CONTENT, CONTENT.length);
    console.log(`✓ Blob uploaded successfully`);
    console.log(`   Request ID: ${uploadResponse.requestId}`);
    console.log(`   ETag: ${uploadResponse.etag}\n`);

    // Step 4: List all blobs in the container
    console.log("4. Listing all blobs in the container...");
    let blobCount = 0;
    for await (const blob of containerClient.listBlobsFlat()) {
      blobCount++;
      console.log(`   - ${blob.name} (${blob.properties.contentLength} bytes)`);
    }
    console.log(`✓ Found ${blobCount} blob(s) in container\n`);

    // Step 5: Download the blob and print its content
    console.log(`5. Downloading blob "${BLOB_NAME}"...`);
    const downloadResponse = await blockBlobClient.download(0);
    
    if (!downloadResponse.readableStreamBody) {
      throw new Error("Failed to get readable stream from blob");
    }

    const downloadedContent = await streamToString(downloadResponse.readableStreamBody);
    console.log(`✓ Blob downloaded successfully`);
    console.log(`   Content: "${downloadedContent}"\n`);

    // Step 6: Delete the blob
    console.log(`6. Deleting blob "${BLOB_NAME}"...`);
    const deleteResponse = await blockBlobClient.delete();
    console.log(`✓ Blob deleted successfully`);
    console.log(`   Request ID: ${deleteResponse.requestId}\n`);

    // Step 7: Delete the container
    console.log(`7. Deleting container "${CONTAINER_NAME}"...`);
    const deleteContainerResponse = await containerClient.delete();
    console.log(`✓ Container deleted successfully`);
    console.log(`   Request ID: ${deleteContainerResponse.requestId}\n`);

    console.log("=== All operations completed successfully! ===");

  } catch (error) {
    console.error("\n❌ Error occurred during blob operations:");
    
    if (error instanceof RestError) {
      console.error(`   Status Code: ${error.statusCode}`);
      console.error(`   Error Code: ${error.code}`);
      console.error(`   Message: ${error.message}`);
      
      if (error.details) {
        console.error(`   Details: ${JSON.stringify(error.details, null, 2)}`);
      }
    } else if (error instanceof Error) {
      console.error(`   Message: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    } else {
      console.error(`   Unknown error: ${error}`);
    }
    
    process.exit(1);
  }
}

async function streamToString(readableStream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on("data", (data: Buffer) => {
      chunks.push(data);
    });
    readableStream.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf-8"));
    });
    readableStream.on("error", reject);
  });
}

// Run the demo
runBlobCrudOperations().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
