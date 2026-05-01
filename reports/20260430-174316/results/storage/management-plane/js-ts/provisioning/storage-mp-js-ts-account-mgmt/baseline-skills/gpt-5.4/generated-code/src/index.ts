import { randomBytes } from "node:crypto";
import { BlobServiceProperties, StorageManagementClient } from "@azure/arm-storage";
import { DefaultAzureCredential } from "@azure/identity";

const subscriptionId = getRequiredEnv("AZURE_SUBSCRIPTION_ID");
const resourceGroupName = getRequiredEnv("AZURE_RESOURCE_GROUP_NAME");
const storageAccountName =
  process.env.AZURE_STORAGE_ACCOUNT_NAME ?? createStorageAccountName();
const location = "eastus";

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function createStorageAccountName(): string {
  return `st${randomBytes(11).toString("hex")}`.slice(0, 24);
}

function buildBlobServiceUpdate(
  current: BlobServiceProperties,
): BlobServiceProperties {
  return {
    cors: current.cors,
    defaultServiceVersion: current.defaultServiceVersion,
    deleteRetentionPolicy: current.deleteRetentionPolicy,
    isVersioningEnabled: true,
    automaticSnapshotPolicyEnabled: current.automaticSnapshotPolicyEnabled,
    changeFeed: current.changeFeed,
    restorePolicy: current.restorePolicy,
    containerDeleteRetentionPolicy: current.containerDeleteRetentionPolicy,
    lastAccessTimeTrackingPolicy: current.lastAccessTimeTrackingPolicy,
  };
}

async function main(): Promise<void> {
  // npm install @azure/arm-storage @azure/identity
  const credential = new DefaultAzureCredential();
  const client = new StorageManagementClient(credential, subscriptionId);
  let created = false;

  try {
    console.log(`Creating storage account "${storageAccountName}" in eastus...`);

    const createdAccount = await client.storageAccounts.beginCreateAndWait(
      resourceGroupName,
      storageAccountName,
      {
        location,
        kind: "StorageV2",
        sku: {
          name: "Standard_LRS",
        },
        enableHttpsTrafficOnly: true,
      },
    );

    created = true;
    console.log(`Created storage account: ${createdAccount.name}`);

    console.log(`Listing storage accounts in "${resourceGroupName}"...`);
    for await (const account of client.storageAccounts.listByResourceGroup(
      resourceGroupName,
    )) {
      console.log(`- ${account.name} (${account.location})`);
    }

    const account = await client.storageAccounts.getProperties(
      resourceGroupName,
      storageAccountName,
    );

    console.log("Storage account properties:");
    console.log(`- id: ${account.id}`);
    console.log(`- kind: ${account.kind}`);
    console.log(`- location: ${account.location}`);
    console.log(`- primary blob endpoint: ${account.primaryEndpoints?.blob}`);

    const currentBlobServiceProperties =
      await client.blobServices.getServiceProperties(
        resourceGroupName,
        storageAccountName,
      );

    const updatedBlobServiceProperties =
      await client.blobServices.setServiceProperties(
        resourceGroupName,
        storageAccountName,
        buildBlobServiceUpdate(currentBlobServiceProperties),
      );

    console.log(
      `Blob versioning enabled: ${updatedBlobServiceProperties.isVersioningEnabled === true}`,
    );
  } finally {
    if (created) {
      console.log(`Deleting storage account "${storageAccountName}"...`);
      await client.storageAccounts.delete(resourceGroupName, storageAccountName);
      console.log(`Deleted storage account: ${storageAccountName}`);
    }
  }
}

main().catch((error: unknown) => {
  console.error("Storage account management failed.", error);
  process.exitCode = 1;
});
