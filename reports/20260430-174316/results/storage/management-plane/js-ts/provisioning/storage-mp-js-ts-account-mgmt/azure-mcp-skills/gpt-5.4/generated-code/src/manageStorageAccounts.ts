import { DefaultAzureCredential } from "@azure/identity";
import {
  StorageManagementClient,
  type BlobServiceProperties,
  type StorageAccountCreateParameters,
} from "@azure/arm-storage";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function generateStorageAccountName(): string {
  const timestamp = Date.now().toString(36);
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return `st${timestamp}${randomSuffix}`.slice(0, 24);
}

function toBlobServiceUpdate(properties: BlobServiceProperties): BlobServiceProperties {
  return {
    automaticSnapshotPolicyEnabled: properties.automaticSnapshotPolicyEnabled,
    changeFeed: properties.changeFeed,
    containerDeleteRetentionPolicy: properties.containerDeleteRetentionPolicy,
    cors: properties.cors,
    defaultServiceVersion: properties.defaultServiceVersion,
    deleteRetentionPolicy: properties.deleteRetentionPolicy,
    lastAccessTimeTrackingPolicy: properties.lastAccessTimeTrackingPolicy,
    restorePolicy: properties.restorePolicy,
  };
}

async function main(): Promise<void> {
  const subscriptionId = requireEnv("AZURE_SUBSCRIPTION_ID");
  const resourceGroupName = requireEnv("AZURE_RESOURCE_GROUP_NAME");
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME ?? generateStorageAccountName();
  const location = "eastus";

  const credential = new DefaultAzureCredential();
  const client = new StorageManagementClient(credential, subscriptionId);

  const createParameters: StorageAccountCreateParameters = {
    location,
    kind: "StorageV2",
    sku: { name: "Standard_LRS" },
    enableHttpsTrafficOnly: true,
    allowBlobPublicAccess: false,
    minimumTlsVersion: "TLS1_2",
  };

  let created = false;

  try {
    console.log(`Creating storage account "${accountName}" in ${location}...`);
    const createdAccount = await client.storageAccounts.beginCreateAndWait(
      resourceGroupName,
      accountName,
      createParameters,
    );
    created = true;
    console.log(`Created: ${createdAccount.id}`);

    console.log(`\nListing storage accounts in resource group "${resourceGroupName}":`);
    for await (const account of client.storageAccounts.listByResourceGroup(resourceGroupName)) {
      console.log(`- ${account.name} (${account.location})`);
    }

    console.log(`\nGetting properties for "${accountName}"...`);
    const accountProperties = await client.storageAccounts.getProperties(resourceGroupName, accountName);
    console.log(JSON.stringify(accountProperties, null, 2));

    console.log(`\nEnabling blob versioning for "${accountName}"...`);
    const currentBlobServiceProperties = await client.blobServices.getServiceProperties(
      resourceGroupName,
      accountName,
    );
    const updatedBlobServiceProperties = await client.blobServices.setServiceProperties(
      resourceGroupName,
      accountName,
      {
        ...toBlobServiceUpdate(currentBlobServiceProperties),
        isVersioningEnabled: true,
      },
    );
    console.log(`Blob versioning enabled: ${updatedBlobServiceProperties.isVersioningEnabled === true}`);
  } finally {
    if (created) {
      console.log(`\nDeleting storage account "${accountName}"...`);
      await client.storageAccounts.delete(resourceGroupName, accountName);
      console.log("Storage account deleted.");
    }
  }
}

main().catch((error: unknown) => {
  console.error("Storage account management sample failed.");
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }
  process.exitCode = 1;
});
