import { StorageManagementClient } from "@azure/arm-storage";
import { DefaultAzureCredential } from "@azure/identity";

// Configuration — supply via environment variables
const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
const resourceGroupName = process.env.AZURE_RESOURCE_GROUP || "my-resource-group";
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || "mysdkstorageacct";
const location = "eastus";

if (!subscriptionId) {
  throw new Error("AZURE_SUBSCRIPTION_ID environment variable is required");
}

// 1. Authenticate using DefaultAzureCredential (supports managed identity,
//    Azure CLI, environment variables, and other credential sources)
const credential = new DefaultAzureCredential();

// 2. Create the StorageManagementClient
const client = new StorageManagementClient(credential, subscriptionId);

/**
 * Create a new Storage Account with Standard_LRS SKU in eastus.
 * Uses beginCreateAndWait which polls the long-running operation to completion.
 */
async function createStorageAccount(): Promise<void> {
  console.log(`Creating storage account "${accountName}" in "${location}"...`);

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

  console.log(`Created storage account: ${account.name} (ID: ${account.id})`);
}

/**
 * List all Storage Accounts in the resource group using async iteration.
 */
async function listStorageAccounts(): Promise<void> {
  console.log(
    `\nListing storage accounts in resource group "${resourceGroupName}"...`
  );

  for await (const account of client.storageAccounts.listByResourceGroup(
    resourceGroupName
  )) {
    console.log(
      `  - ${account.name} | Location: ${account.location} | SKU: ${account.sku?.name}`
    );
  }
}

/**
 * Get properties of the created Storage Account.
 */
async function getStorageAccountProperties(): Promise<void> {
  console.log(`\nGetting properties for "${accountName}"...`);

  const account = await client.storageAccounts.getProperties(
    resourceGroupName,
    accountName
  );

  console.log(`  Name:             ${account.name}`);
  console.log(`  Location:         ${account.location}`);
  console.log(`  SKU:              ${account.sku?.name}`);
  console.log(`  Kind:             ${account.kind}`);
  console.log(`  Provisioning:     ${account.provisioningState}`);
  console.log(`  Primary endpoint: ${account.primaryEndpoints?.blob}`);
  console.log(`  Min TLS version:  ${account.minimumTlsVersion}`);
}

/**
 * Update the account to enable blob versioning via the Blob Service Properties.
 */
async function enableBlobVersioning(): Promise<void> {
  console.log(`\nEnabling blob versioning on "${accountName}"...`);

  const blobServiceProperties =
    await client.blobServices.setServiceProperties(
      resourceGroupName,
      accountName,
      {
        isVersioningEnabled: true,
      }
    );

  console.log(
    `  Blob versioning enabled: ${blobServiceProperties.isVersioningEnabled}`
  );
}

/**
 * Delete the Storage Account.
 */
async function deleteStorageAccount(): Promise<void> {
  console.log(`\nDeleting storage account "${accountName}"...`);

  await client.storageAccounts.delete(resourceGroupName, accountName);

  console.log(`  Storage account "${accountName}" deleted.`);
}

/**
 * Main orchestrator — runs all management operations in sequence.
 */
async function main(): Promise<void> {
  try {
    await createStorageAccount();
    await listStorageAccounts();
    await getStorageAccountProperties();
    await enableBlobVersioning();
    await deleteStorageAccount();

    console.log("\nAll operations completed successfully.");
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(`Error: ${err.message}`);
    }
    throw err;
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
