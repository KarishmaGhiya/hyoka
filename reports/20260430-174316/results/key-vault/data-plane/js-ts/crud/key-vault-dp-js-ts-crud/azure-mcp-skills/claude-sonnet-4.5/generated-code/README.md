# Azure Key Vault CRUD Operations Demo

A TypeScript project demonstrating all four CRUD operations on Azure Key Vault secrets using the Azure SDK.

## Features

- ✅ **Create** - Create a new secret with initial value
- ✅ **Read** - Retrieve and display secret value
- ✅ **Update** - Update secret to new value
- ✅ **Delete** - Soft delete and purge secret

## Prerequisites

1. **Azure Key Vault** - You need an existing Key Vault with soft-delete enabled
2. **Azure Authentication** - Sign in using Azure CLI:
   ```bash
   az login
   ```
3. **Permissions** - Your account needs these Key Vault permissions:
   - Secrets: Get, Set, Delete, Purge

## Required npm Packages

```json
{
  "dependencies": {
    "@azure/identity": "^4.0.0",
    "@azure/keyvault-secrets": "^4.8.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.3"
  }
}
```

## Installation

```bash
npm install
```

## Configuration

Set the Key Vault name as an environment variable:

**Windows (PowerShell):**
```powershell
$env:KEY_VAULT_NAME="your-keyvault-name"
```

**Windows (CMD):**
```cmd
set KEY_VAULT_NAME=your-keyvault-name
```

**Linux/Mac:**
```bash
export KEY_VAULT_NAME=your-keyvault-name
```

## Usage

### Build and run:
```bash
npm run build
npm start
```

### Run directly with ts-node:
```bash
npm run dev
```

## How It Works

### 1. Authentication
Uses `DefaultAzureCredential` which automatically tries multiple authentication methods in order:
- Environment variables
- Managed Identity
- Azure CLI
- Azure PowerShell
- Interactive browser

### 2. CRUD Operations

**CREATE:**
```typescript
const createResult = await client.setSecret(secretName, initialValue);
```

**READ:**
```typescript
const readResult = await client.getSecret(secretName);
console.log(readResult.value);
```

**UPDATE:**
```typescript
const updateResult = await client.setSecret(secretName, updatedValue);
```

**DELETE & PURGE:**
```typescript
const deletePoller = await client.beginDeleteSecret(secretName);
await deletePoller.pollUntilDone();
await client.purgeDeletedSecret(secretName);
```

## Error Handling

The script includes comprehensive error handling:
- Try/catch blocks around all operations
- Specific error messages and status codes
- Graceful exit on failure
- Stack traces for debugging

## Expected Output

```
🔐 Connecting to Key Vault: https://your-keyvault.vault.azure.net

📝 Step 1: Creating secret...
✅ Secret created: my-secret
   Version: abc123...
   Created: 2026-04-30...

📖 Step 2: Reading secret...
✅ Secret retrieved: my-secret
   Value: my-secret-value
   Version: abc123...

✏️  Step 3: Updating secret...
✅ Secret updated: my-secret
   New version: def456...
   Updated: 2026-04-30...
   New value: updated-value

🗑️  Step 4: Deleting secret...
✅ Secret deleted: my-secret
   Scheduled purge date: 2026-05-30...
   Deleted on: 2026-04-30...

🔥 Purging deleted secret (permanent deletion)...
✅ Secret purged permanently: my-secret

✨ All CRUD operations completed successfully!
```

## Troubleshooting

**Authentication Error:**
- Ensure you're logged in: `az login`
- Check your Azure account has access to the Key Vault

**Permission Denied:**
- Verify Key Vault access policies include your user account
- Required permissions: Get, Set, Delete, Purge secrets

**Key Vault Not Found:**
- Verify `KEY_VAULT_NAME` environment variable is set correctly
- Ensure the Key Vault exists and is accessible

## Notes

- The Key Vault must have **soft-delete** enabled to use purge operations
- Each `setSecret` call creates a new version of the secret
- Purging permanently deletes the secret and cannot be recovered
- DefaultAzureCredential works seamlessly in local development and Azure-hosted environments
