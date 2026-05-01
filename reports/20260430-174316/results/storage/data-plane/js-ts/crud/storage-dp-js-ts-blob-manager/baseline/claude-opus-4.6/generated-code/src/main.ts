import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { createBlobServiceClient } from "./config";
import { BlobStorageService } from "./blobService";

const CONTAINER_NAME = "demo-container";
const BLOB_NAME = "demo/sample.txt";

async function main(): Promise<void> {
  // ── 1. Initialise client & service ──────────────────────────────────────
  console.log("=== Azure Blob Storage Manager Demo ===\n");

  const serviceClient = createBlobServiceClient({
    maxRetries: 4,
    maxRetryDelayMs: 5000,
  });

  const blobService = new BlobStorageService(serviceClient, CONTAINER_NAME);
  await blobService.ensureContainer();
  console.log(`✓ Container "${CONTAINER_NAME}" is ready.\n`);

  // ── 2. Create a temporary sample file ───────────────────────────────────
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "blob-demo-"));
  const sampleFile = path.join(tmpDir, "sample.txt");
  fs.writeFileSync(sampleFile, "Hello from Azure Blob Storage Manager!\n");

  // ── 3. Upload with metadata & index tags ────────────────────────────────
  console.log(`Uploading "${BLOB_NAME}" …`);
  await blobService.upload(BLOB_NAME, sampleFile, {
    metadata: { createdBy: "demo", purpose: "testing" },
    tags: { environment: "dev", project: "blob-manager" },
  });
  console.log("✓ Upload complete.\n");

  // ── 4. List blobs ──────────────────────────────────────────────────────
  console.log("Listing blobs in container:");
  const blobs = await blobService.listBlobs();
  for (const blob of blobs) {
    console.log(`  • ${blob.name}`);
  }
  console.log();

  // ── 5. Download & print ────────────────────────────────────────────────
  console.log(`Downloading "${BLOB_NAME}" …`);
  const content = await blobService.download(BLOB_NAME);
  console.log(`✓ Content:\n  ${content.trim()}\n`);

  // ── 6. Lease-protected overwrite ───────────────────────────────────────
  const updatedFile = path.join(tmpDir, "updated.txt");
  fs.writeFileSync(updatedFile, "Updated content — written under lease.\n");

  console.log(`Acquiring lease and overwriting "${BLOB_NAME}" …`);
  const leaseId = await blobService.uploadWithLease(BLOB_NAME, updatedFile);
  console.log(`✓ Overwrite complete (lease ${leaseId}).\n`);

  const updatedContent = await blobService.download(BLOB_NAME);
  console.log(`✓ New content:\n  ${updatedContent.trim()}\n`);

  // ── 7. Delete ──────────────────────────────────────────────────────────
  console.log(`Deleting "${BLOB_NAME}" …`);
  await blobService.delete(BLOB_NAME);
  console.log("✓ Deleted.\n");

  // ── Cleanup temp files ─────────────────────────────────────────────────
  fs.rmSync(tmpDir, { recursive: true, force: true });

  console.log("=== Demo complete ===");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
