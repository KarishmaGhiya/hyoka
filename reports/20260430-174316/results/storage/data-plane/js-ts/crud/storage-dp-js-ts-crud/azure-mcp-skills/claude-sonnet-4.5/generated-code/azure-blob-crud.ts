import { BlobServiceClient, RestError } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";

async function main() {
  const containerName = "my-container";
  const blobName = "greeting.txt";
  const blobContent = "Hello Azure!";

  try {
    // 1. Create a BlobServiceClient using DefaultAzureCredential
    console.log("Creating BlobServiceClient...");
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
    console.log("✓ BlobServiceClient created successfully\n");

    // 2. Create a container if it doesn't exist
    console.log(`Creating container "${containerName}"...`);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    try {
      const createContainerResponse = await containerClient.createIfNotExists();
      if (createContainerResponse.succeeded) {
        console.log("✓ Container created successfully");
      } else {
        console.log("✓ Container already exists");
      }
    } catch (error) {
      if (error instanceof RestError) {
        console.error(`Failed to create container: ${error.message}`);
        throw error;
      }
      throw error;
    }
    console.log();

    // 3. Upload a string as a block blob
    console.log(`Uploading blob "${blobName}"...`);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    try {
      const uploadResponse = await blockBlobClient.upload(
        blobContent,
        Buffer.byteLength(blobContent)
      );
      console.log(`✓ Blob uploaded successfully. Request ID: ${uploadResponse.requestId}`);
    } catch (error) {
      if (error instanceof RestError) {
        console.error(`Failed to upload blob: ${error.message}`);
        console.error(`Status code: ${error.statusCode}`);
        throw error;
      }
      throw error;
    }
    console.log();

    // 4. List all blobs in the container
    console.log(`Listing blobs in container "${containerName}"...`);
    try {
      const blobs = containerClient.listBlobsFlat();
      let blobCount = 0;
      
      for await (const blob of blobs) {
        console.log(`  - ${blob.name}`);
        blobCount++;
      }
      
      console.log(`✓ Found ${blobCount} blob(s)`);
    } catch (error) {
      if (error instanceof RestError) {
        console.error(`Failed to list blobs: ${error.message}`);
        throw error;
      }
      throw error;
    }
    console.log();

    // 5. Download the blob and print its content
    console.log(`Downloading blob "${blobName}"...`);
    try {
      const downloadResponse = await blockBlobClient.download(0);
      
      if (!downloadResponse.readableStreamBody) {
        throw new Error("No readable stream body in download response");
      }
      
      const downloaded = await streamToString(downloadResponse.readableStreamBody);
      console.log(`✓ Blob downloaded successfully`);
      console.log(`Content: "${downloaded}"`);
    } catch (error) {
      if (error instanceof RestError) {
        console.error(`Failed to download blob: ${error.message}`);
        console.error(`Status code: ${error.statusCode}`);
        throw error;
      }
      throw error;
    }
    console.log();

    // 6. Delete the blob
    console.log(`Deleting blob "${blobName}"...`);
    try {
      const deleteResponse = await blockBlobClient.delete();
      console.log(`✓ Blob deleted successfully. Request ID: ${deleteResponse.requestId}`);
    } catch (error) {
      if (error instanceof RestError) {
        console.error(`Failed to delete blob: ${error.message}`);
        if (error.statusCode === 404) {
          console.log("Blob not found, continuing...");
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }
    console.log();

    // Delete the container
    console.log(`Deleting container "${containerName}"...`);
    try {
      const deleteContainerResponse = await containerClient.delete();
      console.log(`✓ Container deleted successfully. Request ID: ${deleteContainerResponse.requestId}`);
    } catch (error) {
      if (error instanceof RestError) {
        console.error(`Failed to delete container: ${error.message}`);
        if (error.statusCode === 404) {
          console.log("Container not found, continuing...");
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }
    console.log();

    console.log("✅ All operations completed successfully!");

  } catch (error) {
    if (error instanceof RestError) {
      console.error("\n❌ Azure Storage operation failed:");
      console.error(`Error: ${error.message}`);
      console.error(`Code: ${error.code}`);
      console.error(`Status: ${error.statusCode}`);
      if (error.details) {
        console.error(`Details: ${JSON.stringify(error.details, null, 2)}`);
      }
    } else if (error instanceof Error) {
      console.error("\n❌ Operation failed:");
      console.error(error.message);
    } else {
      console.error("\n❌ Unknown error occurred:", error);
    }
    process.exit(1);
  }
}

// Helper function to convert a readable stream to a string
async function streamToString(readableStream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on("data", (data: Buffer) => {
      chunks.push(data);
    });
    readableStream.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
    readableStream.on("error", reject);
  });
}

// Run the program
main();
