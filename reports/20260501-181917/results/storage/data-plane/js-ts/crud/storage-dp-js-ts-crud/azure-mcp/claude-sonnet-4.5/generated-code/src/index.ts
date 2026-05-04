import { BlobServiceClient, RestError } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";

async function performBlobCrudOperations(): Promise<void> {
  const containerName = "my-container";
  const blobName = "greeting.txt";
  const blobContent = "Hello Azure!";

  try {
    // Step 1: Create a BlobServiceClient using DefaultAzureCredential
    console.log("Step 1: Creating BlobServiceClient with DefaultAzureCredential...");
    
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    if (!accountName) {
      throw new Error("AZURE_STORAGE_ACCOUNT_NAME environment variable is required");
    }

    const blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      new DefaultAzureCredential()
    );
    console.log("✓ BlobServiceClient created successfully\n");

    // Step 2: Create a container if it doesn't exist
    console.log(`Step 2: Creating container '${containerName}' if it doesn't exist...`);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    const createContainerResponse = await containerClient.createIfNotExists({
      access: "container"
    });
    
    if (createContainerResponse.succeeded) {
      console.log(`✓ Container '${containerName}' created successfully`);
    } else {
      console.log(`✓ Container '${containerName}' already exists`);
    }
    console.log();

    // Step 3: Upload a string as a block blob
    console.log(`Step 3: Uploading blob '${blobName}'...`);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    const uploadResponse = await blockBlobClient.upload(
      blobContent,
      Buffer.byteLength(blobContent)
    );
    console.log(`✓ Blob uploaded successfully`);
    console.log(`  Request ID: ${uploadResponse.requestId}`);
    console.log(`  ETag: ${uploadResponse.etag}\n`);

    // Step 4: List all blobs in the container
    console.log(`Step 4: Listing all blobs in container '${containerName}'...`);
    const blobsList = containerClient.listBlobsFlat();
    
    console.log("Blobs in container:");
    for await (const blob of blobsList) {
      console.log(`  - ${blob.name} (${blob.properties.contentLength} bytes)`);
    }
    console.log();

    // Step 5: Download the blob and print its content
    console.log(`Step 5: Downloading blob '${blobName}'...`);
    const downloadResponse = await blockBlobClient.download(0);
    
    if (downloadResponse.readableStreamBody) {
      const downloaded = await streamToString(downloadResponse.readableStreamBody);
      console.log(`✓ Blob downloaded successfully`);
      console.log(`  Content: "${downloaded}"\n`);
    } else {
      throw new Error("Failed to download blob content");
    }

    // Step 6: Delete the blob and container
    console.log(`Step 6a: Deleting blob '${blobName}'...`);
    await blockBlobClient.delete();
    console.log(`✓ Blob '${blobName}' deleted successfully\n`);

    console.log(`Step 6b: Deleting container '${containerName}'...`);
    await containerClient.delete();
    console.log(`✓ Container '${containerName}' deleted successfully\n`);

    console.log("🎉 All CRUD operations completed successfully!");

  } catch (error) {
    if (error instanceof RestError) {
      console.error("\n❌ Azure Storage REST Error:");
      console.error(`  Status Code: ${error.statusCode}`);
      console.error(`  Error Code: ${error.code}`);
      console.error(`  Message: ${error.message}`);
      console.error(`  Request ID: ${error.details?.requestId || "N/A"}`);
    } else if (error instanceof Error) {
      console.error("\n❌ Error:", error.message);
    } else {
      console.error("\n❌ Unknown error:", error);
    }
    process.exit(1);
  }
}

async function streamToString(
  readableStream: NodeJS.ReadableStream
): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    readableStream.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf-8"));
    });
    readableStream.on("error", reject);
  });
}

// Run the program
performBlobCrudOperations();
