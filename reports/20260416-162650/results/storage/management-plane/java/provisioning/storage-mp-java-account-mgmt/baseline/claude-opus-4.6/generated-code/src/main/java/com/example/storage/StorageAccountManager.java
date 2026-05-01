package com.example.storage;

import com.azure.core.credential.TokenCredential;
import com.azure.core.management.AzureEnvironment;
import com.azure.core.management.Region;
import com.azure.core.management.exception.ManagementException;
import com.azure.core.management.profile.AzureProfile;
import com.azure.identity.DefaultAzureCredentialBuilder;
import com.azure.resourcemanager.storage.StorageManager;
import com.azure.resourcemanager.storage.models.BlobServiceProperties;
import com.azure.resourcemanager.storage.models.Kind;
import com.azure.resourcemanager.storage.models.SkuName;
import com.azure.resourcemanager.storage.models.StorageAccount;

/**
 * Demonstrates Azure Storage Account management operations using the
 * Azure Resource Manager Storage SDK.
 */
public class StorageAccountManager {

    private final StorageManager storageManager;

    /**
     * Creates a StorageAccountManager using DefaultAzureCredential and the given subscription.
     *
     * @param subscriptionId the Azure subscription ID
     */
    public StorageAccountManager(String subscriptionId) {
        // Step 1: Authenticate using DefaultAzureCredential
        TokenCredential credential = new DefaultAzureCredentialBuilder().build();

        AzureProfile profile = new AzureProfile(
            null, // tenantId — resolved automatically by DefaultAzureCredential
            subscriptionId,
            AzureEnvironment.AZURE
        );

        // Step 2: Create a StorageManager instance
        this.storageManager = StorageManager.authenticate(credential, profile);
    }

    /**
     * Creates a new Storage Account with Standard_LRS SKU in the "eastus" region.
     *
     * @param resourceGroupName the resource group in which to create the account
     * @param accountName       the globally unique storage account name (3-24 lowercase alphanumeric)
     * @return the created StorageAccount
     */
    public StorageAccount createStorageAccount(String resourceGroupName, String accountName) {
        System.out.printf("Creating storage account '%s' in resource group '%s'...%n",
            accountName, resourceGroupName);

        try {
            StorageAccount account = storageManager.storageAccounts()
                .define(accountName)
                .withRegion(Region.US_EAST)
                .withExistingResourceGroup(resourceGroupName)
                .withSku(SkuName.STANDARD_LRS)
                .withKind(Kind.STORAGE_V2)
                .withTag("environment", "development")
                .withTag("managedBy", "java-sdk")
                .create();

            System.out.printf("Storage account created successfully.%n");
            System.out.printf("  ID:       %s%n", account.id());
            System.out.printf("  Region:   %s%n", account.regionName());
            System.out.printf("  SKU:      %s%n", account.skuType().name());
            System.out.printf("  Kind:     %s%n", account.kind());

            return account;
        } catch (ManagementException e) {
            System.err.printf("Failed to create storage account: %s (Code: %s)%n",
                e.getMessage(), e.getValue().getCode());
            throw e;
        }
    }

    /**
     * Lists all Storage Accounts in the specified resource group.
     *
     * @param resourceGroupName the resource group to list accounts from
     */
    public void listStorageAccounts(String resourceGroupName) {
        System.out.printf("%nListing storage accounts in resource group '%s':%n", resourceGroupName);

        try {
            storageManager.storageAccounts()
                .listByResourceGroup(resourceGroupName)
                .forEach(account ->
                    System.out.printf("  - %s (SKU: %s, Region: %s, Kind: %s)%n",
                        account.name(),
                        account.skuType().name(),
                        account.regionName(),
                        account.kind())
                );
        } catch (ManagementException e) {
            System.err.printf("Failed to list storage accounts: %s (Code: %s)%n",
                e.getMessage(), e.getValue().getCode());
            throw e;
        }
    }

    /**
     * Gets the properties of an existing Storage Account.
     *
     * @param resourceGroupName the resource group containing the account
     * @param accountName       the storage account name
     * @return the StorageAccount, or null if not found
     */
    public StorageAccount getStorageAccount(String resourceGroupName, String accountName) {
        System.out.printf("%nGetting properties for storage account '%s'...%n", accountName);

        try {
            StorageAccount account = storageManager.storageAccounts()
                .getByResourceGroup(resourceGroupName, accountName);

            if (account == null) {
                System.out.printf("Storage account '%s' not found.%n", accountName);
                return null;
            }

            System.out.printf("  Name:              %s%n", account.name());
            System.out.printf("  ID:                %s%n", account.id());
            System.out.printf("  Region:            %s%n", account.regionName());
            System.out.printf("  SKU:               %s%n", account.skuType().name());
            System.out.printf("  Kind:              %s%n", account.kind());
            System.out.printf("  Provisioning State: %s%n", account.provisioningState());
            System.out.printf("  Creation Time:     %s%n", account.creationTime());
            System.out.printf("  Access Tier:       %s%n", account.accessTier());
            System.out.printf("  Tags:              %s%n", account.tags());

            return account;
        } catch (ManagementException e) {
            System.err.printf("Failed to get storage account: %s (Code: %s)%n",
                e.getMessage(), e.getValue().getCode());
            throw e;
        }
    }

    /**
     * Enables blob versioning on the specified Storage Account by updating
     * its Blob Service properties.
     *
     * @param resourceGroupName the resource group containing the account
     * @param accountName       the storage account name
     */
    public void enableBlobVersioning(String resourceGroupName, String accountName) {
        System.out.printf("%nEnabling blob versioning for storage account '%s'...%n", accountName);

        try {
            BlobServiceProperties blobServiceProperties = storageManager.blobServices()
                .define("default")
                .withExistingStorageAccount(resourceGroupName, accountName)
                .withIsVersioningEnabled(true)
                .create();

            System.out.printf("Blob versioning enabled: %s%n",
                blobServiceProperties.isVersioningEnabled());
        } catch (ManagementException e) {
            System.err.printf("Failed to enable blob versioning: %s (Code: %s)%n",
                e.getMessage(), e.getValue().getCode());
            throw e;
        }
    }

    /**
     * Deletes a Storage Account.
     *
     * @param resourceGroupName the resource group containing the account
     * @param accountName       the storage account name
     */
    public void deleteStorageAccount(String resourceGroupName, String accountName) {
        System.out.printf("%nDeleting storage account '%s'...%n", accountName);

        try {
            storageManager.storageAccounts()
                .deleteByResourceGroup(resourceGroupName, accountName);

            System.out.printf("Storage account '%s' deleted successfully.%n", accountName);
        } catch (ManagementException e) {
            System.err.printf("Failed to delete storage account: %s (Code: %s)%n",
                e.getMessage(), e.getValue().getCode());
            throw e;
        }
    }

    /**
     * Runs the full lifecycle: create → list → get → update → delete.
     */
    public static void main(String[] args) {
        if (args.length < 3) {
            System.err.println("Usage: StorageAccountManager <subscriptionId> <resourceGroupName> <accountName>");
            System.err.println();
            System.err.println("  subscriptionId   - Azure subscription ID");
            System.err.println("  resourceGroupName - Existing resource group name");
            System.err.println("  accountName       - Globally unique storage account name (3-24 lowercase alphanumeric)");
            System.exit(1);
        }

        String subscriptionId = args[0];
        String resourceGroupName = args[1];
        String accountName = args[2];

        StorageAccountManager manager = new StorageAccountManager(subscriptionId);

        try {
            // Step 3: Create a new Storage Account
            manager.createStorageAccount(resourceGroupName, accountName);

            // Step 4: List all Storage Accounts in the resource group
            manager.listStorageAccounts(resourceGroupName);

            // Step 5: Get properties of the created Storage Account
            manager.getStorageAccount(resourceGroupName, accountName);

            // Step 6: Enable blob versioning
            manager.enableBlobVersioning(resourceGroupName, accountName);

            // Step 7: Delete the Storage Account
            manager.deleteStorageAccount(resourceGroupName, accountName);

            System.out.printf("%nAll operations completed successfully.%n");
        } catch (ManagementException e) {
            System.err.printf("%nOperation failed with Azure error:%n");
            System.err.printf("  Code:    %s%n", e.getValue().getCode());
            System.err.printf("  Message: %s%n", e.getValue().getMessage());
            System.exit(1);
        } catch (Exception e) {
            System.err.printf("%nUnexpected error: %s%n", e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }
}
