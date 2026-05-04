import { DefaultAzureCredential } from "@azure/identity";
import {
  StorageManagementClient,
  StorageAccount,
  StorageAccountCreateParameters,
  StorageAccountUpdateParameters,
  BlobServiceProperties,
} from "@azure/arm-storage";

// Configuration — supply via environment variables or replace with your values
const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID || "<subscription-id>";
const resourceGroupName = process.env.AZURE_RESOURCE_GROUP || "<resource-group>";
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || "mystorageacct" + Date.now().toString().slice(-6);
const location = "eastus";

async function main(): Promise<void> {
  // 1. Authenticate using DefaultAzureCredential
  //    Tries env vars → managed identity → VS Code → Azure CLI → PowerShell
  const credential = new DefaultAzureCredential();

  // 2. Create the StorageManagementClient
  const client = new StorageManagementClient(credential, subscriptionId);

  // 3. Create a new Storage Account (Standard_LRS in eastus)
  await createStorageAccount(client);

  // 4. List all Storage Accounts in the resource group
  await listStorageAccounts(client);

  // 5. Get the properties of the created Storage Account
  await getStorageAccountProperties(client);

  // 6. Update the account to enable blob versioning
  await enableBlobVersioning(client);

  // 7. Delete the Storage Account
  await deleteStorageAccount(client);
}

// ---------------------------------------------------------------------------
// 3. Create a new Storage Account
// ---------------------------------------------------------------------------
async function createStorageAccount(client: StorageManagementClient): Promise<void> {
  console.log(`\n--- Creating Storage Account: ${accountName} ---`);

  const createParams: StorageAccountCreateParameters = {
    location,
    sku: { name: "Standard_LRS" },
    kind: "StorageV2",
    tags: {
      environment: "demo",
      createdBy: "azure-sdk-ts",
    },
  };

  // beginCreateAndWait polls until the long-running operation completes
  const account: StorageAccount = await client.storageAccounts.beginCreateAndWait(
    resourceGroupName,
    accountName,
    createParams
  );

  console.log(`Created: ${account.name} (provisioning state: ${account.provisioningState})`);
  console.log(`  ID:       ${account.id}`);
  console.log(`  Location: ${account.location}`);
  console.log(`  Kind:     ${account.kind}`);
  console.log(`  SKU:      ${account.sku?.name}`);
}

// ---------------------------------------------------------------------------
// 4. List all Storage Accounts in a resource group (async iteration)
// ---------------------------------------------------------------------------
async function listStorageAccounts(client: StorageManagementClient): Promise<void> {
  console.log(`\n--- Listing Storage Accounts in "${resourceGroupName}" ---`);

  // The SDK returns an AsyncIterableIterator — use for-await-of
  let count = 0;
  for await (const account of client.storageAccounts.listByResourceGroup(resourceGroupName)) {
    count++;
    console.log(`  [${count}] ${account.name} — ${account.location} (${account.sku?.name})`);
  }

  console.log(`Total accounts: ${count}`);
}

// ---------------------------------------------------------------------------
// 5. Get Storage Account properties
// ---------------------------------------------------------------------------
async function getStorageAccountProperties(client: StorageManagementClient): Promise<void> {
  console.log(`\n--- Getting Properties of "${accountName}" ---`);

  const account: StorageAccount = await client.storageAccounts.getProperties(
    resourceGroupName,
    accountName
  );

  console.log(`  Name:               ${account.name}`);
  console.log(`  Provisioning State: ${account.provisioningState}`);
  console.log(`  Primary Location:   ${account.primaryLocation}`);
  console.log(`  Status:             ${account.statusOfPrimary}`);
  console.log(`  Creation Time:      ${account.creationTime}`);
  console.log(`  Access Tier:        ${account.accessTier}`);
  console.log(`  Primary Endpoints:`);
  console.log(`    Blob:  ${account.primaryEndpoints?.blob}`);
  console.log(`    File:  ${account.primaryEndpoints?.file}`);
  console.log(`    Queue: ${account.primaryEndpoints?.queue}`);
  console.log(`    Table: ${account.primaryEndpoints?.table}`);
}

// ---------------------------------------------------------------------------
// 6. Update the account to enable blob versioning
// ---------------------------------------------------------------------------
async function enableBlobVersioning(client: StorageManagementClient): Promise<void> {
  console.log(`\n--- Enabling Blob Versioning on "${accountName}" ---`);

  // Blob versioning is a property of the Blob Service, not the account itself.
  // Use blobServices.setServiceProperties to enable it.
  const blobServiceProperties: BlobServiceProperties = {
    isVersioningEnabled: true,
  };

  const result = await client.blobServices.setServiceProperties(
    resourceGroupName,
    accountName,
    blobServiceProperties
  );

  console.log(`  Versioning enabled: ${result.isVersioningEnabled}`);

  // Also update account-level tags to record the change
  const updateParams: StorageAccountUpdateParameters = {
    tags: {
      environment: "demo",
      createdBy: "azure-sdk-ts",
      blobVersioning: "enabled",
    },
  };

  const updated = await client.storageAccounts.update(
    resourceGroupName,
    accountName,
    updateParams
  );

  console.log(`  Updated tags: ${JSON.stringify(updated.tags)}`);
}

// ---------------------------------------------------------------------------
// 7. Delete the Storage Account
// ---------------------------------------------------------------------------
async function deleteStorageAccount(client: StorageManagementClient): Promise<void> {
  console.log(`\n--- Deleting Storage Account: ${accountName} ---`);

  await client.storageAccounts.delete(resourceGroupName, accountName);

  console.log(`  Deleted successfully.`);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
main().catch((err: Error) => {
  console.error("Error:", err.message);
  process.exit(1);
});
