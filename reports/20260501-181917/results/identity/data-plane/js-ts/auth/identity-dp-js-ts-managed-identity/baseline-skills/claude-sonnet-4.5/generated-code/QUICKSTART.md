# Quick Start Guide

## What This Demo Shows

✅ **System-Assigned Managed Identity** - Automatically assigned to Azure resources
✅ **User-Assigned Managed Identity** - Specific identity with client ID  
✅ **ChainedTokenCredential** - Falls back from Managed Identity → Azure CLI
✅ **Azure SDK Integration** - Pass credential to BlobServiceClient
✅ **Error Handling** - Catches CredentialUnavailableError properly

## Running the Demo

### Option 1: Development Mode (fastest)
```bash
npm install
npm run dev
```

### Option 2: Build and Run
```bash
npm install
npm run build
npm start
```

## Expected Output

The demo successfully demonstrates:
1. ✓ System-assigned identity creation (unavailable in local env)
2. ✓ User-assigned identity creation (unavailable in local env)
3. ✓ ChainedTokenCredential **successfully acquires token** via Azure CLI fallback
4. ✓ Creates BlobServiceClient with the credential
5. ✓ Error handling patterns

## Key Code Patterns

### 1. System-Assigned Managed Identity
```typescript
const credential = new ManagedIdentityCredential();
```

### 2. User-Assigned Managed Identity
```typescript
const credential = new ManagedIdentityCredential({
  clientId: "your-client-id"
});
```

### 3. ChainedTokenCredential (Best for Dev + Prod)
```typescript
const credential = new ChainedTokenCredential(
  new ManagedIdentityCredential(),  // Azure
  new AzureCliCredential()           // Local dev
);
```

### 4. Error Handling
```typescript
try {
  const token = await credential.getToken(scope);
} catch (error) {
  if (error instanceof CredentialUnavailableError) {
    // Handle unavailable credential
  }
}
```

### 5. Use with Azure SDK
```typescript
const blobClient = new BlobServiceClient(url, credential);
```

## Configuration

Set these environment variables for full demo:

```bash
# For user-assigned identity
export AZURE_USER_ASSIGNED_CLIENT_ID="your-client-id"

# For storage demo (must be a real storage account)
export AZURE_STORAGE_ACCOUNT_URL="https://youraccount.blob.core.windows.net"
```

## Next Steps

1. **Test locally**: Run with `az login` for Azure CLI credentials
2. **Deploy to Azure**: Enable managed identity on VM/App Service
3. **Grant permissions**: Assign RBAC roles to the identity
4. **Update URLs**: Replace placeholder storage account with real one

## Files Created

- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `src/index.ts` - Main demo code (all patterns)
- `README.md` - Full documentation
- `.gitignore` - Ignore node_modules and dist

All requirements fulfilled! 🎉
