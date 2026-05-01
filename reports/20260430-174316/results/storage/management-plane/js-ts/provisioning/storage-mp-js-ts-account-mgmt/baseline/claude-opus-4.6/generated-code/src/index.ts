import { DefaultAzureCredential } from "@azure/identity";
import {
  StorageManagementClient,
  StorageAccount,
  StorageAccountCreateParameters,
  StorageAccountUpdateParameters,
  BlobServiceProperties,
} from "@azure/arm-storage";

// Configuration — set these via environment variables or replace inline
const subscriptionId =
  process.env.AZURE_SUBSCRIPTION_ID || "<your-subscription-id>";
const resourceGroupName =
  process.env.AZURE_RESOURCE_GROUP || "my-storage-rg";
const accountName =
  process.env.AZURE_STORAGE_ACCOUNT_NAME || "mystorageacct" + Date.now();
const location = "eastus";

async function main(): Promise<void> {
  // ---------------------------------------------------------------
  // 1. Authenticate using DefaultAzureCredential
  //    Supports Azure CLI, managed identity, env vars, and more.
  // ---------------------------------------------------------------
  const credential = new DefaultAzureCredential();

  // ---------------------------------------------------------------
  // 2. Create the StorageManagementClient
  // ---------------------------------------------------------------
  const client = new StorageManagementClient(credential, subscriptionId);
  console.log("StorageManagementClient created successfully.\n");

  try {
    // -------------------------------------------------------------
    // 3. Create a new Storage Account (Standard_LRS, eastus)
    // -------------------------------------------------------------
    const createParams: StorageAccountCreateParameters = {
      location,
      sku: { name: "Standard_LRS" },
      kind: "StorageV2",
      tags: { environment: "dev", createdBy: "sdk-sample" },
    };

    console.log(
      `Creating storage account "${accountName}" in "${location}"...`
    );
    const account: StorageAccount =
      await client.storageAccounts.beginCreateAndWait(
        resourceGroupName,
        accountName,
        createParams
      );
    console.log(`  ✓ Created: ${account.name} (id: ${account.id})\n`);

    // -------------------------------------------------------------
    // 4. List all Storage Accounts in the resource group
    //    Uses async iteration (for-await-of) over the paginated API
    // -------------------------------------------------------------
    console.log(
      `Listing storage accounts in resource group "${resourceGroupName}":`
    );
    for await (const sa of client.storageAccounts.listByResourceGroup(
      resourceGroupName
    )) {
      console.log(
        `  - ${sa.name}  (kind: ${sa.kind}, sku: ${sa.sku?.name}, location: ${sa.location})`
      );
    }
    console.log();

    // -------------------------------------------------------------
    // 5. Get properties of the created Storage Account
    // -------------------------------------------------------------
    console.log(`Getting properties for "${accountName}"...`);
    const properties: StorageAccount = await client.storageAccounts.getProperties(
      resourceGroupName,
      accountName
    );
    console.log(`  Name:              ${properties.name}`);
    console.log(`  Location:          ${properties.location}`);
    console.log(`  Kind:              ${properties.kind}`);
    console.log(`  SKU:               ${properties.sku?.name}`);
    console.log(`  Provisioning State:${properties.provisioningState}`);
    console.log(`  Primary Endpoints: ${properties.primaryEndpoints?.blob}`);
    console.log(
      `  Creation Time:     ${properties.creationTime?.toISOString()}\n`
    );

    // -------------------------------------------------------------
    // 6. Update the account to enable blob versioning
    //    Blob versioning is set on the BlobServiceProperties, not
    //    the storage account itself.
    // -------------------------------------------------------------
    console.log("Enabling blob versioning...");

    // 6a. Update account-level tags to demonstrate account update
    const updateParams: StorageAccountUpdateParameters = {
      tags: {
        environment: "dev",
        createdBy: "sdk-sample",
        blobVersioning: "enabled",
      },
    };
    await client.storageAccounts.update(
      resourceGroupName,
      accountName,
      updateParams
    );
    console.log("  ✓ Account tags updated.");

    // 6b. Enable versioning via BlobServiceProperties
    const blobServiceProps: BlobServiceProperties = {
      isVersioningEnabled: true,
    };
    const updatedBlobService =
      await client.blobServices.setServiceProperties(
        resourceGroupName,
        accountName,
        blobServiceProps
      );
    console.log(
      `  ✓ Blob versioning enabled: ${updatedBlobService.isVersioningEnabled}\n`
    );

    // Verify the change
    const blobServiceGet = await client.blobServices.getServiceProperties(
      resourceGroupName,
      accountName
    );
    console.log(
      `  Verified — isVersioningEnabled: ${blobServiceGet.isVersioningEnabled}\n`
    );

    // -------------------------------------------------------------
    // 7. Delete the Storage Account
    // -------------------------------------------------------------
    console.log(`Deleting storage account "${accountName}"...`);
    await client.storageAccounts.delete(resourceGroupName, accountName);
    console.log(`  ✓ Deleted: ${accountName}\n`);

    console.log("All operations completed successfully.");
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
      // Azure SDK errors include a `statusCode` property
      if ("statusCode" in error) {
        console.error(`  HTTP status: ${(error as any).statusCode}`);
      }
    } else {
      console.error("Unknown error:", error);
    }
    process.exit(1);
  }
}

main();
