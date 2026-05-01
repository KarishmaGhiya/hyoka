import { StorageManagementClient, type BlobServiceProperties } from "@azure/arm-storage";
import { DefaultAzureCredential } from "@azure/identity";

type Config = {
  subscriptionId: string;
  resourceGroupName: string;
  storageAccountName: string;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function generateStorageAccountName(): string {
  const suffix = Math.random().toString(36).slice(2, 15);
  return `st${suffix}`.slice(0, 24);
}

function loadConfig(): Config {
  return {
    subscriptionId: getRequiredEnv("AZURE_SUBSCRIPTION_ID"),
    resourceGroupName: getRequiredEnv("AZURE_RESOURCE_GROUP_NAME"),
    storageAccountName: process.env.AZURE_STORAGE_ACCOUNT_NAME ?? generateStorageAccountName(),
  };
}

function createBlobServiceUpdate(
  properties: BlobServiceProperties,
): BlobServiceProperties {
  return {
    changeFeed: properties.changeFeed,
    containerDeleteRetentionPolicy: properties.containerDeleteRetentionPolicy,
    cors: properties.cors,
    defaultServiceVersion: properties.defaultServiceVersion,
    deleteRetentionPolicy: properties.deleteRetentionPolicy,
    isVersioningEnabled: true,
    lastAccessTimeTrackingPolicy: properties.lastAccessTimeTrackingPolicy,
    restorePolicy: properties.restorePolicy,
  };
}

async function main(): Promise<void> {
  const config = loadConfig();
  const credential = new DefaultAzureCredential();
  const client = new StorageManagementClient(credential, config.subscriptionId);

  console.log(`Creating storage account "${config.storageAccountName}" in eastus...`);
  await client.storageAccounts.beginCreateAndWait(
    config.resourceGroupName,
    config.storageAccountName,
    {
      kind: "StorageV2",
      location: "eastus",
      sku: { name: "Standard_LRS" },
      allowBlobPublicAccess: false,
      enableHttpsTrafficOnly: true,
    },
  );

  try {
    console.log(`Listing storage accounts in resource group "${config.resourceGroupName}":`);
    for await (const account of client.storageAccounts.listByResourceGroup(
      config.resourceGroupName,
    )) {
      console.log(`- ${account.name} (${account.location})`);
    }

    const createdAccount = await client.storageAccounts.getProperties(
      config.resourceGroupName,
      config.storageAccountName,
    );
    console.log("Created account properties:", {
      id: createdAccount.id,
      kind: createdAccount.kind,
      location: createdAccount.location,
      primaryEndpoints: createdAccount.primaryEndpoints,
      sku: createdAccount.sku?.name,
    });

    const currentBlobService = await client.blobServices.getServiceProperties(
      config.resourceGroupName,
      config.storageAccountName,
    );

    // Blob versioning is managed through the Blob service resource in the management plane.
    const updatedBlobService = await client.blobServices.setServiceProperties(
      config.resourceGroupName,
      config.storageAccountName,
      createBlobServiceUpdate(currentBlobService),
    );

    console.log("Blob versioning enabled:", updatedBlobService.isVersioningEnabled);
  } finally {
    console.log(`Deleting storage account "${config.storageAccountName}"...`);
    await client.storageAccounts.delete(
      config.resourceGroupName,
      config.storageAccountName,
    );
    console.log("Storage account deleted.");
  }
}

main().catch((error: unknown) => {
  console.error("Storage account management sample failed.");
  console.error(error);
  process.exitCode = 1;
});
