package com.azure.storage.blobmanager;

import com.azure.core.http.policy.ExponentialBackoffOptions;
import com.azure.core.http.policy.HttpLogDetailLevel;
import com.azure.core.http.policy.HttpLogOptions;
import com.azure.core.http.policy.RetryOptions;
import com.azure.identity.DefaultAzureCredentialBuilder;
import com.azure.storage.blob.BlobServiceAsyncClient;
import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.BlobServiceClientBuilder;

import java.time.Duration;

public class BlobStorageConfig {
    
    private final String storageAccountEndpoint;
    private final int maxRetries;
    private final Duration retryDelay;
    private final Duration maxRetryDelay;
    private final Duration requestTimeout;
    private final HttpLogDetailLevel logLevel;

    private BlobStorageConfig(Builder builder) {
        this.storageAccountEndpoint = builder.storageAccountEndpoint;
        this.maxRetries = builder.maxRetries;
        this.retryDelay = builder.retryDelay;
        this.maxRetryDelay = builder.maxRetryDelay;
        this.requestTimeout = builder.requestTimeout;
        this.logLevel = builder.logLevel;
    }

    public BlobServiceClient createSyncClient() {
        return new BlobServiceClientBuilder()
                .endpoint(storageAccountEndpoint)
                .credential(new DefaultAzureCredentialBuilder().build())
                .retryOptions(createRetryOptions())
                .httpLogOptions(createHttpLogOptions())
                .buildClient();
    }

    public BlobServiceAsyncClient createAsyncClient() {
        return new BlobServiceClientBuilder()
                .endpoint(storageAccountEndpoint)
                .credential(new DefaultAzureCredentialBuilder().build())
                .retryOptions(createRetryOptions())
                .httpLogOptions(createHttpLogOptions())
                .buildAsyncClient();
    }

    private RetryOptions createRetryOptions() {
        ExponentialBackoffOptions backoffOptions = new ExponentialBackoffOptions()
                .setMaxRetries(maxRetries)
                .setBaseDelay(retryDelay)
                .setMaxDelay(maxRetryDelay);
        
        return new RetryOptions(backoffOptions);
    }

    private HttpLogOptions createHttpLogOptions() {
        return new HttpLogOptions()
                .setLogLevel(logLevel)
                .setPrettyPrintBody(true);
    }

    public Duration getRequestTimeout() {
        return requestTimeout;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String storageAccountEndpoint;
        private int maxRetries = 3;
        private Duration retryDelay = Duration.ofSeconds(1);
        private Duration maxRetryDelay = Duration.ofSeconds(30);
        private Duration requestTimeout = Duration.ofMinutes(5);
        private HttpLogDetailLevel logLevel = HttpLogDetailLevel.BASIC;

        public Builder storageAccountEndpoint(String endpoint) {
            this.storageAccountEndpoint = endpoint;
            return this;
        }

        public Builder storageAccountEndpointFromEnv(String envVarName) {
            this.storageAccountEndpoint = System.getenv(envVarName);
            if (this.storageAccountEndpoint == null || this.storageAccountEndpoint.isEmpty()) {
                throw new IllegalStateException(
                    "Environment variable " + envVarName + " is not set or empty");
            }
            return this;
        }

        public Builder maxRetries(int maxRetries) {
            this.maxRetries = maxRetries;
            return this;
        }

        public Builder retryDelay(Duration delay) {
            this.retryDelay = delay;
            return this;
        }

        public Builder maxRetryDelay(Duration maxDelay) {
            this.maxRetryDelay = maxDelay;
            return this;
        }

        public Builder requestTimeout(Duration timeout) {
            this.requestTimeout = timeout;
            return this;
        }

        public Builder logLevel(HttpLogDetailLevel level) {
            this.logLevel = level;
            return this;
        }

        public BlobStorageConfig build() {
            if (storageAccountEndpoint == null || storageAccountEndpoint.isEmpty()) {
                throw new IllegalStateException("Storage account endpoint must be set");
            }
            return new BlobStorageConfig(this);
        }
    }
}
