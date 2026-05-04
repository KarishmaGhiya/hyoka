import { BlobServiceClient, RestError } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";

async function performBlobOperations(): Promise<void> {
  const containerName = "my-container";
  const blobName = "greeting.txt";
  const blobContent = "Hello Azure!";

  try {
    // 1. Create a BlobServiceClient using DefaultAzureCredential
    console.log("Creating BlobServiceClient with DefaultAzureCredential...");
    const credential = new DefaultAzureCredential();
    
    // Replace with your storage account name
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    if (!accountName) {
      throw new Error("AZURE_STORAGE_ACCOUNT_NAME environment variable is required");
    }
    
    const blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      credential
    );
    console.log("✓ BlobServiceClient created successfully");

    // 2. Create a container named "my-container" if it doesn't exist
    console.log(`\nCreating container "${containerName}"...`);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    try {
      const createContainerResponse = await containerClient.createIfNotExists();
      if (createContainerResponse.succeeded) {
        console.log(`✓ Container "${containerName}" created successfully`);
      } else {
        console.log(`✓ Container "${containerName}" already exists`);
      }
    } catch (error) {
      if (error instanceof RestError) {
        console.error(`Error creating container: ${error.message}`);
        console.error(`Status code: ${error.statusCode}`);
        throw error;
      }
      throw error;
    }

    // 3. Upload a string "Hello Azure!" as a block blob named "greeting.txt"
    console.log(`\nUploading blob "${blobName}"...`);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    try {
      const uploadResponse = await blockBlobClient.upload(
        blobContent,
        Buffer.byteLength(blobContent)
      );
      console.log(`✓ Blob "${blobName}" uploaded successfully`);
      console.log(`  Request ID: ${uploadResponse.requestId}`);
      console.log(`  ETag: ${uploadResponse.etag}`);
    } catch (error) {
      if (error instanceof RestError) {
        console.error(`Error uploading blob: ${error.message}`);
        console.error(`Status code: ${error.statusCode}`);
        throw error;
      }
      throw error;
    }

    // 4. List all blobs in the container and log their names
    console.log(`\nListing all blobs in container "${containerName}"...`);
    try {
      let blobCount = 0;
      for await (const blob of containerClient.listBlobsFlat()) {
        blobCount++;
        console.log(`  - ${blob.name}`);
        console.log(`    Size: ${blob.properties.contentLength} bytes`);
        console.log(`    Last modified: ${blob.properties.lastModified}`);
      }
      console.log(`✓ Found ${blobCount} blob(s) in container`);
    } catch (error) {
      if (error instanceof RestError) {
        console.error(`Error listing blobs: ${error.message}`);
        console.error(`Status code: ${error.statusCode}`);
        throw error;
      }
      throw error;
    }

    // 5. Download the blob and print its content as a string
    console.log(`\nDownloading blob "${blobName}"...`);
    try {
      const downloadResponse = await blockBlobClient.download(0);
      const downloadedContent = await streamToString(
        downloadResponse.readableStreamBody!
      );
      console.log(`✓ Blob downloaded successfully`);
      console.log(`  Content: "${downloadedContent}"`);
    } catch (error) {
      if (error instanceof RestError) {
        console.error(`Error downloading blob: ${error.message}`);
        console.error(`Status code: ${error.statusCode}`);
        throw error;
      }
      throw error;
    }

    // 6. Delete the blob and then delete the container
    console.log(`\nDeleting blob "${blobName}"...`);
    try {
      await blockBlobClient.delete();
      console.log(`✓ Blob "${blobName}" deleted successfully`);
    } catch (error) {
      if (error instanceof RestError) {
        console.error(`Error deleting blob: ${error.message}`);
        console.error(`Status code: ${error.statusCode}`);
        throw error;
      }
      throw error;
    }

    console.log(`\nDeleting container "${containerName}"...`);
    try {
      await containerClient.delete();
      console.log(`✓ Container "${containerName}" deleted successfully`);
    } catch (error) {
      if (error instanceof RestError) {
        console.error(`Error deleting container: ${error.message}`);
        console.error(`Status code: ${error.statusCode}`);
        throw error;
      }
      throw error;
    }

    console.log("\n✓ All operations completed successfully!");
  } catch (error) {
    if (error instanceof RestError) {
      console.error("\n❌ Azure Storage operation failed:");
      console.error(`  Message: ${error.message}`);
      console.error(`  Status Code: ${error.statusCode}`);
      console.error(`  Error Code: ${error.code}`);
      if (error.details) {
        console.error(`  Details: ${JSON.stringify(error.details, null, 2)}`);
      }
    } else if (error instanceof Error) {
      console.error("\n❌ Operation failed:");
      console.error(`  ${error.message}`);
    } else {
      console.error("\n❌ Unknown error occurred:", error);
    }
    process.exit(1);
  }
}

// Helper function to convert a readable stream to a string
async function streamToString(
  readableStream: NodeJS.ReadableStream
): Promise<string> {
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
