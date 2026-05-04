import { BlobServiceClient, ContainerClient, BlockBlobClient, RestError } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";

/**
 * Performs CRUD operations on Azure Blob Storage
 */
async function performBlobOperations(): Promise<void> {
  const containerName = "my-container";
  const blobName = "greeting.txt";
  const blobContent = "Hello Azure!";

  try {
    // 1. Create a BlobServiceClient using DefaultAzureCredential
    console.log("Creating BlobServiceClient with DefaultAzureCredential...");
    const credential = new DefaultAzureCredential();
    
    // You need to provide your storage account name
    const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    if (!storageAccountName) {
      throw new Error("AZURE_STORAGE_ACCOUNT_NAME environment variable is required");
    }
    
    const blobServiceClient = new BlobServiceClient(
      `https://${storageAccountName}.blob.core.windows.net`,
      credential
    );
    console.log("✓ BlobServiceClient created successfully");

    // 2. Create a container if it doesn't exist
    console.log(`\nCreating container "${containerName}"...`);
    const containerClient: ContainerClient = blobServiceClient.getContainerClient(containerName);
    const createContainerResponse = await containerClient.createIfNotExists();
    
    if (createContainerResponse.succeeded) {
      console.log(`✓ Container "${containerName}" created successfully`);
    } else {
      console.log(`✓ Container "${containerName}" already exists`);
    }

    // 3. Upload a string as a block blob
    console.log(`\nUploading blob "${blobName}"...`);
    const blockBlobClient: BlockBlobClient = containerClient.getBlockBlobClient(blobName);
    const uploadResponse = await blockBlobClient.upload(blobContent, blobContent.length);
    console.log(`✓ Blob uploaded successfully. Request ID: ${uploadResponse.requestId}`);

    // 4. List all blobs in the container
    console.log("\nListing all blobs in the container:");
    const listBlobsResponse = containerClient.listBlobsFlat();
    
    let blobCount = 0;
    for await (const blob of listBlobsResponse) {
      blobCount++;
      console.log(`  - ${blob.name} (Size: ${blob.properties.contentLength} bytes)`);
    }
    console.log(`✓ Found ${blobCount} blob(s) in the container`);

    // 5. Download the blob and print its content
    console.log(`\nDownloading blob "${blobName}"...`);
    const downloadResponse = await blockBlobClient.download(0);
    
    if (!downloadResponse.readableStreamBody) {
      throw new Error("Failed to get readable stream from blob");
    }
    
    const downloadedContent = await streamToString(downloadResponse.readableStreamBody);
    console.log(`✓ Blob downloaded successfully`);
    console.log(`  Content: "${downloadedContent}"`);

    // 6. Delete the blob
    console.log(`\nDeleting blob "${blobName}"...`);
    await blockBlobClient.delete();
    console.log(`✓ Blob deleted successfully`);

    // Delete the container
    console.log(`\nDeleting container "${containerName}"...`);
    await containerClient.delete();
    console.log(`✓ Container deleted successfully`);

    console.log("\n✅ All operations completed successfully!");

  } catch (error) {
    // Handle RestError from Azure SDK
    if (error instanceof RestError) {
      console.error("\n❌ Azure Storage REST Error:");
      console.error(`  Status Code: ${error.statusCode}`);
      console.error(`  Error Code: ${error.code}`);
      console.error(`  Message: ${error.message}`);
      
      if (error.details) {
        console.error(`  Details: ${JSON.stringify(error.details, null, 2)}`);
      }
    } else if (error instanceof Error) {
      console.error("\n❌ Error:", error.message);
      console.error(error.stack);
    } else {
      console.error("\n❌ Unknown error:", error);
    }
    
    process.exit(1);
  }
}

/**
 * Helper function to convert a ReadableStream to a string
 */
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

// Run the program
performBlobOperations();
