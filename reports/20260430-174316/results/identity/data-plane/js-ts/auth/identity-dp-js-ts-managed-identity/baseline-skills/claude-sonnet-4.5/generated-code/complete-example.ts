/**
 * Complete Production-Ready Example
 * 
 * This demonstrates a full application using Managed Identity
 * with proper error handling, configuration, and fallback strategies.
 */

import {
  DefaultAzureCredential,
  ManagedIdentityCredential,
  TokenCredential,
} from "@azure/identity";
import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import { SecretClient } from "@azure/keyvault-secrets";
import { QueueClient } from "@azure/storage-queue";

/**
 * Configuration interface
 */
interface AppConfiguration {
  // Storage
  storageAccountName: string;
  storageContainerName: string;
  
  // Key Vault
  keyVaultName: string;
  
  // Queue
  queueName: string;
  
  // Identity
  userAssignedClientId?: string;
  
  // Environment
  environment: "development" | "staging" | "production";
}

/**
 * Main application service using Managed Identity
 */
export class AzureIntegratedService {
  private credential: TokenCredential;
  private config: AppConfiguration;
  
  private blobServiceClient: BlobServiceClient;
  private secretClient: SecretClient;
  private queueClient: QueueClient;

  constructor(config: AppConfiguration) {
    this.config = config;
    this.credential = this.initializeCredential();
    
    // Initialize Azure SDK clients
    this.blobServiceClient = new BlobServiceClient(
      `https://${config.storageAccountName}.blob.core.windows.net`,
      this.credential
    );
    
    this.secretClient = new SecretClient(
      `https://${config.keyVaultName}.vault.azure.net`,
      this.credential
    );
    
    this.queueClient = new QueueClient(
      `https://${config.storageAccountName}.queue.core.windows.net/${config.queueName}`,
      this.credential
    );
  }

  /**
   * Initialize credential with fallback strategy
   */
  private initializeCredential(): TokenCredential {
    // Production-ready credential initialization
    // Works in Azure, locally, and in CI/CD
    
    const options = this.config.userAssignedClientId
      ? { managedIdentityClientId: this.config.userAssignedClientId }
      : undefined;

    const credential = new DefaultAzureCredential(options);
    
    console.log(`Initialized credential for ${this.config.environment} environment`);
    if (this.config.userAssignedClientId) {
      console.log(`Using user-assigned identity: ${this.config.userAssignedClientId}`);
    }
    
    return credential;
  }

  /**
   * Validate authentication and permissions
   */
  async validateSetup(): Promise<boolean> {
    console.log("\n🔍 Validating Azure setup...\n");
    
    let allValid = true;

    // Test credential
    try {
      await this.credential.getToken("https://storage.azure.com/.default");
      console.log("✓ Credential authentication successful");
    } catch (error: any) {
      console.error("✗ Credential authentication failed:", error.message);
      allValid = false;
    }

    // Test Blob Storage access
    try {
      const containerClient = this.blobServiceClient.getContainerClient(
        this.config.storageContainerName
      );
      await containerClient.exists();
      console.log("✓ Blob Storage access successful");
    } catch (error: any) {
      console.error("✗ Blob Storage access failed:", error.message);
      allValid = false;
    }

    // Test Key Vault access
    try {
      // Just test connection, don't require specific secret
      const secretsIterator = this.secretClient.listPropertiesOfSecrets();
      await secretsIterator.next();
      console.log("✓ Key Vault access successful");
    } catch (error: any) {
      console.error("✗ Key Vault access failed:", error.message);
      allValid = false;
    }

    // Test Queue access
    try {
      await this.queueClient.exists();
      console.log("✓ Queue Storage access successful");
    } catch (error: any) {
      console.error("✗ Queue Storage access failed:", error.message);
      allValid = false;
    }

    console.log(allValid ? "\n✅ All validations passed!\n" : "\n❌ Some validations failed\n");
    return allValid;
  }

  /**
   * Example: Upload a file to blob storage
   */
  async uploadFile(fileName: string, content: string): Promise<string> {
    const containerClient = this.blobServiceClient.getContainerClient(
      this.config.storageContainerName
    );

    try {
      // Ensure container exists
      await containerClient.createIfNotExists();

      // Upload blob
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);
      await blockBlobClient.upload(content, content.length, {
        metadata: {
          uploadedAt: new Date().toISOString(),
          environment: this.config.environment,
        },
      });

      const url = blockBlobClient.url;
      console.log(`✓ Uploaded ${fileName} to ${url}`);
      return url;
    } catch (error: any) {
      console.error(`✗ Failed to upload ${fileName}:`, error.message);
      await this.handleStorageError(error);
      throw error;
    }
  }

  /**
   * Example: Retrieve a secret from Key Vault
   */
  async getSecret(secretName: string): Promise<string> {
    try {
      const secret = await this.secretClient.getSecret(secretName);
      console.log(`✓ Retrieved secret: ${secretName}`);
      return secret.value || "";
    } catch (error: any) {
      console.error(`✗ Failed to get secret ${secretName}:`, error.message);
      await this.handleKeyVaultError(error, secretName);
      throw error;
    }
  }

  /**
   * Example: Send a message to queue
   */
  async sendMessage(message: any): Promise<void> {
    try {
      const messageText = JSON.stringify(message);
      const result = await this.queueClient.sendMessage(messageText);
      console.log(`✓ Message sent, ID: ${result.messageId}`);
    } catch (error: any) {
      console.error("✗ Failed to send message:", error.message);
      await this.handleQueueError(error);
      throw error;
    }
  }

  /**
   * Example: Process files from storage
   */
  async processAllFiles(processor: (content: string, fileName: string) => Promise<void>): Promise<void> {
    const containerClient = this.blobServiceClient.getContainerClient(
      this.config.storageContainerName
    );

    try {
      console.log("Processing files...");
      let count = 0;

      for await (const blob of containerClient.listBlobsFlat()) {
        const blobClient = containerClient.getBlobClient(blob.name);
        const downloadResponse = await blobClient.download();
        const content = await this.streamToString(downloadResponse.readableStreamBody!);
        
        await processor(content, blob.name);
        count++;
      }

      console.log(`✓ Processed ${count} files`);
    } catch (error: any) {
      console.error("✗ Failed to process files:", error.message);
      throw error;
    }
  }

  /**
   * Error handling for Blob Storage
   */
  private async handleStorageError(error: any): Promise<void> {
    if (error.statusCode === 403) {
      console.error("\nRequired permission: 'Storage Blob Data Contributor'");
      console.error("Grant with:");
      console.error("  az role assignment create \\");
      console.error("    --role 'Storage Blob Data Contributor' \\");
      console.error("    --assignee <identity-principal-id> \\");
      console.error(`    --scope /subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.Storage/storageAccounts/${this.config.storageAccountName}`);
    } else if (error.code === "ContainerNotFound") {
      console.error(`\nContainer '${this.config.storageContainerName}' does not exist`);
      console.error("Create it or update configuration");
    }
  }

  /**
   * Error handling for Key Vault
   */
  private async handleKeyVaultError(error: any, secretName: string): Promise<void> {
    if (error.statusCode === 403) {
      console.error("\nRequired permission: 'Key Vault Secrets User'");
      console.error("Grant with:");
      console.error("  az role assignment create \\");
      console.error("    --role 'Key Vault Secrets User' \\");
      console.error("    --assignee <identity-principal-id> \\");
      console.error(`    --scope /subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.KeyVault/vaults/${this.config.keyVaultName}`);
    } else if (error.code === "SecretNotFound") {
      console.error(`\nSecret '${secretName}' not found in Key Vault`);
    }
  }

  /**
   * Error handling for Queue
   */
  private async handleQueueError(error: any): Promise<void> {
    if (error.statusCode === 403) {
      console.error("\nRequired permission: 'Storage Queue Data Contributor'");
    }
  }

  /**
   * Helper: Convert stream to string
   */
  private async streamToString(readableStream: NodeJS.ReadableStream): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: any[] = [];
      readableStream.on("data", (data) => chunks.push(data));
      readableStream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      readableStream.on("error", reject);
    });
  }
}

/**
 * Configuration loader with environment variable support
 */
export function loadConfiguration(): AppConfiguration {
  const config: AppConfiguration = {
    storageAccountName: process.env.AZURE_STORAGE_ACCOUNT_NAME || "",
    storageContainerName: process.env.AZURE_STORAGE_CONTAINER_NAME || "data",
    keyVaultName: process.env.AZURE_KEYVAULT_NAME || "",
    queueName: process.env.AZURE_QUEUE_NAME || "tasks",
    userAssignedClientId: process.env.AZURE_CLIENT_ID,
    environment: (process.env.NODE_ENV as any) || "development",
  };

  // Validate required configuration
  const required = ["storageAccountName", "keyVaultName"];
  const missing = required.filter(key => !config[key as keyof AppConfiguration]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(", ")}`);
  }

  return config;
}

/**
 * Main application entry point
 */
export async function main() {
  console.log("🚀 Starting Azure Integrated Service\n");

  try {
    // Load configuration
    const config = loadConfiguration();
    console.log("Configuration loaded:");
    console.log(`  Environment: ${config.environment}`);
    console.log(`  Storage Account: ${config.storageAccountName}`);
    console.log(`  Key Vault: ${config.keyVaultName}`);
    console.log(`  Queue: ${config.queueName}\n`);

    // Initialize service
    const service = new AzureIntegratedService(config);

    // Validate setup
    const isValid = await service.validateSetup();
    if (!isValid) {
      console.error("❌ Setup validation failed. Please fix the issues above.");
      process.exit(1);
    }

    // Example operations
    console.log("Performing example operations...\n");

    // Upload a file
    await service.uploadFile(
      "example.json",
      JSON.stringify({ message: "Hello from Managed Identity!", timestamp: new Date() })
    );

    // Get a secret (handle if it doesn't exist)
    try {
      const connectionString = await service.getSecret("database-connection");
      console.log("Retrieved connection string successfully");
    } catch (error) {
      console.log("(Secret not found - this is just an example)");
    }

    // Send a queue message
    await service.sendMessage({
      type: "example",
      data: "Test message",
      timestamp: new Date(),
    });

    console.log("\n✅ All operations completed successfully!");
  } catch (error: any) {
    console.error("\n❌ Application error:", error.message);
    console.error(error);
    process.exit(1);
  }
}

/**
 * Example: Using different identity types
 */
export async function identityTypeExamples() {
  // System-assigned identity
  console.log("Example 1: System-assigned identity");
  const systemConfig: AppConfiguration = {
    storageAccountName: "mystorage",
    storageContainerName: "data",
    keyVaultName: "mykeyvault",
    queueName: "tasks",
    environment: "production",
    // No userAssignedClientId - uses system-assigned
  };
  const systemService = new AzureIntegratedService(systemConfig);

  // User-assigned identity
  console.log("\nExample 2: User-assigned identity");
  const userConfig: AppConfiguration = {
    storageAccountName: "mystorage",
    storageContainerName: "data",
    keyVaultName: "mykeyvault",
    queueName: "tasks",
    environment: "production",
    userAssignedClientId: "12345678-1234-1234-1234-123456789abc",
  };
  const userService = new AzureIntegratedService(userConfig);

  // Both services work the same way!
  // The difference is in the identity configuration in Azure
}

// Export for use as a module
export { AppConfiguration, AzureIntegratedService };

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}
