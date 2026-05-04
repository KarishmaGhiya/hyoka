# Project Structure

## Overview

This TypeScript Node.js project implements a production-ready Azure Key Vault configuration provider with caching, secret rotation, and managed identity authentication.

## Directory Structure

```
azure-keyvault-config-provider/
├── src/
│   ├── ConfigurationModule.ts       # Main entry point - initializes Key Vault connection
│   ├── SecretProvider.ts            # Core provider - retrieves secrets with error handling
│   ├── CachedSecretProvider.ts     # Caching layer - in-memory cache with expiry monitoring
│   ├── SecretRotationHelper.ts     # Rotation utilities - safe secret lifecycle management
│   ├── index.ts                     # Demo application - showcases all features
│   └── examples.ts                  # Usage examples - common patterns and scenarios
├── dist/                            # Compiled JavaScript output
├── node_modules/                    # Dependencies
├── package.json                     # Project configuration
├── tsconfig.json                    # TypeScript configuration
├── README.md                        # Main documentation
├── USAGE.md                         # Detailed usage guide
├── .env.example                     # Environment variable template
├── .gitignore                       # Git ignore rules
└── STRUCTURE.md                     # This file
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ConfigurationModule                       │
│  • Initializes Key Vault connection with managed identity   │
│  • Provides access to all components                         │
└──────────────┬────────────────────────────┬─────────────────┘
               │                            │
               ▼                            ▼
┌──────────────────────────┐  ┌─────────────────────────────┐
│   CachedSecretProvider   │  │   SecretRotationHelper      │
│  • In-memory cache       │  │  • Create new versions      │
│  • Bulk loading          │  │  • Disable old versions     │
│  • Auto-refresh          │  │  • Delete and purge         │
│  • Expiry monitoring     │  │  • Version listing          │
└──────────┬───────────────┘  └─────────────┬───────────────┘
           │                                 │
           ▼                                 │
┌──────────────────────────┐                │
│     SecretProvider       │                │
│  • Get secrets           │                │
│  • Version handling      │◄───────────────┘
│  • Expiry inspection     │
│  • Error handling        │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│               Azure Key Vault SecretClient                    │
│         (@azure/keyvault-secrets + @azure/identity)           │
└──────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Initialization Flow

```
Application Start
    │
    ├──> ConfigurationModule
    │        │
    │        ├──> Read KEY_VAULT_URL from env
    │        ├──> Create ManagedIdentityCredential
    │        ├──> Initialize SecretClient
    │        ├──> Create SecretProvider (wraps SecretClient)
    │        └──> Create CachedSecretProvider (wraps SecretProvider)
    │
    └──> Ready for use
```

### 2. Secret Retrieval Flow (with Cache)

```
Application requests secret
    │
    ├──> CachedSecretProvider.get()
    │        │
    │        ├──> Check cache
    │        │       │
    │        │       ├──> HIT: Return cached value (fast)
    │        │       │
    │        │       └──> MISS: Continue to provider
    │        │
    │        └──> SecretProvider.getSecret()
    │                │
    │                ├──> Call Azure Key Vault API
    │                ├──> Handle 404 errors gracefully
    │                ├──> Store in cache
    │                └──> Return value
    │
    └──> Application receives secret
```

### 3. Bulk Loading Flow

```
Application startup
    │
    ├──> CachedSecretProvider.bulkLoad([secrets...])
    │        │
    │        ├──> Promise.allSettled() for parallel fetching
    │        │       │
    │        │       ├──> Secret 1 ───┐
    │        │       ├──> Secret 2 ───┼─> Parallel API calls
    │        │       ├──> Secret 3 ───┤
    │        │       └──> Secret N ───┘
    │        │
    │        ├──> Fetch expiry info for each
    │        ├──> Store all in cache
    │        └──> Report statistics
    │
    └──> All secrets cached and ready
```

### 4. Secret Rotation Flow

```
Rotation trigger (scheduled or manual)
    │
    ├──> SecretRotationHelper.rotateSecret()
    │        │
    │        ├──> Get current secret version
    │        ├──> Disable old version (set enabled: false)
    │        ├──> Create new version with setSecret()
    │        │       │
    │        │       ├──> New value
    │        │       ├──> New expiry date
    │        │       └──> Preserve/update tags
    │        │
    │        └──> Return new secret version
    │
    ├──> Optional: CachedSecretProvider.refresh()
    │        └──> Update cache with new version
    │
    └──> Rotation complete
```

### 5. Delete and Purge Flow

```
Cleanup operation
    │
    ├──> SecretRotationHelper.deleteAndPurgeSecret()
    │        │
    │        ├──> beginDeleteSecret() - returns poller
    │        │       │
    │        │       └──> Poll until completion (soft-delete)
    │        │
    │        ├──> Optional: purgeDeletedSecret()
    │        │       └──> Permanent deletion (irreversible)
    │        │
    │        └──> Secret removed
    │
    └──> Cleanup complete
```

## Class Responsibilities

### ConfigurationModule
- **Purpose**: Bootstraps the entire configuration system
- **Dependencies**: @azure/keyvault-secrets, @azure/identity
- **Creates**: SecretClient, SecretProvider, CachedSecretProvider
- **Lifecycle**: Singleton per application

### SecretProvider
- **Purpose**: Core secret retrieval with error handling
- **Dependencies**: SecretClient
- **Key Features**:
  - Get latest or specific version
  - Graceful 404 handling with defaults
  - Expiry inspection
  - Version listing
- **Lifecycle**: Created by ConfigurationModule

### CachedSecretProvider
- **Purpose**: Performance optimization through caching
- **Dependencies**: SecretProvider
- **Key Features**:
  - In-memory cache (Map)
  - Bulk parallel loading
  - Automatic expiry monitoring
  - On-demand refresh
  - Cache statistics
- **Lifecycle**: Created by ConfigurationModule
- **Thread Safety**: Not thread-safe (use in single-threaded Node.js)

### SecretRotationHelper
- **Purpose**: Safe secret lifecycle management
- **Dependencies**: SecretClient
- **Key Features**:
  - Create new versions
  - Disable old versions
  - Delete with polling
  - Purge (permanent)
  - Version listing
- **Lifecycle**: Created on-demand or by ConfigurationModule

## Key Design Decisions

### 1. Caching Strategy
- **In-memory only**: No external cache (Redis, etc.) to minimize dependencies
- **Lazy loading**: Secrets loaded on first access or bulk load
- **No TTL**: Cache doesn't expire automatically; use refresh methods
- **Rationale**: Simple, fast, suitable for serverless and traditional apps

### 2. Error Handling
- **Graceful degradation**: Return defaults instead of crashing on 404
- **Transparent exceptions**: Let authentication and permission errors bubble up
- **Rationale**: Resilient to missing optional secrets, but fails fast on misconfigurations

### 3. Authentication
- **ManagedIdentityCredential**: Hardcoded in ConfigurationModule
- **Easy to swap**: Replace with DefaultAzureCredential for local dev
- **Rationale**: Production-first, secure by default

### 4. Versioning
- **Create, never update**: setSecret() creates new versions
- **Disable, don't delete**: Old versions marked disabled, not deleted
- **Explicit cleanup**: Delete/purge requires explicit call
- **Rationale**: Safe rotation without downtime, recovery possible

### 5. Async Operations
- **Polling for long operations**: beginDeleteSecret returns poller
- **Parallel bulk loading**: Promise.allSettled for independence
- **Rationale**: Correct handling of Key Vault's async model

## Extension Points

### Custom Credential
Replace in `ConfigurationModule.ts`:
```typescript
const credential = new DefaultAzureCredential(); // or any TokenCredential
```

### Custom Cache Backend
Extend `CachedSecretProvider` to use Redis, etc.:
```typescript
class RedisCachedSecretProvider extends CachedSecretProvider {
  // Override cache operations
}
```

### Automatic Rotation Scheduling
```typescript
import { schedule } from "node-cron";

schedule("0 2 * * *", async () => {
  await cache.refreshExpiring();
});
```

### Monitoring Integration
```typescript
const expiring = await cache.getExpiringSecrets();
expiring.forEach(secret => {
  metrics.recordExpiringSecret(secret.secretName, secret.daysUntilExpiry);
});
```

## Testing Considerations

### Unit Testing
- Mock `SecretClient` for isolated testing
- Test error paths (404, 403, etc.)
- Verify cache behavior

### Integration Testing
- Use real Key Vault with test secrets
- Test rotation end-to-end
- Verify managed identity authentication

### Load Testing
- Measure cache hit rates
- Test bulk loading performance
- Verify no rate limiting issues

## Performance Characteristics

| Operation | First Call | Subsequent (Cached) | Notes |
|-----------|------------|---------------------|-------|
| get() | ~100-300ms | ~0.1ms | Network latency |
| bulkLoad(10) | ~500-1000ms | N/A | Parallel requests |
| refresh() | ~100-300ms | N/A | Always fetches |
| getExpiringSecrets() | ~100ms per secret | N/A | Checks all cached |
| rotateSecret() | ~500-800ms | N/A | Multiple API calls |

## Security Notes

1. **Secrets in memory**: Cached values stored in plain text in Node.js heap
2. **No encryption at rest**: Cache is memory-only, cleared on restart
3. **Logging**: Never log secret values; use masking
4. **Permissions**: Requires appropriate RBAC roles on Key Vault
5. **Soft-delete**: Assumes vault has soft-delete enabled

## Dependencies

```json
{
  "@azure/keyvault-secrets": "^4.8.0",  // Key Vault SDK
  "@azure/identity": "^4.0.0",          // Authentication
  "@azure/core-rest-pipeline": "*"       // Error types (transitive)
}
```

## Future Enhancements

- [ ] Add TTL-based cache expiration
- [ ] Support Key Vault references in config files
- [ ] Automatic rotation scheduling
- [ ] Metrics and observability hooks
- [ ] Support for certificate secrets
- [ ] Backup/restore utilities
- [ ] Multi-vault support
- [ ] Circuit breaker for Key Vault API calls
