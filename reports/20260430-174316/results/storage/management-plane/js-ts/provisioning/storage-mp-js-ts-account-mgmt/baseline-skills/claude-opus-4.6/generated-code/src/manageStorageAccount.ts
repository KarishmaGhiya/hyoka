import { DefaultAzureCredential } from "@azure/identity";
import { StorageManagementClient } from "@azure/arm-storage";
import type {
  StorageAccount,
  StorageAccountCreateParameters,
  StorageAccountUpdateParameters,
  BlobServiceProperties,
} from "@azure/arm-storage";

// Configuration — replace with your actual values or set via environment variables
const subscriptionId =
  process.env.AZURE_SUBSCRIPTION_ID || "<your-subscription-id>";
const resourceGroupName =
  process.env.AZURE_RESOURCE_GROUP || "my-resource-group";
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || "mystorageacct";
const location = "eastus";

/**
 * Creates and returns an authenticated StorageManagementClient.
 *
 * DefaultAzureCredential automatically tries multiple auth methods:
 *   Environment variables → Managed Identity → Azure CLI → etc.
 */
function createStorageClient(): StorageManagementClient {
  const credential = new DefaultAzureCredential();
  return new StorageManagementClient(credential, subscriptionId);
}

/**
 * Creates a new Storage Account with Standard_LRS redundancy in the
 * specified location. Uses beginCreateAndWait to poll the long-running
 * operation until completion.
 */
async function createStorageAccount(
  client: StorageManagementClient
): Promise<StorageAccount> {
  const parameters: StorageAccountCreateParameters = {
    sku: { name: "Standard_LRS" },
    kind: "StorageV2",
    location,
    tags: { environment: "development" },
  };

  console.log(
    `Creating storage account "${accountName}" in "${location}" ...`
  );
  const account = await client.storageAccounts.beginCreateAndWait(
    resourceGroupName,
    accountName,
    parameters
  );
  console.log(`  ✓ Created: ${account.name} (provisioning: ${account.provisioningState})`);
  return account;
}

/**
 * Lists every Storage Account in the resource group using the SDK's
 * built-in async iterator (PagedAsyncIterableIterator).
 */
async function listStorageAccounts(
  client: StorageManagementClient
): Promise<void> {
  console.log(
    `\nListing storage accounts in resource group "${resourceGroupName}" ...`
  );

  const iterator = client.storageAccounts.listByResourceGroup(resourceGroupName);

  for await (const account of iterator) {
    console.log(
      `  • ${account.name}  |  location: ${account.location}  |  sku: ${account.sku?.name}`
    );
  }
}

/**
 * Retrieves and displays the full properties of a single Storage Account.
 */
async function getStorageAccountProperties(
  client: StorageManagementClient
): Promise<StorageAccount> {
  console.log(`\nGetting properties for "${accountName}" ...`);

  const account = await client.storageAccounts.getProperties(
    resourceGroupName,
    accountName
  );

  console.log(`  Name             : ${account.name}`);
  console.log(`  Location         : ${account.location}`);
  console.log(`  SKU              : ${account.sku?.name}`);
  console.log(`  Kind             : ${account.kind}`);
  console.log(`  Provisioning     : ${account.provisioningState}`);
  console.log(`  Primary endpoint : ${account.primaryEndpoints?.blob}`);
  console.log(`  Creation time    : ${account.creationTime}`);

  return account;
}

/**
 * Enables blob versioning on the Storage Account by updating its
 * Blob Service properties.
 */
async function enableBlobVersioning(
  client: StorageManagementClient
): Promise<void> {
  console.log(`\nEnabling blob versioning on "${accountName}" ...`);

  const blobServiceProperties: BlobServiceProperties = {
    isVersioningEnabled: true,
  };

  const result = await client.blobServices.setServiceProperties(
    resourceGroupName,
    accountName,
    blobServiceProperties
  );

  console.log(
    `  ✓ Blob versioning enabled: ${result.isVersioningEnabled}`
  );
}

/**
 * Updates the Storage Account metadata (tags) to demonstrate the
 * account-level update operation.
 */
async function updateStorageAccount(
  client: StorageManagementClient
): Promise<void> {
  console.log(`\nUpdating storage account "${accountName}" tags ...`);

  const updateParameters: StorageAccountUpdateParameters = {
    tags: {
      environment: "development",
      updatedBy: "azure-sdk-demo",
    },
  };

  const updated = await client.storageAccounts.update(
    resourceGroupName,
    accountName,
    updateParameters
  );

  console.log(`  ✓ Updated tags: ${JSON.stringify(updated.tags)}`);
}

/**
 * Deletes the Storage Account.
 */
async function deleteStorageAccount(
  client: StorageManagementClient
): Promise<void> {
  console.log(`\nDeleting storage account "${accountName}" ...`);
  await client.storageAccounts.delete(resourceGroupName, accountName);
  console.log(`  ✓ Deleted "${accountName}"`);
}

/**
 * Orchestrates the full lifecycle: create → list → get → update → delete.
 */
async function main(): Promise<void> {
  const client = createStorageClient();

  try {
    // 1. Create a new Storage Account
    await createStorageAccount(client);

    // 2. List all Storage Accounts in the resource group
    await listStorageAccounts(client);

    // 3. Get properties of the created account
    await getStorageAccountProperties(client);

    // 4. Enable blob versioning (Blob Service property update)
    await enableBlobVersioning(client);

    // 5. Update account-level metadata (tags)
    await updateStorageAccount(client);

    // 6. Delete the Storage Account
    await deleteStorageAccount(client);

    console.log("\n✅ All operations completed successfully.");
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`\n❌ Error: ${error.message}`);
    }
    throw error;
  }
}

main();
