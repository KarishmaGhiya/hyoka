import { StorageManagementClient } from "@azure/arm-storage";
import { DefaultAzureCredential } from "@azure/identity";

// Configuration — set via environment variables or replace with your values
const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID!;
const resourceGroupName = process.env.AZURE_RESOURCE_GROUP || "my-storage-rg";
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || "mystorageacct" + Date.now().toString().slice(-6);
const location = "eastus";

async function main(): Promise<void> {
  // 1. Authenticate using DefaultAzureCredential (supports Managed Identity,
  //    Azure CLI, environment variables, and more)
  const credential = new DefaultAzureCredential();

  // 2. Create the StorageManagementClient
  const client = new StorageManagementClient(credential, subscriptionId);

  console.log(`Using subscription: ${subscriptionId}`);
  console.log(`Resource group:     ${resourceGroupName}`);
  console.log(`Account name:       ${accountName}`);
  console.log();

  try {
    // 3. Create a new Storage Account with Standard_LRS in eastus
    await createStorageAccount(client);

    // 4. List all Storage Accounts in the resource group
    await listStorageAccounts(client);

    // 5. Get the properties of the created Storage Account
    await getStorageAccountProperties(client);

    // 6. Update the account to enable blob versioning
    await enableBlobVersioning(client);

    // 7. Delete the Storage Account
    await deleteStorageAccount(client);
  } catch (error: any) {
    console.error("Operation failed:", error.message);
    throw error;
  }
}

// 3. Create a new Storage Account with Standard_LRS SKU in "eastus"
async function createStorageAccount(client: StorageManagementClient): Promise<void> {
  console.log(`Creating storage account "${accountName}"...`);

  const account = await client.storageAccounts.beginCreateAndWait(
    resourceGroupName,
    accountName,
    {
      location,
      sku: { name: "Standard_LRS" },
      kind: "StorageV2",
      minimumTlsVersion: "TLS1_2",
      allowBlobPublicAccess: false,
      enableHttpsTrafficOnly: true,
    }
  );

  console.log(`  Created: ${account.name} (provisioning state: ${account.provisioningState})`);
  console.log(`  ID: ${account.id}`);
  console.log();
}

// 4. List all Storage Accounts in a resource group using async iteration
async function listStorageAccounts(client: StorageManagementClient): Promise<void> {
  console.log(`Listing storage accounts in resource group "${resourceGroupName}":`);

  for await (const account of client.storageAccounts.listByResourceGroup(resourceGroupName)) {
    console.log(`  - ${account.name} (${account.location}, SKU: ${account.sku?.name})`);
  }

  console.log();
}

// 5. Get the properties of the created Storage Account
async function getStorageAccountProperties(client: StorageManagementClient): Promise<void> {
  console.log(`Getting properties of "${accountName}"...`);

  const account = await client.storageAccounts.getProperties(resourceGroupName, accountName);

  console.log(`  Name:               ${account.name}`);
  console.log(`  Location:           ${account.location}`);
  console.log(`  SKU:                ${account.sku?.name}`);
  console.log(`  Kind:               ${account.kind}`);
  console.log(`  Provisioning State: ${account.provisioningState}`);
  console.log(`  Primary Endpoints:`);
  console.log(`    Blob:  ${account.primaryEndpoints?.blob}`);
  console.log(`    Table: ${account.primaryEndpoints?.table}`);
  console.log(`    Queue: ${account.primaryEndpoints?.queue}`);
  console.log(`    File:  ${account.primaryEndpoints?.file}`);
  console.log(`  Creation Time:      ${account.creationTime}`);
  console.log(`  TLS Version:        ${account.minimumTlsVersion}`);
  console.log();
}

// 6. Update the account to enable blob versioning via Blob Service Properties
async function enableBlobVersioning(client: StorageManagementClient): Promise<void> {
  console.log(`Enabling blob versioning on "${accountName}"...`);

  const blobServiceProperties = await client.blobServices.setServiceProperties(
    resourceGroupName,
    accountName,
    {
      isVersioningEnabled: true,
    }
  );

  console.log(`  Versioning enabled: ${blobServiceProperties.isVersioningEnabled}`);
  console.log();
}

// 7. Delete the Storage Account
async function deleteStorageAccount(client: StorageManagementClient): Promise<void> {
  console.log(`Deleting storage account "${accountName}"...`);

  await client.storageAccounts.delete(resourceGroupName, accountName);

  console.log(`  Storage account "${accountName}" deleted successfully.`);
  console.log();
}

main().catch((err: Error) => {
  console.error("Error running sample:", err.message);
  process.exit(1);
});
