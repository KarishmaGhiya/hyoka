import { DefaultAzureCredential } from "@azure/identity";
import { 
  StorageManagementClient,
  StorageAccount,
  StorageAccountCreateParameters,
  StorageAccountUpdateParameters
} from "@azure/arm-storage";

/**
 * Azure Storage Account Management Example
 * 
 * This program demonstrates how to:
 * 1. Authenticate using DefaultAzureCredential
 * 2. Create a StorageManagementClient
 * 3. Create a new Storage Account
 * 4. List Storage Accounts in a resource group
 * 5. Get Storage Account properties
 * 6. Update account to enable blob versioning
 * 7. Delete the Storage Account
 */

// Configuration
const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID || "<your-subscription-id>";
const resourceGroupName = process.env.AZURE_RESOURCE_GROUP || "rg-storage-demo";
const storageAccountName = process.env.STORAGE_ACCOUNT_NAME || `stgdemo${Date.now().toString().slice(-6)}`;
const location = "eastus";

async function main() {
  try {
    console.log("=== Azure Storage Account Management Demo ===\n");

    // Step 1: Authenticate using DefaultAzureCredential
    console.log("1. Authenticating with DefaultAzureCredential...");
    const credential = new DefaultAzureCredential();
    console.log("✓ Authentication configured\n");

    // Step 2: Create StorageManagementClient
    console.log("2. Creating StorageManagementClient...");
    const client = new StorageManagementClient(credential, subscriptionId);
    console.log(`✓ Client created for subscription: ${subscriptionId}\n`);

    // Step 3: Create a new Storage Account
    console.log("3. Creating Storage Account...");
    console.log(`   Name: ${storageAccountName}`);
    console.log(`   Resource Group: ${resourceGroupName}`);
    console.log(`   Location: ${location}`);
    console.log(`   SKU: Standard_LRS`);

    const createParameters: StorageAccountCreateParameters = {
      location: location,
      sku: {
        name: "Standard_LRS",
      },
      kind: "StorageV2",
      properties: {
        minimumTlsVersion: "TLS1_2",
        allowBlobPublicAccess: false,
        supportsHttpsTrafficOnly: true,
        encryption: {
          services: {
            blob: {
              enabled: true,
              keyType: "Account"
            },
            file: {
              enabled: true,
              keyType: "Account"
            }
          },
          keySource: "Microsoft.Storage"
        }
      },
      tags: {
        environment: "demo",
        managedBy: "typescript-sdk"
      }
    };

    const createPoller = await client.storageAccounts.beginCreate(
      resourceGroupName,
      storageAccountName,
      createParameters
    );

    console.log("   Waiting for storage account creation...");
    const createdAccount = await createPoller.pollUntilDone();
    console.log(`✓ Storage Account created: ${createdAccount.name}`);
    console.log(`   ID: ${createdAccount.id}`);
    console.log(`   Provisioning State: ${createdAccount.provisioningState}\n`);

    // Step 4: List all Storage Accounts in the resource group
    console.log("4. Listing Storage Accounts in resource group...");
    console.log(`   Resource Group: ${resourceGroupName}\n`);

    let accountCount = 0;
    const accountsIterable = client.storageAccounts.listByResourceGroup(resourceGroupName);
    
    for await (const account of accountsIterable) {
      accountCount++;
      console.log(`   [${accountCount}] ${account.name}`);
      console.log(`       Location: ${account.location}`);
      console.log(`       SKU: ${account.sku?.name}`);
      console.log(`       Kind: ${account.kind}`);
      console.log(`       Status: ${account.statusOfPrimary}`);
    }
    
    console.log(`\n✓ Found ${accountCount} storage account(s)\n`);

    // Step 5: Get properties of the created Storage Account
    console.log("5. Getting Storage Account properties...");
    const accountProperties = await client.storageAccounts.getProperties(
      resourceGroupName,
      storageAccountName
    );

    console.log(`✓ Retrieved properties for: ${accountProperties.name}`);
    console.log(`   Primary Location: ${accountProperties.primaryLocation}`);
    console.log(`   Status: ${accountProperties.statusOfPrimary}`);
    console.log(`   Creation Time: ${accountProperties.creationTime}`);
    console.log(`   HTTPS Only: ${accountProperties.enableHttpsTrafficOnly}`);
    console.log(`   TLS Version: ${accountProperties.minimumTlsVersion}`);
    console.log(`   Blob Public Access: ${accountProperties.allowBlobPublicAccess}`);
    
    if (accountProperties.primaryEndpoints) {
      console.log(`   Primary Endpoints:`);
      console.log(`     - Blob: ${accountProperties.primaryEndpoints.blob}`);
      console.log(`     - Queue: ${accountProperties.primaryEndpoints.queue}`);
      console.log(`     - Table: ${accountProperties.primaryEndpoints.table}`);
      console.log(`     - File: ${accountProperties.primaryEndpoints.file}`);
    }
    console.log();

    // Step 6: Update the account to enable blob versioning
    console.log("6. Updating Storage Account to enable blob versioning...");
    
    const updateParameters: StorageAccountUpdateParameters = {
      properties: {
        isVersioningEnabled: true
      },
      tags: {
        environment: "demo",
        managedBy: "typescript-sdk",
        updated: new Date().toISOString()
      }
    };

    const updatedAccount = await client.storageAccounts.update(
      resourceGroupName,
      storageAccountName,
      updateParameters
    );

    console.log(`✓ Storage Account updated: ${updatedAccount.name}`);
    console.log(`   Versioning Enabled: ${updatedAccount.isVersioningEnabled}`);
    console.log(`   Tags: ${JSON.stringify(updatedAccount.tags, null, 2)}\n`);

    // Step 7: Delete the Storage Account
    console.log("7. Deleting Storage Account...");
    console.log(`   This will permanently delete: ${storageAccountName}`);
    
    await client.storageAccounts.delete(resourceGroupName, storageAccountName);
    
    console.log(`✓ Storage Account deleted successfully\n`);

    console.log("=== Demo completed successfully ===");

  } catch (error) {
    console.error("\n❌ Error occurred:");
    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`);
      if ('statusCode' in error) {
        console.error(`   Status Code: ${(error as any).statusCode}`);
      }
      if ('code' in error) {
        console.error(`   Error Code: ${(error as any).code}`);
      }
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

// Run the program
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
