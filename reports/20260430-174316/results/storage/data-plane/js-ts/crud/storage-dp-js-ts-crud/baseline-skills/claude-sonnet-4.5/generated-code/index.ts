import { BlobServiceClient, RestError } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";

const CONTAINER_NAME = "my-container";
const BLOB_NAME = "greeting.txt";
const BLOB_CONTENT = "Hello Azure!";

async function main(): Promise<void> {
  try {
    // Step 1: Create BlobServiceClient using DefaultAzureCredential
    console.log("1. Creating BlobServiceClient with DefaultAzureCredential...");
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    
    if (!accountName) {
      throw new Error("AZURE_STORAGE_ACCOUNT_NAME environment variable is required");
    }
    
    const blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      new DefaultAzureCredential()
    );
    console.log("   ✓ BlobServiceClient created successfully\n");

    // Step 2: Create container if it doesn't exist
    console.log(`2. Creating container '${CONTAINER_NAME}' if it doesn't exist...`);
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    
    try {
      const createContainerResponse = await containerClient.createIfNotExists();
      if (createContainerResponse.succeeded) {
        console.log(`   ✓ Container '${CONTAINER_NAME}' created successfully`);
      } else {
        console.log(`   ✓ Container '${CONTAINER_NAME}' already exists`);
      }
    } catch (error) {
      if (error instanceof RestError) {
        console.error(`   ✗ RestError creating container: ${error.message}`);
        console.error(`   Error code: ${error.code}`);
        throw error;
      }
      throw error;
    }
    console.log();

    // Step 3: Upload a string as a block blob
    console.log(`3. Uploading '${BLOB_CONTENT}' to blob '${BLOB_NAME}'...`);
    const blockBlobClient = containerClient.getBlockBlobClient(BLOB_NAME);
    
    try {
      const uploadResponse = await blockBlobClient.upload(
        BLOB_CONTENT,
        BLOB_CONTENT.length
      );
      console.log(`   ✓ Blob uploaded successfully`);
      console.log(`   Request ID: ${uploadResponse.requestId}`);
      console.log(`   ETag: ${uploadResponse.etag}`);
    } catch (error) {
      if (error instanceof RestError) {
        console.error(`   ✗ RestError uploading blob: ${error.message}`);
        console.error(`   Error code: ${error.code}`);
        console.error(`   Status code: ${error.statusCode}`);
        throw error;
      }
      throw error;
    }
    console.log();

    // Step 4: List all blobs in the container
    console.log(`4. Listing all blobs in container '${CONTAINER_NAME}'...`);
    try {
      let blobCount = 0;
      for await (const blob of containerClient.listBlobsFlat()) {
        blobCount++;
        console.log(`   - ${blob.name}`);
        console.log(`     Size: ${blob.properties.contentLength} bytes`);
        console.log(`     Last Modified: ${blob.properties.lastModified}`);
      }
      console.log(`   ✓ Found ${blobCount} blob(s)`);
    } catch (error) {
      if (error instanceof RestError) {
        console.error(`   ✗ RestError listing blobs: ${error.message}`);
        console.error(`   Error code: ${error.code}`);
        throw error;
      }
      throw error;
    }
    console.log();

    // Step 5: Download the blob and print its content
    console.log(`5. Downloading blob '${BLOB_NAME}'...`);
    try {
      const downloadResponse = await blockBlobClient.download(0);
      
      if (!downloadResponse.readableStreamBody) {
        throw new Error("No readable stream body in download response");
      }
      
      const downloadedContent = await streamToString(
        downloadResponse.readableStreamBody
      );
      console.log(`   ✓ Blob downloaded successfully`);
      console.log(`   Content: "${downloadedContent}"`);
      console.log(`   Content Type: ${downloadResponse.contentType}`);
      console.log(`   Content Length: ${downloadResponse.contentLength} bytes`);
    } catch (error) {
      if (error instanceof RestError) {
        console.error(`   ✗ RestError downloading blob: ${error.message}`);
        console.error(`   Error code: ${error.code}`);
        console.error(`   Status code: ${error.statusCode}`);
        throw error;
      }
      throw error;
    }
    console.log();

    // Step 6: Delete the blob
    console.log(`6. Deleting blob '${BLOB_NAME}'...`);
    try {
      const deleteResponse = await blockBlobClient.delete();
      console.log(`   ✓ Blob deleted successfully`);
      console.log(`   Request ID: ${deleteResponse.requestId}`);
    } catch (error) {
      if (error instanceof RestError) {
        console.error(`   ✗ RestError deleting blob: ${error.message}`);
        console.error(`   Error code: ${error.code}`);
        console.error(`   Status code: ${error.statusCode}`);
        throw error;
      }
      throw error;
    }
    console.log();

    // Step 7: Delete the container
    console.log(`7. Deleting container '${CONTAINER_NAME}'...`);
    try {
      const deleteContainerResponse = await containerClient.delete();
      console.log(`   ✓ Container deleted successfully`);
      console.log(`   Request ID: ${deleteContainerResponse.requestId}`);
    } catch (error) {
      if (error instanceof RestError) {
        console.error(`   ✗ RestError deleting container: ${error.message}`);
        console.error(`   Error code: ${error.code}`);
        console.error(`   Status code: ${error.statusCode}`);
        throw error;
      }
      throw error;
    }
    console.log();

    console.log("✓ All CRUD operations completed successfully!");
  } catch (error) {
    console.error("\n✗ An error occurred:");
    if (error instanceof RestError) {
      console.error(`  RestError: ${error.message}`);
      console.error(`  Error Code: ${error.code}`);
      console.error(`  Status Code: ${error.statusCode}`);
      console.error(`  Request ID: ${error.request?.requestId}`);
    } else if (error instanceof Error) {
      console.error(`  Error: ${error.message}`);
    } else {
      console.error(`  Unknown error: ${error}`);
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
main();
