import { DefaultAzureCredential } from "@azure/identity";
import { StorageManagementClient } from "@azure/arm-storage";

/**
 * Azure Storage Account Management Example
 * Demonstrates CRUD operations on Azure Storage Accounts using the Management Plane SDK
 */

// Configuration
const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID || "your-subscription-id";
const resourceGroupName = process.env.AZURE_RESOURCE_GROUP || "your-resource-group";
const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || `stgacct${Date.now()}`;
const location = "eastus";

async function main() {
  try {
    console.log("=== Azure Storage Account Management Demo ===\n");

    // Step 1: Authenticate using DefaultAzureCredential
    console.log("1. Authenticating with DefaultAzureCredential...");
    const credential = new DefaultAzureCredential();
    console.log("✓ Credential created\n");

    // Step 2: Create StorageManagementClient
    console.log("2. Creating StorageManagementClient...");
    const client = new StorageManagementClient(credential, subscriptionId);
    console.log(`✓ Client created for subscription: ${subscriptionId}\n`);

    // Step 3: Create a new Storage Account with Standard_LRS SKU
    console.log("3. Creating Storage Account...");
    console.log(`   Name: ${storageAccountName}`);
    console.log(`   Resource Group: ${resourceGroupName}`);
    console.log(`   Location: ${location}`);
    console.log(`   SKU: Standard_LRS`);

    const createParameters = {
      location: location,
      sku: {
        name: "Standard_LRS", // Locally Redundant Storage
      },
      kind: "StorageV2", // General-purpose v2 account
      properties: {
        allowBlobPublicAccess: false,
        minimumTlsVersion: "TLS1_2",
        supportsHttpsTrafficOnly: true,
      },
    };

    const createPoller = await client.storageAccounts.beginCreate(
      resourceGroupName,
      storageAccountName,
      createParameters
    );

    const storageAccount = await createPoller.pollUntilDone();
    console.log(`✓ Storage Account created: ${storageAccount.name}`);
    console.log(`   ID: ${storageAccount.id}\n`);

    // Step 4: List all Storage Accounts in the resource group using async iteration
    console.log("4. Listing all Storage Accounts in resource group...");
    const storageAccounts = client.storageAccounts.listByResourceGroup(resourceGroupName);
    let accountCount = 0;

    for await (const account of storageAccounts) {
      accountCount++;
      console.log(`   - ${account.name} (${account.sku?.name}) in ${account.location}`);
    }
    console.log(`✓ Found ${accountCount} storage account(s)\n`);

    // Step 5: Get the properties of the created Storage Account
    console.log("5. Getting Storage Account properties...");
    const accountProperties = await client.storageAccounts.getProperties(
      resourceGroupName,
      storageAccountName
    );

    console.log(`   Name: ${accountProperties.name}`);
    console.log(`   Type: ${accountProperties.type}`);
    console.log(`   Kind: ${accountProperties.kind}`);
    console.log(`   SKU: ${accountProperties.sku?.name}`);
    console.log(`   Location: ${accountProperties.location}`);
    console.log(`   Provisioning State: ${accountProperties.provisioningState}`);
    console.log(`   Primary Location: ${accountProperties.primaryLocation}`);
    console.log(`   Status of Primary: ${accountProperties.statusOfPrimary}`);
    console.log(`   HTTPS Only: ${accountProperties.supportsHttpsTrafficOnly}`);
    console.log(`   Min TLS Version: ${accountProperties.minimumTlsVersion}`);
    console.log(`   Blob Versioning: ${accountProperties.isVersioningEnabled || "Not enabled"}\n`);

    // Step 6: Update the account to enable blob versioning
    console.log("6. Updating Storage Account to enable blob versioning...");
    const updateParameters = {
      properties: {
        isVersioningEnabled: true,
      },
    };

    const updatedAccount = await client.storageAccounts.update(
      resourceGroupName,
      storageAccountName,
      updateParameters
    );

    console.log(`✓ Storage Account updated`);
    console.log(`   Blob Versioning: ${updatedAccount.isVersioningEnabled}\n`);

    // Verify the update by getting blob service properties
    console.log("   Verifying blob service properties...");
    const blobServices = await client.blobServices.getServiceProperties(
      resourceGroupName,
      storageAccountName
    );
    console.log(`   Versioning Enabled: ${blobServices.isVersioningEnabled || false}\n`);

    // Step 7: Delete the Storage Account
    console.log("7. Deleting Storage Account...");
    console.log(`   This will permanently delete: ${storageAccountName}`);
    
    // Uncomment the following lines to actually delete the account
    // await client.storageAccounts.delete(resourceGroupName, storageAccountName);
    // console.log(`✓ Storage Account deleted: ${storageAccountName}\n`);
    
    console.log(`   [Skipped] Delete command commented out for safety\n`);

    console.log("=== Demo completed successfully ===");
  } catch (error) {
    console.error("Error occurred:", error);
    if (error instanceof Error) {
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
    }
    process.exit(1);
  }
}

// Execute the main function
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
