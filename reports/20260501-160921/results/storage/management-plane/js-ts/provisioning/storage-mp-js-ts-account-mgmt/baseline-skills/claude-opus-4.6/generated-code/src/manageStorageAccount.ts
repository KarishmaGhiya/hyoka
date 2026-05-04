import { DefaultAzureCredential } from "@azure/identity";
import {
  StorageManagementClient,
  StorageAccount,
  StorageAccountCreateParameters,
  BlobServiceProperties,
} from "@azure/arm-storage";

// Configuration — set these via environment variables or replace with actual values
const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID || "<subscription-id>";
const resourceGroupName = process.env.AZURE_RESOURCE_GROUP || "<resource-group>";
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || "mystorageacct" + Date.now().toString().slice(-6);
const location = "eastus";

async function main(): Promise<void> {
  // 1. Authenticate using DefaultAzureCredential
  //    Automatically tries env vars, managed identity, Azure CLI, etc.
  const credential = new DefaultAzureCredential();

  // 2. Create StorageManagementClient
  const client = new StorageManagementClient(credential, subscriptionId);

  // 3. Create a new Storage Account with Standard_LRS SKU
  await createStorageAccount(client);

  // 4. List all Storage Accounts in the resource group
  await listStorageAccounts(client);

  // 5. Get properties of the created Storage Account
  await getStorageAccount(client);

  // 6. Update the account to enable blob versioning
  await enableBlobVersioning(client);

  // 7. Delete the Storage Account
  await deleteStorageAccount(client);
}

async function createStorageAccount(client: StorageManagementClient): Promise<void> {
  console.log(`Creating storage account "${accountName}" in ${location}...`);

  const parameters: StorageAccountCreateParameters = {
    location,
    sku: { name: "Standard_LRS" },
    kind: "StorageV2",
    tags: {
      environment: "demo",
      createdBy: "azure-sdk-typescript",
    },
  };

  // beginCreateAndWait polls until the long-running operation completes
  const account: StorageAccount = await client.storageAccounts.beginCreateAndWait(
    resourceGroupName,
    accountName,
    parameters
  );

  console.log(`  Created: ${account.name}`);
  console.log(`  Provisioning state: ${account.provisioningState}`);
  console.log(`  Primary location: ${account.primaryLocation}`);
}

async function listStorageAccounts(client: StorageManagementClient): Promise<void> {
  console.log(`\nListing storage accounts in resource group "${resourceGroupName}"...`);

  // Async iteration over paginated results
  for await (const account of client.storageAccounts.listByResourceGroup(resourceGroupName)) {
    console.log(`  - ${account.name} (${account.location}, ${account.sku?.name})`);
  }
}

async function getStorageAccount(client: StorageManagementClient): Promise<void> {
  console.log(`\nGetting properties of "${accountName}"...`);

  const account: StorageAccount = await client.storageAccounts.getProperties(
    resourceGroupName,
    accountName
  );

  console.log(`  Name: ${account.name}`);
  console.log(`  Kind: ${account.kind}`);
  console.log(`  SKU: ${account.sku?.name}`);
  console.log(`  Location: ${account.location}`);
  console.log(`  Provisioning state: ${account.provisioningState}`);
  console.log(`  Primary endpoints:`);
  console.log(`    Blob:  ${account.primaryEndpoints?.blob}`);
  console.log(`    File:  ${account.primaryEndpoints?.file}`);
  console.log(`    Queue: ${account.primaryEndpoints?.queue}`);
  console.log(`    Table: ${account.primaryEndpoints?.table}`);
}

async function enableBlobVersioning(client: StorageManagementClient): Promise<void> {
  console.log(`\nEnabling blob versioning on "${accountName}"...`);

  // Update blob service properties to enable versioning
  const blobServiceProperties: BlobServiceProperties = {
    isVersioningEnabled: true,
  };

  const result = await client.blobServices.setServiceProperties(
    resourceGroupName,
    accountName,
    blobServiceProperties
  );

  console.log(`  Blob versioning enabled: ${result.isVersioningEnabled}`);
}

async function deleteStorageAccount(client: StorageManagementClient): Promise<void> {
  console.log(`\nDeleting storage account "${accountName}"...`);

  await client.storageAccounts.delete(resourceGroupName, accountName);

  console.log("  Deleted successfully.");
}

main().catch((error: Error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
