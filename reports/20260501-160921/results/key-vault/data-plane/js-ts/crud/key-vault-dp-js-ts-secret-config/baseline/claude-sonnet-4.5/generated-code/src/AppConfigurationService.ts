import { ConfigurationModule } from './ConfigurationModule';
import { SecretRotationHelper } from './SecretRotationHelper';

/**
 * Production-ready configuration service example
 * Demonstrates best practices for Azure Key Vault integration
 */
export class AppConfigurationService {
  private config: ConfigurationModule;
  private rotationHelper: SecretRotationHelper;
  private refreshIntervalId?: NodeJS.Timeout;

  constructor(expiryWarningDays: number = 7) {
    this.config = new ConfigurationModule(undefined, expiryWarningDays);
    this.rotationHelper = new SecretRotationHelper(this.config.getSecretClient());
  }

  async initialize(): Promise<void> {
    const requiredSecrets = [
      'database-connection-string',
      'api-key',
      'smtp-password',
      'jwt-secret',
      'encryption-key',
    ];

    await this.config.initialize(requiredSecrets);
    console.log('✓ Configuration service initialized');

    const expiring = this.config.getCachedProvider().getExpiringSoonSecrets();
    if (expiring.length > 0) {
      console.warn(`⚠️  WARNING: ${expiring.length} secret(s) expiring soon:`, expiring);
    }
  }

  startAutoRefresh(intervalMinutes: number = 60): void {
    this.refreshIntervalId = setInterval(async () => {
      try {
        console.log('Running scheduled secret refresh...');
        const refreshed = await this.config.getCachedProvider().refreshExpiringSoon();
        
        if (refreshed.length > 0) {
          console.log(`✓ Auto-refreshed ${refreshed.length} expiring secret(s):`, refreshed);
        }
      } catch (error: any) {
        console.error('Auto-refresh failed:', error.message);
      }
    }, intervalMinutes * 60 * 1000);

    console.log(`✓ Auto-refresh scheduled every ${intervalMinutes} minutes`);
  }

  stopAutoRefresh(): void {
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
      this.refreshIntervalId = undefined;
      console.log('✓ Auto-refresh stopped');
    }
  }

  async getDatabaseConnectionString(): Promise<string> {
    const value = await this.config.getCachedProvider().getSecret(
      'database-connection-string',
      'DefaultConnection'
    );
    return value || 'DefaultConnection';
  }

  async getApiKey(): Promise<string> {
    const value = await this.config.getCachedProvider().getSecret('api-key');
    if (!value) {
      throw new Error('API key not configured');
    }
    return value;
  }

  async rotateApiKey(newKey: string): Promise<void> {
    console.log('Rotating API key...');
    await this.rotationHelper.rotateSecret('api-key', newKey, {
      expiryDays: 90,
      cleanupOldVersion: false, // Keep old versions for rollback
    });
    
    await this.config.getCachedProvider().refreshSecret('api-key');
    console.log('✓ API key rotated and cache updated');
  }

  async getExpiryWarnings(): Promise<Array<{ name: string; expiresOn?: Date }>> {
    const warnings: Array<{ name: string; expiresOn?: Date }> = [];
    const cached = this.config.getCachedProvider();
    const expiring = cached.getExpiringSoonSecrets();

    for (const name of expiring) {
      warnings.push({
        name,
        expiresOn: cached.getExpiryInfo(name),
      });
    }

    return warnings;
  }

  async healthCheck(): Promise<{ healthy: boolean; cacheSize: number; expiring: number }> {
    const cached = this.config.getCachedProvider();
    const expiring = cached.getExpiringSoonSecrets();

    return {
      healthy: true,
      cacheSize: cached.getCacheSize(),
      expiring: expiring.length,
    };
  }
}

// Example usage in production
async function productionExample() {
  const appConfig = new AppConfigurationService(7);

  await appConfig.initialize();

  appConfig.startAutoRefresh(60);

  const dbConnection = await appConfig.getDatabaseConnectionString();
  console.log('Database configured:', dbConnection ? '✓' : '✗');

  const health = await appConfig.healthCheck();
  console.log('Health check:', health);

  const warnings = await appConfig.getExpiryWarnings();
  if (warnings.length > 0) {
    console.log('Expiry warnings:');
    warnings.forEach(w => {
      console.log(`  - ${w.name}: expires ${w.expiresOn?.toISOString()}`);
    });
  }

  // Later, gracefully shutdown
  process.on('SIGTERM', () => {
    console.log('Shutting down...');
    appConfig.stopAutoRefresh();
    process.exit(0);
  });
}

if (require.main === module) {
  productionExample().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

export default AppConfigurationService;
