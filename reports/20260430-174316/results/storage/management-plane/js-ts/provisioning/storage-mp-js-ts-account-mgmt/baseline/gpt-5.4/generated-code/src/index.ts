import { DefaultAzureCredential } from "@azure/identity";
import {
  StorageAccountCreateParameters,
  StorageManagementClient,
} from "@azure/arm-storage";

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function buildStorageAccountName(): string {
  const prefix = (process.env.AZURE_STORAGE_ACCOUNT_PREFIX ?? "stsample")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 10);
  const suffix = Math.random().toString(36).slice(2, 14);
  const accountName = `${prefix}${suffix}`.slice(0, 24);

  if (accountName.length < 3) {
    throw new Error("Generated storage account name is too short.");
  }

  return accountName;
}

async function main(): Promise<void> {
  const subscriptionId = requireEnvironmentVariable("AZURE_SUBSCRIPTION_ID");
  const resourceGroupName = requireEnvironmentVariable("AZURE_RESOURCE_GROUP_NAME");
  const accountName = buildStorageAccountName();

  const credential = new DefaultAzureCredential();
  const client = new StorageManagementClient(credential, subscriptionId);

  const createParameters: StorageAccountCreateParameters = {
    location: "eastus",
    sku: { name: "Standard_LRS" },
    kind: "StorageV2",
  };

  console.log(`Creating storage account: ${accountName}`);
  const createdAccount = await client.storageAccounts.beginCreateAndWait(
    resourceGroupName,
    accountName,
    createParameters,
  );
  console.log(`Created storage account with id: ${createdAccount.id}`);

  console.log(`Listing storage accounts in resource group: ${resourceGroupName}`);
  for await (const account of client.storageAccounts.listByResourceGroup(resourceGroupName)) {
    console.log(`- ${account.name}`);
  }

  const accountProperties = await client.storageAccounts.getProperties(
    resourceGroupName,
    accountName,
  );
  console.log("Created account properties:");
  console.log({
    id: accountProperties.id,
    name: accountProperties.name,
    location: accountProperties.location,
    primaryEndpoints: accountProperties.primaryEndpoints,
    provisioningState: accountProperties.provisioningState,
    sku: accountProperties.sku?.name,
  });

  const blobServiceProperties = await client.blobServices.getServiceProperties(
    resourceGroupName,
    accountName,
  );

  const updatedBlobService = await client.blobServices.setServiceProperties(
    resourceGroupName,
    accountName,
    {
      ...blobServiceProperties,
      isVersioningEnabled: true,
    },
  );
  console.log(
    `Blob versioning enabled: ${updatedBlobService.isVersioningEnabled === true}`,
  );

  console.log(`Deleting storage account: ${accountName}`);
  await client.storageAccounts.delete(resourceGroupName, accountName);
  console.log(`Deleted storage account: ${accountName}`);
}

main().catch((error: unknown) => {
  console.error("Storage account management sample failed.");
  console.error(error);
  process.exitCode = 1;
});
