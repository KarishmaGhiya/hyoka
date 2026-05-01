import { BlobServiceClient, RestError } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";

async function performBlobOperations(): Promise<void> {
  try {
    // 1. Create a BlobServiceClient using DefaultAzureCredential
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    if (!accountName) {
      throw new Error("AZURE_STORAGE_ACCOUNT_NAME environment variable is required");
    }

    const blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      new DefaultAzureCredential()
    );
    console.log("✓ BlobServiceClient created successfully");

    // 2. Create a container named "my-container" if it doesn't exist
    const containerName = "my-container";
    const containerClient = blobServiceClient.getContainerClient(containerName);

    try {
      await containerClient.create();
      console.log(`✓ Container "${containerName}" created`);
    } catch (error) {
      if (error instanceof RestError && error.statusCode === 409) {
        console.log(`✓ Container "${containerName}" already exists`);
      } else {
        throw error;
      }
    }

    // 3. Upload a string "Hello Azure!" as a block blob named "greeting.txt"
    const blobName = "greeting.txt";
    const blobContent = "Hello Azure!";
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.upload(blobContent, blobContent.length);
    console.log(`✓ Blob "${blobName}" uploaded successfully`);

    // 4. List all blobs in the container and log their names
    console.log("\n📋 Listing all blobs in the container:");
    for await (const blob of containerClient.listBlobsFlat()) {
      console.log(`  - ${blob.name}`);
    }

    // 5. Download the blob and print its content as a string
    const downloadBlockBlobResponse = await blockBlobClient.download();
    const downloadedContent = await streamToString(
      downloadBlockBlobResponse.readableStreamBody!
    );
    console.log(`\n✓ Downloaded blob content: "${downloadedContent}"`);

    // 6. Delete the blob and then delete the container
    await blockBlobClient.delete();
    console.log(`✓ Blob "${blobName}" deleted`);

    await containerClient.delete();
    console.log(`✓ Container "${containerName}" deleted`);

    console.log("\n✅ All operations completed successfully!");
  } catch (error) {
    if (error instanceof RestError) {
      console.error(`❌ Azure Storage Error (${error.statusCode}): ${error.message}`);
      if (error.details) {
        console.error("Details:", error.details);
      }
    } else if (error instanceof Error) {
      console.error(`❌ Error: ${error.message}`);
    } else {
      console.error("❌ Unknown error occurred:", error);
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
    readableStream.on("data", (data) => {
      chunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data));
    });
    readableStream.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
    readableStream.on("error", reject);
  });
}

// Run the program
performBlobOperations();
