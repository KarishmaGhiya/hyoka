import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { loadConfigFromEnv, createBlobServiceClient } from "./config";
import { BlobStorageService } from "./blobService";

const CONTAINER_NAME = "demo-container";
const BLOB_NAME = "samples/hello.txt";

async function main(): Promise<void> {
  // ── Configuration ──────────────────────────────────────────────
  console.log("🔧 Loading configuration from environment...");
  const config = loadConfigFromEnv();
  const serviceClient = createBlobServiceClient(config);
  const blobService = new BlobStorageService(serviceClient);
  console.log(`   Storage account: ${config.storageAccountUrl}`);
  console.log(`   Max retries: ${config.maxRetries ?? 4}`);

  // ── Prepare a sample file ─────────────────────────────────────
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "blob-demo-"));
  const sampleFilePath = path.join(tmpDir, "hello.txt");
  fs.writeFileSync(sampleFilePath, "Hello from Azure Blob Storage Manager!");

  try {
    // ── 1. Upload ─────────────────────────────────────────────────
    console.log(
      `\n📤 Uploading "${BLOB_NAME}" to container "${CONTAINER_NAME}"...`
    );
    await blobService.uploadBlob(CONTAINER_NAME, BLOB_NAME, sampleFilePath, {
      metadata: {
        createdBy: "blob-manager-demo",
        environment: "development",
      },
      tags: {
        project: "blob-manager",
        status: "active",
      },
    });
    console.log("   ✅ Upload complete (with metadata and index tags).");

    // ── 2. List blobs ─────────────────────────────────────────────
    console.log(`\n📋 Listing blobs in "${CONTAINER_NAME}"...`);
    const blobs = await blobService.listBlobs(CONTAINER_NAME);
    for (const blob of blobs) {
      console.log(
        `   • ${blob.name}  (${blob.contentLength ?? "?"} bytes, ${blob.contentType ?? "unknown type"})`
      );
    }

    // ── 3. Download ───────────────────────────────────────────────
    console.log(`\n📥 Downloading "${BLOB_NAME}"...`);
    const content = await blobService.downloadBlobAsString(
      CONTAINER_NAME,
      BLOB_NAME
    );
    console.log(`   Content: "${content}"`);

    // ── 4. Overwrite with lease ───────────────────────────────────
    const updatedFilePath = path.join(tmpDir, "hello-updated.txt");
    fs.writeFileSync(
      updatedFilePath,
      "Updated content — written under a lease!"
    );

    console.log(`\n🔒 Acquiring lease and overwriting "${BLOB_NAME}"...`);
    await blobService.overwriteWithLease(
      CONTAINER_NAME,
      BLOB_NAME,
      updatedFilePath,
      30
    );
    console.log("   ✅ Overwrite complete (lease released).");

    const updatedContent = await blobService.downloadBlobAsString(
      CONTAINER_NAME,
      BLOB_NAME
    );
    console.log(`   Updated content: "${updatedContent}"`);

    // ── 5. Delete ─────────────────────────────────────────────────
    console.log(`\n🗑️  Deleting "${BLOB_NAME}"...`);
    await blobService.deleteBlob(CONTAINER_NAME, BLOB_NAME);
    console.log("   ✅ Blob deleted.");

    console.log("\n🎉 Demo complete!");
  } finally {
    // Clean up temp files.
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
