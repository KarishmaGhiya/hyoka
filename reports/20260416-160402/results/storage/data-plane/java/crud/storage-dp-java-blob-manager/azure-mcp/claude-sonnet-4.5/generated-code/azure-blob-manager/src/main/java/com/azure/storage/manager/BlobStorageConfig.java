package com.azure.storage.manager;

import com.azure.core.http.policy.ExponentialBackoffOptions;
import com.azure.core.http.policy.HttpLogDetailLevel;
import com.azure.core.http.policy.HttpLogOptions;
import com.azure.core.http.policy.RetryOptions;
import com.azure.core.util.ClientOptions;
import com.azure.identity.DefaultAzureCredential;
import com.azure.identity.DefaultAzureCredentialBuilder;
import com.azure.storage.blob.BlobContainerAsyncClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceAsyncClient;
import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.BlobServiceClientBuilder;

import java.time.Duration;

public class BlobStorageConfig {
    
    private final String storageEndpoint;
    private final int maxRetries;
    private final Duration retryDelay;
    private final Duration maxRetryDelay;
    private final Duration requestTimeout;
    private final HttpLogDetailLevel logLevel;
    private final DefaultAzureCredential credential;

    private BlobStorageConfig(Builder builder) {
        this.storageEndpoint = builder.storageEndpoint;
        this.maxRetries = builder.maxRetries;
        this.retryDelay = builder.retryDelay;
        this.maxRetryDelay = builder.maxRetryDelay;
        this.requestTimeout = builder.requestTimeout;
        this.logLevel = builder.logLevel;
        this.credential = new DefaultAzureCredentialBuilder().build();
    }

    public BlobServiceClient createBlobServiceClient() {
        return new BlobServiceClientBuilder()
                .endpoint(storageEndpoint)
                .credential(credential)
                .retryOptions(createRetryOptions())
                .httpLogOptions(createHttpLogOptions())
                .clientOptions(createClientOptions())
                .buildClient();
    }

    public BlobServiceAsyncClient createBlobServiceAsyncClient() {
        return new BlobServiceClientBuilder()
                .endpoint(storageEndpoint)
                .credential(credential)
                .retryOptions(createRetryOptions())
                .httpLogOptions(createHttpLogOptions())
                .clientOptions(createClientOptions())
                .buildAsyncClient();
    }

    public BlobContainerClient createContainerClient(String containerName) {
        return createBlobServiceClient().getBlobContainerClient(containerName);
    }

    public BlobContainerAsyncClient createContainerAsyncClient(String containerName) {
        return createBlobServiceAsyncClient().getBlobContainerAsyncClient(containerName);
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
                .setLogLevel(logLevel);
    }

    private ClientOptions createClientOptions() {
        return new ClientOptions()
                .setApplicationId("azure-blob-manager/1.0.0");
    }

    public Duration getRequestTimeout() {
        return requestTimeout;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String storageEndpoint;
        private int maxRetries = 3;
        private Duration retryDelay = Duration.ofSeconds(1);
        private Duration maxRetryDelay = Duration.ofSeconds(30);
        private Duration requestTimeout = Duration.ofSeconds(60);
        private HttpLogDetailLevel logLevel = HttpLogDetailLevel.BASIC;

        public Builder storageEndpoint(String endpoint) {
            this.storageEndpoint = endpoint;
            return this;
        }

        public Builder storageEndpointFromEnv(String envVarName) {
            this.storageEndpoint = System.getenv(envVarName);
            if (this.storageEndpoint == null || this.storageEndpoint.isEmpty()) {
                throw new IllegalArgumentException(
                    "Environment variable '" + envVarName + "' is not set or empty");
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
            if (storageEndpoint == null || storageEndpoint.isEmpty()) {
                throw new IllegalStateException("Storage endpoint must be configured");
            }
            return new BlobStorageConfig(this);
        }
    }
}
