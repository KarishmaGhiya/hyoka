import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { createBlobServiceClient } from "./config";
import { BlobStorageService } from "./blobService";

const CONTAINER_NAME = "demo-container";
const BLOB_NAME = "sample/hello.txt";

async function main(): Promise<void> {
  // ── configure client ──────────────────────────────────────────────────
  console.log("⚙️  Initialising Azure Blob Storage client…");
  const serviceClient = createBlobServiceClient({
    maxRetries: 4,
    retryDelayMs: 500,
    maxRetryDelayMs: 5000,
    logLevel: "info",
  });
  const blobService = new BlobStorageService(serviceClient);

  // ── create a temporary sample file ────────────────────────────────────
  const tmpFile = path.join(os.tmpdir(), "blob-manager-sample.txt");
  fs.writeFileSync(tmpFile, "Hello from Azure Blob Manager! 🚀\n");

  try {
    // ── 1. upload with metadata & index tags ────────────────────────────
    console.log(`\n📤 Uploading "${BLOB_NAME}" to "${CONTAINER_NAME}"…`);
    const uploadResult = await blobService.uploadFile(
      CONTAINER_NAME,
      BLOB_NAME,
      tmpFile,
      {
        metadata: {
          createdBy: "blob-manager-demo",
          environment: "development",
        },
        tags: {
          project: "blob-manager",
          status: "active",
        },
      }
    );
    console.log(`   ✅ Uploaded → ${uploadResult.url}`);

    // ── 2. list blobs ───────────────────────────────────────────────────
    console.log(`\n📋 Listing blobs in "${CONTAINER_NAME}"…`);
    const blobs = await blobService.listBlobs(CONTAINER_NAME);
    for (const blob of blobs) {
      console.log(`   • ${blob.name} (${blob.properties.contentLength} bytes)`);
    }

    // ── 3. download & print ─────────────────────────────────────────────
    console.log(`\n📥 Downloading "${BLOB_NAME}"…`);
    const content = await blobService.downloadToBuffer(
      CONTAINER_NAME,
      BLOB_NAME
    );
    console.log(`   Content: ${content.toString("utf-8").trim()}`);

    // ── 4. lease-protected update ───────────────────────────────────────
    console.log(`\n🔒 Acquiring lease and updating "${BLOB_NAME}"…`);
    const updatedContent = "Updated under lease! 🔐\n";
    const updateResult = await blobService.updateWithLease(
      CONTAINER_NAME,
      BLOB_NAME,
      updatedContent,
      15 // 15-second lease
    );
    console.log(`   ✅ Updated under lease → ${updateResult.url}`);

    // Verify the update
    const after = await blobService.downloadToBuffer(
      CONTAINER_NAME,
      BLOB_NAME
    );
    console.log(`   Verified content: ${after.toString("utf-8").trim()}`);

    // ── 5. delete ───────────────────────────────────────────────────────
    console.log(`\n🗑️  Deleting "${BLOB_NAME}"…`);
    await blobService.deleteBlob(CONTAINER_NAME, BLOB_NAME);
    console.log("   ✅ Deleted.");

    console.log("\n🎉 Demo complete!");
  } finally {
    // Clean up the temp file.
    if (fs.existsSync(tmpFile)) {
      fs.unlinkSync(tmpFile);
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
