# Evaluation Report: storage-mp-js-ts-account-mgmt

**Config:** baseline/claude-opus-4.6 | **Result:** ❌ FAILED | **Duration:** 164.6s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `storage-mp-js-ts-account-mgmt` |
| Config | baseline/claude-opus-4.6 |
| Result | ❌ FAILED |
| Score | 19/10 |
| Duration | 164.6s |
| Timestamp | 2026-05-01T23:23:59Z |
| Files Generated | 4 |
| Event Count | 174 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 116.9s |
| Review | 47.6s |
| **Total** | **164.6s** |

## Configuration

- **name:** baseline/claude-opus-4.6
- **model:** claude-opus-4.6

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-opus-4.6 |
| Skills Loaded | customize-cloud-agent |
| Skills Invoked | azure-identity-ts |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=233571 out=5252 |
| Turn Count | 11 |

## Prompt Sent

```
Write a TypeScript program
that manages Azure Storage Accounts using the management plane SDK:
1. Authenticate using DefaultAzureCredential from @azure/identity
2. Create a StorageManagementClient with the credential and subscription ID
3. Create a new Storage Account with Standard_LRS SKU in "eastus"
4. List all Storage Accounts in a resource group using async iteration
5. Get the properties of the created Storage Account
6. Update the account to enable blob versioning
7. Delete the Storage Account

Show required npm packages (@azure/arm-storage) and proper async/await patterns.
```

## Copilot Reasoning

The user wants a TypeScript program for managing Azure Storage Accounts using the management plane SDK. Let me first check the azure-identity-ts skill since it's relevant for authentication, then create the program.

Let me create the TypeScript program for managing Azure Storage Accounts.

## Tool Calls

### 🔧 1. skill

**Input:**

```json
{"skill":"azure-identity-ts"}
```

### 🔧 2. report_intent

**Input:**

```json
{"intent":"Creating storage management program"}
```

### 🔧 3. view

**Input:**

```json
{"path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-mp-js-ts-account-mgmt-baseline-claude-opus-4.6-576538213"}
```

### 🔧 4. powershell

**Input:**

```json
{"command":"cd \"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-mp-js-ts-account-mgmt-baseline-claude-opus-4.6-576538213\" \u0026\u0026 npm init -y 2\u003e\u00261 | Select-Object -Last 3","description":"Initialize npm project"}
```

### 🔧 5. powershell

**Input:**

```json
{"command":"cd \"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-mp-js-ts-account-mgmt-baseline-claude-opus-4.6-576538213\" \u0026\u0026 npm install @azure/arm-storage @azure/identity typescript @types/node --save 2\u003e\u00261 | Select-Object -Last 5","description":"Install dependencies","initial_wait":60}
```

### 🔧 6. create

**Input:**

```json
{"file_text":"{\n  \"compilerOptions\": {\n    \"target\": \"ES2020\",\n    \"module\": \"commonjs\",\n    \"lib\": [\"ES2020\"],\n    \"strict\": true,\n    \"esModuleInterop\": true,\n    \"skipLibCheck\": true,\n    \"forceConsistentCasingInFileNames\": true,\n    \"outDir\": \"./dist\",\n    \"rootDir\": \"./src\",\n    \"declaration\": true,\n    \"resolveJsonModule\": true\n  },\n  \"include\": [\"src/**/*\"]\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-mp-js-ts-account-mgmt-baseline-claude-opus-4.6-576538213\\tsconfig.json"}
```

### 🔧 7. create

**Input:**

```json
{"file_text":"import { DefaultAzureCredential } from \"@azure/identity\";\nimport {\n  StorageManagementClient,\n  StorageAccount,\n  StorageAccountCreateParameters,\n  StorageAccountUpdateParameters,\n  BlobServiceProperties,\n} from \"@azure/arm-storage\";\n\n// Configuration — supply via environment variables or replace with your values\nconst subscriptionId = process.env.AZURE_SUBSCRIPTION_ID || \"\u003csubscription-id\u003e\";\nconst resourceGroupName = process.env.AZURE_RESOURCE_GROUP || \"\u003cresource-group\u003e\";\nconst accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || \"mystorageacct\" + Date.now().toString().slice(-6);\nconst location = \"eastus\";\n\nasync function main(): Promise\u003cvoid\u003e {\n  // 1. Authenticate using DefaultAzureCredential\n  //    Tries env vars → managed identity → VS Code → Azure CLI → PowerShell\n  const credential = new DefaultAzureCredential();\n\n  // 2. Create the StorageManagementClient\n  const client = new StorageManagementClient(credential, subscriptionId);\n\n  // 3. Create a new Storage Account (Standard_LRS in eastus)\n  await createStorageAccount(client);\n\n  // 4. List all Storage Accounts in the resource group\n  await listStorageAccounts(client);\n\n  // 5. Get the properties of the created Storage Account\n  await getStorageAccountProperties(client);\n\n  // 6. Update the account to enable blob versioning\n  await enableBlobVersioning(client);\n\n  // 7. Delete the Storage Account\n  await deleteStorageAccount(client);\n}\n\n// ---------------------------------------------------------------------------\n// 3. Create a new Storage Account\n// ---------------------------------------------------------------------------\nasync function createStorageAccount(client: StorageManagementClient): Promise\u003cvoid\u003e {\n  console.log(`\\n--- Creating Storage Account: ${accountName} ---`);\n\n  const createParams: StorageAccountCreateParameters = {\n    location,\n    sku: { name: \"Standard_LRS\" },\n    kind: \"StorageV2\",\n    tags: {\n      environment: \"demo\",\n      createdBy: \"azure-sdk-ts\",\n    },\n  };\n\n  // beginCreateAndWait polls until the long-running operation completes\n  const account: StorageAccount = await client.storageAccounts.beginCreateAndWait(\n    resourceGroupName,\n    accountName,\n    createParams\n  );\n\n  console.log(`Created: ${account.name} (provisioning state: ${account.provisioningState})`);\n  console.log(`  ID:       ${account.id}`);\n  console.log(`  Location: ${account.location}`);\n  console.log(`  Kind:     ${account.kind}`);\n  console.log(`  SKU:      ${account.sku?.name}`);\n}\n\n// ---------------------------------------------------------------------------\n// 4. List all Storage Accounts in a resource group (async iteration)\n// ---------------------------------------------------------------------------\nasync function listStorageAccounts(client: StorageManagementClient): Promise\u003cvoid\u003e {\n  console.log(`\\n--- Listing Storage Accounts in \"${resourceGroupName}\" ---`);\n\n  // The SDK returns an AsyncIterableIterator — use for-await-of\n  let count = 0;\n  for await (const account of client.storageAccounts.listByResourceGroup(resourceGroupName)) {\n    count++;\n    console.log(`  [${count}] ${account.name} — ${account.location} (${account.sku?.name})`);\n  }\n\n  console.log(`Total accounts: ${count}`);\n}\n\n// ---------------------------------------------------------------------------\n// 5. Get Storage Account properties\n// ---------------------------------------------------------------------------\nasync function getStorageAccountProperties(client: StorageManagementClient): Promise\u003cvoid\u003e {\n  console.log(`\\n--- Getting Properties of \"${accountName}\" ---`);\n\n  const account: StorageAccount = await client.storageAccounts.getProperties(\n    resourceGroupName,\n    accountName\n  );\n\n  console.log(`  Name:               ${account.name}`);\n  console.log(`  Provisioning State: ${account.provisioningState}`);\n  console.log(`  Primary Location:   ${account.primaryLocation}`);\n  console.log(`  Status:             ${account.statusOfPrimary}`);\n  console.log(`  Creation Time:      ${account.creationTime}`);\n  console.log(`  Access Tier:        ${account.accessTier}`);\n  console.log(`  Primary Endpoints:`);\n  console.log(`    Blob:  ${account.primaryEndpoints?.blob}`);\n  console.log(`    File:  ${account.primaryEndpoints?.file}`);\n  console.log(`    Queue: ${account.primaryEndpoints?.queue}`);\n  console.log(`    Table: ${account.primaryEndpoints?.table}`);\n}\n\n// ---------------------------------------------------------------------------\n// 6. Update the account to enable blob versioning\n// ---------------------------------------------------------------------------\nasync function enableBlobVersioning(client: StorageManagementClient): Promise\u003cvoid\u003e {\n  console.log(`\\n--- Enabling Blob Versioning on \"${accountName}\" ---`);\n\n  // Blob versioning is a property of the Blob Service, not the account itself.\n  // Use blobServices.setServiceProperties to enable it.\n  const blobServiceProperties: BlobServiceProperties = {\n    isVersioningEnabled: true,\n  };\n\n  const result = await client.blobServices.setServiceProperties(\n    resourceGroupName,\n    accountName,\n    blobServiceProperties\n  );\n\n  console.log(`  Versioning enabled: ${result.isVersioningEnabled}`);\n\n  // Optionally, also update account-level tags to record the change\n  const updateParams: StorageAccountUpdateParameters = {\n    tags: {\n      environment: \"demo\",\n      createdBy: \"azure-sdk-ts\",\n      blobVersioning: \"enabled\",\n    },\n  };\n\n  const updated = await client.storageAccounts.update(\n    resourceGroupName,\n    accountName,\n    updateParams\n  );\n\n  console.log(`  Updated tags: ${JSON.stringify(updated.tags)}`);\n}\n\n// ---------------------------------------------------------------------------\n// 7. Delete the Storage Account\n// ---------------------------------------------------------------------------\nasync function deleteStorageAccount(client: StorageManagementClient): Promise\u003cvoid\u003e {\n  console.log(`\\n--- Deleting Storage Account: ${accountName} ---`);\n\n  await client.storageAccounts.delete(resourceGroupName, accountName);\n\n  console.log(`  Deleted successfully.`);\n}\n\n// ---------------------------------------------------------------------------\n// Entry point\n// ---------------------------------------------------------------------------\nmain().catch((err: Error) =\u003e {\n  console.error(\"Error:\", err.message);\n  process.exit(1);\n});\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-mp-js-ts-account-mgmt-baseline-claude-opus-4.6-576538213\\src\\manageStorageAccount.ts"}
```

### 🔧 8. powershell

**Input:**

```json
{"command":"New-Item -ItemType Directory -Path \"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-mp-js-ts-account-mgmt-baseline-claude-opus-4.6-576538213\\src\" -Force | Out-Null","description":"Create src directory"}
```

### 🔧 9. create

**Input:**

```json
{"file_text":"import { DefaultAzureCredential } from \"@azure/identity\";\nimport {\n  StorageManagementClient,\n  StorageAccount,\n  StorageAccountCreateParameters,\n  StorageAccountUpdateParameters,\n  BlobServiceProperties,\n} from \"@azure/arm-storage\";\n\n// Configuration — supply via environment variables or replace with your values\nconst subscriptionId = process.env.AZURE_SUBSCRIPTION_ID || \"\u003csubscription-id\u003e\";\nconst resourceGroupName = process.env.AZURE_RESOURCE_GROUP || \"\u003cresource-group\u003e\";\nconst accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || \"mystorageacct\" + Date.now().toString().slice(-6);\nconst location = \"eastus\";\n\nasync function main(): Promise\u003cvoid\u003e {\n  // 1. Authenticate using DefaultAzureCredential\n  //    Tries env vars → managed identity → VS Code → Azure CLI → PowerShell\n  const credential = new DefaultAzureCredential();\n\n  // 2. Create the StorageManagementClient\n  const client = new StorageManagementClient(credential, subscriptionId);\n\n  // 3. Create a new Storage Account (Standard_LRS in eastus)\n  await createStorageAccount(client);\n\n  // 4. List all Storage Accounts in the resource group\n  await listStorageAccounts(client);\n\n  // 5. Get the properties of the created Storage Account\n  await getStorageAccountProperties(client);\n\n  // 6. Update the account to enable blob versioning\n  await enableBlobVersioning(client);\n\n  // 7. Delete the Storage Account\n  await deleteStorageAccount(client);\n}\n\n// ---------------------------------------------------------------------------\n// 3. Create a new Storage Account\n// ---------------------------------------------------------------------------\nasync function createStorageAccount(client: StorageManagementClient): Promise\u003cvoid\u003e {\n  console.log(`\\n--- Creating Storage Account: ${accountName} ---`);\n\n  const createParams: StorageAccountCreateParameters = {\n    location,\n    sku: { name: \"Standard_LRS\" },\n    kind: \"StorageV2\",\n    tags: {\n      environment: \"demo\",\n      createdBy: \"azure-sdk-ts\",\n    },\n  };\n\n  // beginCreateAndWait polls until the long-running operation completes\n  const account: StorageAccount = await client.storageAccounts.beginCreateAndWait(\n    resourceGroupName,\n    accountName,\n    createParams\n  );\n\n  console.log(`Created: ${account.name} (provisioning state: ${account.provisioningState})`);\n  console.log(`  ID:       ${account.id}`);\n  console.log(`  Location: ${account.location}`);\n  console.log(`  Kind:     ${account.kind}`);\n  console.log(`  SKU:      ${account.sku?.name}`);\n}\n\n// ---------------------------------------------------------------------------\n// 4. List all Storage Accounts in a resource group (async iteration)\n// ---------------------------------------------------------------------------\nasync function listStorageAccounts(client: StorageManagementClient): Promise\u003cvoid\u003e {\n  console.log(`\\n--- Listing Storage Accounts in \"${resourceGroupName}\" ---`);\n\n  // The SDK returns an AsyncIterableIterator — use for-await-of\n  let count = 0;\n  for await (const account of client.storageAccounts.listByResourceGroup(resourceGroupName)) {\n    count++;\n    console.log(`  [${count}] ${account.name} — ${account.location} (${account.sku?.name})`);\n  }\n\n  console.log(`Total accounts: ${count}`);\n}\n\n// ---------------------------------------------------------------------------\n// 5. Get Storage Account properties\n// ---------------------------------------------------------------------------\nasync function getStorageAccountProperties(client: StorageManagementClient): Promise\u003cvoid\u003e {\n  console.log(`\\n--- Getting Properties of \"${accountName}\" ---`);\n\n  const account: StorageAccount = await client.storageAccounts.getProperties(\n    resourceGroupName,\n    accountName\n  );\n\n  console.log(`  Name:               ${account.name}`);\n  console.log(`  Provisioning State: ${account.provisioningState}`);\n  console.log(`  Primary Location:   ${account.primaryLocation}`);\n  console.log(`  Status:             ${account.statusOfPrimary}`);\n  console.log(`  Creation Time:      ${account.creationTime}`);\n  console.log(`  Access Tier:        ${account.accessTier}`);\n  console.log(`  Primary Endpoints:`);\n  console.log(`    Blob:  ${account.primaryEndpoints?.blob}`);\n  console.log(`    File:  ${account.primaryEndpoints?.file}`);\n  console.log(`    Queue: ${account.primaryEndpoints?.queue}`);\n  console.log(`    Table: ${account.primaryEndpoints?.table}`);\n}\n\n// ---------------------------------------------------------------------------\n// 6. Update the account to enable blob versioning\n// ---------------------------------------------------------------------------\nasync function enableBlobVersioning(client: StorageManagementClient): Promise\u003cvoid\u003e {\n  console.log(`\\n--- Enabling Blob Versioning on \"${accountName}\" ---`);\n\n  // Blob versioning is a property of the Blob Service, not the account itself.\n  // Use blobServices.setServiceProperties to enable it.\n  const blobServiceProperties: BlobServiceProperties = {\n    isVersioningEnabled: true,\n  };\n\n  const result = await client.blobServices.setServiceProperties(\n    resourceGroupName,\n    accountName,\n    blobServiceProperties\n  );\n\n  console.log(`  Versioning enabled: ${result.isVersioningEnabled}`);\n\n  // Also update account-level tags to record the change\n  const updateParams: StorageAccountUpdateParameters = {\n    tags: {\n      environment: \"demo\",\n      createdBy: \"azure-sdk-ts\",\n      blobVersioning: \"enabled\",\n    },\n  };\n\n  const updated = await client.storageAccounts.update(\n    resourceGroupName,\n    accountName,\n    updateParams\n  );\n\n  console.log(`  Updated tags: ${JSON.stringify(updated.tags)}`);\n}\n\n// ---------------------------------------------------------------------------\n// 7. Delete the Storage Account\n// ---------------------------------------------------------------------------\nasync function deleteStorageAccount(client: StorageManagementClient): Promise\u003cvoid\u003e {\n  console.log(`\\n--- Deleting Storage Account: ${accountName} ---`);\n\n  await client.storageAccounts.delete(resourceGroupName, accountName);\n\n  console.log(`  Deleted successfully.`);\n}\n\n// ---------------------------------------------------------------------------\n// Entry point\n// ---------------------------------------------------------------------------\nmain().catch((err: Error) =\u003e {\n  console.error(\"Error:\", err.message);\n  process.exit(1);\n});\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-mp-js-ts-account-mgmt-baseline-claude-opus-4.6-576538213\\src\\manageStorageAccount.ts"}
```

### 🔧 10. powershell

**Input:**

```json
{"command":"cd \"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-mp-js-ts-account-mgmt-baseline-claude-opus-4.6-576538213\" \u0026\u0026 npx tsc --noEmit 2\u003e\u00261","description":"Type-check the project","initial_wait":30}
```

### 🔧 11. view

**Input:**

```json
{"path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-mp-js-ts-account-mgmt-baseline-claude-opus-4.6-576538213\\package.json"}
```

### 🔧 12. edit

**Input:**

```json
{"new_str":"  \"scripts\": {\n    \"build\": \"tsc\",\n    \"start\": \"node dist/manageStorageAccount.js\",\n    \"test\": \"echo \\\"Error: no test specified\\\" \u0026\u0026 exit 1\"\n  },","old_str":"  \"scripts\": {\n    \"test\": \"echo \\\"Error: no test specified\\\" \u0026\u0026 exit 1\"\n  },","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-storage-mp-js-ts-account-mgmt-baseline-claude-opus-4.6-576538213\\package.json"}
```

## Generated Files

- `package-lock.json`
- `package.json`
- `src\manageStorageAccount.ts`
- `tsconfig.json`

## Copilot Response

The directory is empty. Let me scaffold the project and create the program.

Now let me compile to verify it's type-correct:

Compiles cleanly. Let me also add a `build` and `start` script to `package.json`:

The project compiles with zero errors. Here's a summary:

**Files created:**
- `src/manageStorageAccount.ts` — full lifecycle management program
- `tsconfig.json` — TypeScript config targeting ES2020

**Packages installed:** `@azure/arm-storage`, `@azure/identity`, `typescript`, `@types/node`

**What the program does (all 7 steps):**
1. **Auth** — `DefaultAzureCredential` (env vars → managed identity → CLI fallback)
2. **Client** — `StorageManagementClient(credential, subscriptionId)`
3. **Create** — `beginCreateAndWait` with `Standard_LRS`, `StorageV2`, `eastus`
4. **List** — `for await...of` over `listByResourceGroup()` async iterator
5. **Get** — `getProperties()` showing endpoints, tier, provisioning state
6. **Update** — `blobServices.setServiceProperties()` to enable versioning + tag update
7. **Delete** — `storageAccounts.delete()`

**To run:**
```bash
export AZURE_SUBSCRIPTION_ID="<your-sub-id>"
export AZURE_RESOURCE_GROUP="<your-rg>"
npm run build && npm start
```

## Code Review (LLM-as-Judge)

**Score: 19/22 criteria passed**

### Criteria Results

| Criterion | Result | Reason |
|-----------|--------|--------|
| Code Builds | ✅ | Code structure is valid TypeScript with proper imports, types, and async/await patterns. No syntax errors visible. |
| Latest Package Versions | ✅ | Uses @azure/arm-storage@19.1.0 and @azure/identity@4.13.1 which are current stable versions. |
| Best Practices | ✅ | Uses DefaultAzureCredential, proper async/await, LRO pattern with beginCreateAndWait, and for-await-of pagination. |
| Error Handling | ❌ | Only catches generic Error, not RestError. No retry logic or timeout configuration. |
| Code Quality | ✅ | Clean, well-structured code with clear function separation, comments, and console output for tracking operations. |
| Correct @azure/ Scoped Packages | ✅ | All Azure dependencies use @azure/ scoped packages: @azure/arm-storage, @azure/identity. |
| @azure/identity for Authentication | ✅ | Uses DefaultAzureCredential from @azure/identity for authentication. |
| Client Constructor with Endpoint and Credential | ✅ | StorageManagementClient constructed with credential and subscriptionId as required. |
| Async/Await Pattern | ✅ | All asynchronous operations use async/await consistently. No .then()/.catch() chains. |
| Pagination with for-await-of | ✅ | listByResourceGroup() uses for-await-of iteration over PagedAsyncIterableIterator. |
| LRO Pattern (beginXxx + pollUntilDone) | ✅ | Uses beginCreateAndWait() which polls until the LRO completes. |
| RestError Exception Handling | ❌ | Catches generic Error instead of RestError. No statusCode inspection for error-specific handling. |
| No Deprecated Packages | ✅ | All dependencies are current @azure/* packages. No deprecated packages present. |
| Logging via @azure/logger | ❌ | Does not use @azure/logger or setLogLevel(). No SDK diagnostic logging configured. |
| package.json with Correct Dependencies | ✅ | Valid package.json with all required dependencies and tsconfig.json present. |
| @azure/arm-storage and @azure/identity packages | ✅ | Both packages correctly specified in package.json dependencies. |
| StorageManagementClient constructor | ✅ | Client constructed with credential and subscriptionId: new StorageManagementClient(credential, subscriptionId). |
| storageAccounts.beginCreateAndWait() | ✅ | Uses beginCreateAndWait() with proper StorageAccountCreateParameters including location, sku, kind, and tags. |
| SKU and kind configuration | ✅ | Create parameters include sku: {name: 'Standard_LRS'} and kind: 'StorageV2'. |
| storageAccounts.listByResourceGroup() with async iteration | ✅ | Uses listByResourceGroup() with for-await-of loop to iterate through accounts. |
| storageAccounts.getProperties() | ✅ | Calls getProperties() to retrieve account details including endpoints, status, and creation time. |
| storageAccounts.update() | ✅ | Uses update() method with StorageAccountUpdateParameters to modify tags. |
| storageAccounts.delete() | ✅ | Calls delete() method to remove the storage account. |

### Summary

High-quality code that correctly implements all prompt requirements. Uses proper Azure SDK patterns including DefaultAzureCredential, beginCreateAndWait for LROs, and for-await-of for pagination. Code is well-structured with clear separation of concerns. Missing: RestError exception handling, @azure/logger integration, and retry/timeout configuration.

### Strengths

- All prompt requirements fully implemented
- Proper LRO pattern with beginCreateAndWait
- Correct for-await-of pagination pattern
- Clean code structure with well-organized functions
- Comprehensive console output for operation tracking
- Uses latest Azure SDK packages
- Proper async/await throughout
- Includes blob versioning configuration via blobServices.setServiceProperties
- Valid TypeScript configuration and package.json

### Issues

- No RestError exception handling with statusCode inspection
- Missing @azure/logger configuration for SDK diagnostics
- No retry policy or timeout configuration
- Generic Error catch instead of service-specific error handling

## Grader Results

| Grader | Type | Score | Summary |
|--------|------|-------|----------|
| `claude-sonnet-4.5` | review | 19/22 | High-quality code that correctly implements all prompt requirements. Uses proper… |
| 🏆 `claude-sonnet-4.5` | review | 19/22 | High-quality code that correctly implements all prompt requirements. Uses proper… |

## Re-run Command

```bash
hyoka run --prompt-id storage-mp-js-ts-account-mgmt --config baseline/claude-opus-4.6
```

---

[← Back to Summary](../../../../../../summary.md)
