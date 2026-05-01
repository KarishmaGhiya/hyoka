import { DefaultAzureCredential } from "@azure/identity";
import { StorageManagementClient } from "@azure/arm-storage";
import type { 
  StorageAccount, 
  StorageAccountCreateParameters,
  StorageAccountUpdateParameters 
} from "@azure/arm-storage";

/**
 * Azure Storage Account Management Example
 * 
 * Required packages:
 * npm install @azure/identity @azure/arm-storage
 * 
 * Environment variables required:
 * - AZURE_SUBSCRIPTION_ID: Your Azure subscription ID
 * - AZURE_TENANT_ID: Your Azure AD tenant ID (for service principal)
 * - AZURE_CLIENT_ID: Your service principal client ID (for service principal)
 * - AZURE_CLIENT_SECRET: Your service principal secret (for service principal)
 * 
 * Or use Azure CLI authentication (az login)
 */

async function main() {
  // Configuration
  const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID || "";
  const resourceGroupName = "rg-storage-demo";
  const storageAccountName = `stgdemo${Date.now().toString().slice(-8)}`; // Must be globally unique, 3-24 lowercase alphanumeric
  const location = "eastus";

  if (!subscriptionId) {
    throw new Error("AZURE_SUBSCRIPTION_ID environment variable is required");
  }

  console.log("=== Azure Storage Account Management Demo ===\n");

  // Step 1: Authenticate using DefaultAzureCredential
  console.log("1. Authenticating with DefaultAzureCredential...");
  const credential = new DefaultAzureCredential();
  console.log("✓ Authentication successful\n");

  // Step 2: Create StorageManagementClient
  console.log("2. Creating StorageManagementClient...");
  const storageClient = new StorageManagementClient(credential, subscriptionId);
  console.log("✓ Client created successfully\n");

  try {
    // Step 3: Create a new Storage Account
    console.log("3. Creating Storage Account...");
    console.log(`   - Name: ${storageAccountName}`);
    console.log(`   - Resource Group: ${resourceGroupName}`);
    console.log(`   - Location: ${location}`);
    console.log(`   - SKU: Standard_LRS`);

    const createParameters: StorageAccountCreateParameters = {
      location: location,
      sku: {
        name: "Standard_LRS", // Locally redundant storage
      },
      kind: "StorageV2", // General-purpose v2 account
      properties: {
        accessTier: "Hot",
        supportsHttpsTrafficOnly: true,
        minimumTlsVersion: "TLS1_2",
        allowBlobPublicAccess: false,
      },
      tags: {
        environment: "demo",
        purpose: "management-plane-example",
      },
    };

    // Begin create operation (long-running operation)
    const createPoller = await storageClient.storageAccounts.beginCreateAndWait(
      resourceGroupName,
      storageAccountName,
      createParameters
    );

    console.log(`✓ Storage Account created: ${createPoller.name}`);
    console.log(`   - ID: ${createPoller.id}`);
    console.log(`   - Provisioning State: ${createPoller.properties?.provisioningState}\n`);

    // Step 4: List all Storage Accounts in the resource group
    console.log("4. Listing all Storage Accounts in resource group...");
    const storageAccounts: StorageAccount[] = [];
    
    // Using async iteration (for-await-of)
    for await (const account of storageClient.storageAccounts.listByResourceGroup(
      resourceGroupName
    )) {
      storageAccounts.push(account);
      console.log(`   - ${account.name} (${account.sku?.name}, ${account.location})`);
    }
    console.log(`✓ Found ${storageAccounts.length} storage account(s)\n`);

    // Step 5: Get properties of the created Storage Account
    console.log("5. Getting Storage Account properties...");
    const accountProperties = await storageClient.storageAccounts.getProperties(
      resourceGroupName,
      storageAccountName
    );

    console.log(`✓ Retrieved properties for: ${accountProperties.name}`);
    console.log(`   - Kind: ${accountProperties.kind}`);
    console.log(`   - SKU: ${accountProperties.sku?.name}`);
    console.log(`   - Location: ${accountProperties.location}`);
    console.log(`   - Primary Location: ${accountProperties.properties?.primaryLocation}`);
    console.log(`   - Status: ${accountProperties.properties?.statusOfPrimary}`);
    console.log(`   - Creation Time: ${accountProperties.properties?.creationTime}`);
    console.log(`   - HTTPS Only: ${accountProperties.properties?.supportsHttpsTrafficOnly}`);
    console.log(`   - Min TLS Version: ${accountProperties.properties?.minimumTlsVersion}`);
    console.log(`   - Blob Public Access: ${accountProperties.properties?.allowBlobPublicAccess}`);
    
    // Check current blob versioning status
    const blobServices = await storageClient.blobServices.getServiceProperties(
      resourceGroupName,
      storageAccountName,
      "default"
    );
    console.log(`   - Blob Versioning Enabled: ${blobServices.properties?.isVersioningEnabled || false}\n`);

    // Step 6: Update the account to enable blob versioning
    console.log("6. Updating Storage Account to enable blob versioning...");
    
    // Enable versioning through Blob Service properties
    await storageClient.blobServices.setServiceProperties(
      resourceGroupName,
      storageAccountName,
      "default",
      {
        properties: {
          isVersioningEnabled: true,
          deleteRetentionPolicy: {
            enabled: true,
            days: 7,
          },
        },
      }
    );

    console.log("✓ Blob versioning enabled");

    // Also update account tags to reflect the change
    const updateParameters: StorageAccountUpdateParameters = {
      tags: {
        environment: "demo",
        purpose: "management-plane-example",
        versioningEnabled: "true",
      },
    };

    const updatedAccount = await storageClient.storageAccounts.update(
      resourceGroupName,
      storageAccountName,
      updateParameters
    );

    console.log(`✓ Storage Account updated: ${updatedAccount.name}`);
    console.log(`   - Tags: ${JSON.stringify(updatedAccount.tags)}\n`);

    // Verify versioning is enabled
    const updatedBlobServices = await storageClient.blobServices.getServiceProperties(
      resourceGroupName,
      storageAccountName,
      "default"
    );
    console.log(`✓ Verified - Blob Versioning: ${updatedBlobServices.properties?.isVersioningEnabled}\n`);

    // Step 7: Delete the Storage Account
    console.log("7. Deleting Storage Account...");
    console.log(`   - This will permanently delete: ${storageAccountName}`);
    
    // Uncomment the following lines to actually delete the storage account
    // await storageClient.storageAccounts.delete(
    //   resourceGroupName,
    //   storageAccountName
    // );
    // console.log("✓ Storage Account deleted successfully\n");
    
    console.log("   ⚠ Delete operation commented out for safety");
    console.log("   Uncomment the delete lines to actually remove the storage account\n");

  } catch (error) {
    console.error("Error occurred:", error);
    throw error;
  }

  console.log("=== Demo completed successfully ===");
}

// Handle async execution
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
