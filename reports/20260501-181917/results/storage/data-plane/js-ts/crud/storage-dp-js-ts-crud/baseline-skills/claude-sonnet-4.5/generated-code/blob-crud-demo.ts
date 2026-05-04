import { BlobServiceClient, RestError } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";

/**
 * Helper function to convert a readable stream to text
 */
async function streamToText(
  readable: NodeJS.ReadableStream | ReadableStream<Uint8Array>
): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of readable as any) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf-8");
}

/**
 * Performs CRUD operations on Azure Blob Storage
 */
async function blobStorageCrudDemo(): Promise<void> {
  try {
    // 1. Create BlobServiceClient using DefaultAzureCredential
    console.log("1. Creating BlobServiceClient...");
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    if (!accountName) {
      throw new Error("AZURE_STORAGE_ACCOUNT_NAME environment variable is required");
    }

    const credential = new DefaultAzureCredential();
    const blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      credential
    );
    console.log("✓ BlobServiceClient created successfully\n");

    // 2. Create container named "my-container" if it doesn't exist
    console.log("2. Creating container 'my-container'...");
    const containerClient = blobServiceClient.getContainerClient("my-container");
    
    try {
      const createResponse = await containerClient.createIfNotExists();
      if (createResponse.succeeded) {
        console.log("✓ Container created successfully");
      } else {
        console.log("✓ Container already exists");
      }
    } catch (error) {
      if (error instanceof RestError && error.statusCode === 409) {
        console.log("✓ Container already exists");
      } else {
        throw error;
      }
    }
    console.log();

    // 3. Upload string "Hello Azure!" as a block blob named "greeting.txt"
    console.log("3. Uploading blob 'greeting.txt'...");
    const blobName = "greeting.txt";
    const content = "Hello Azure!";
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    await blockBlobClient.upload(content, content.length, {
      blobHTTPHeaders: {
        blobContentType: "text/plain",
      },
    });
    console.log(`✓ Uploaded blob '${blobName}' with content: "${content}"\n`);

    // 4. List all blobs in the container and log their names
    console.log("4. Listing all blobs in container...");
    let blobCount = 0;
    for await (const blob of containerClient.listBlobsFlat()) {
      console.log(`   - ${blob.name} (${blob.properties.contentLength} bytes)`);
      blobCount++;
    }
    console.log(`✓ Found ${blobCount} blob(s)\n`);

    // 5. Download the blob and print its content as a string
    console.log("5. Downloading blob 'greeting.txt'...");
    const blobClient = containerClient.getBlobClient(blobName);
    const downloadResponse = await blobClient.download();
    
    if (!downloadResponse.readableStreamBody) {
      throw new Error("Failed to get readable stream from download response");
    }
    
    const downloadedContent = await streamToText(downloadResponse.readableStreamBody);
    console.log(`✓ Downloaded content: "${downloadedContent}"\n`);

    // 6. Delete the blob and then delete the container
    console.log("6. Cleaning up resources...");
    
    // Delete blob
    console.log(`   Deleting blob '${blobName}'...`);
    await blobClient.delete();
    console.log(`   ✓ Blob '${blobName}' deleted`);
    
    // Delete container
    console.log("   Deleting container 'my-container'...");
    await containerClient.delete();
    console.log("   ✓ Container 'my-container' deleted\n");

    console.log("🎉 All CRUD operations completed successfully!");

  } catch (error) {
    if (error instanceof RestError) {
      console.error(`\n❌ Azure Storage Error (${error.statusCode}): ${error.message}`);
      
      switch (error.statusCode) {
        case 403:
          console.error("   → Check your authentication credentials and permissions");
          break;
        case 404:
          console.error("   → Resource not found");
          break;
        case 409:
          console.error("   → Resource conflict (may already exist)");
          break;
        default:
          console.error(`   → Details: ${error.details?.message || "No additional details"}`);
      }
    } else if (error instanceof Error) {
      console.error(`\n❌ Error: ${error.message}`);
    } else {
      console.error(`\n❌ Unknown error:`, error);
    }
    
    process.exit(1);
  }
}

// Run the demo
blobStorageCrudDemo();
