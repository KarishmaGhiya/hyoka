import { BlobServiceClient, RestError } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";

/**
 * Helper function to convert a readable stream to text
 */
async function streamToText(readable: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf-8");
}

/**
 * Main function demonstrating CRUD operations on Azure Blob Storage
 */
async function main() {
  try {
    // 1. Create a BlobServiceClient using DefaultAzureCredential
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

    // 2. Create a container named "my-container" if it doesn't exist
    console.log("2. Creating container 'my-container'...");
    const containerClient = blobServiceClient.getContainerClient("my-container");
    
    const createContainerResponse = await containerClient.createIfNotExists();
    if (createContainerResponse.succeeded) {
      console.log("✓ Container created successfully");
    } else {
      console.log("✓ Container already exists");
    }
    console.log();

    // 3. Upload a string "Hello Azure!" as a block blob named "greeting.txt"
    console.log("3. Uploading blob 'greeting.txt'...");
    const blobName = "greeting.txt";
    const content = "Hello Azure!";
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    await blockBlobClient.upload(content, content.length, {
      blobHTTPHeaders: { blobContentType: "text/plain" }
    });
    console.log(`✓ Uploaded '${blobName}' successfully\n`);

    // 4. List all blobs in the container and log their names
    console.log("4. Listing all blobs in the container:");
    let blobCount = 0;
    for await (const blob of containerClient.listBlobsFlat()) {
      console.log(`  - ${blob.name} (${blob.properties.contentLength} bytes)`);
      blobCount++;
    }
    console.log(`✓ Found ${blobCount} blob(s)\n`);

    // 5. Download the blob and print its content as a string
    console.log("5. Downloading blob 'greeting.txt'...");
    const blobClient = containerClient.getBlobClient(blobName);
    const downloadResponse = await blobClient.download();
    
    if (!downloadResponse.readableStreamBody) {
      throw new Error("Failed to download blob: no readable stream");
    }

    const downloadedContent = await streamToText(downloadResponse.readableStreamBody);
    console.log(`✓ Downloaded content: "${downloadedContent}"\n`);

    // 6. Delete the blob and then delete the container
    console.log("6. Cleaning up resources...");
    
    // Delete the blob
    await blobClient.delete();
    console.log(`✓ Deleted blob '${blobName}'`);
    
    // Delete the container
    await containerClient.delete();
    console.log("✓ Deleted container 'my-container'\n");

    console.log("✅ All CRUD operations completed successfully!");

  } catch (error) {
    // Error handling with RestError
    if (error instanceof RestError) {
      console.error("\n❌ Azure Storage error occurred:");
      console.error(`   Status Code: ${error.statusCode}`);
      console.error(`   Error Code: ${error.code}`);
      console.error(`   Message: ${error.message}`);
      
      // Provide specific guidance based on error code
      switch (error.statusCode) {
        case 403:
          console.error("\n💡 Tip: Check that your credentials have the required permissions:");
          console.error("   - Storage Blob Data Contributor role or higher");
          break;
        case 404:
          console.error("\n💡 Tip: The resource was not found. Check the account name and container/blob names.");
          break;
        case 409:
          console.error("\n💡 Tip: Resource already exists or is being deleted.");
          break;
        default:
          console.error("\n💡 Tip: Check your Azure Storage account configuration and network connectivity.");
      }
    } else if (error instanceof Error) {
      console.error("\n❌ Error:", error.message);
    } else {
      console.error("\n❌ Unknown error:", error);
    }
    
    process.exit(1);
  }
}

// Run the main function
main();
