package com.example.blob;

import com.azure.core.http.HttpClient;
import com.azure.core.http.HttpPipelineCallContext;
import com.azure.core.http.HttpPipelineNextPolicy;
import com.azure.core.http.HttpResponse;
import com.azure.core.http.netty.NettyAsyncHttpClientBuilder;
import com.azure.core.http.policy.HttpLogDetailLevel;
import com.azure.core.http.policy.HttpLogOptions;
import com.azure.core.http.policy.HttpPipelinePolicy;
import com.azure.core.http.policy.RetryPolicy;
import com.azure.core.http.policy.ExponentialBackoffOptions;
import com.azure.core.util.Configuration;
import com.azure.identity.DefaultAzureCredentialBuilder;
import com.azure.storage.blob.BlobServiceAsyncClient;
import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.BlobServiceClientBuilder;
import reactor.core.publisher.Mono;

import java.time.Duration;

public class BlobStorageConfiguration {
    private final String storageAccountEndpoint;
    private final int maxRetries;
    private final Duration retryDelay;
    private final Duration requestTimeout;
    private final HttpLogDetailLevel logLevel;

    private BlobStorageConfiguration(Builder builder) {
        this.storageAccountEndpoint = builder.storageAccountEndpoint;
        this.maxRetries = builder.maxRetries;
        this.retryDelay = builder.retryDelay;
        this.requestTimeout = builder.requestTimeout;
        this.logLevel = builder.logLevel;
    }

    public BlobServiceClient createSyncClient() {
        return new BlobServiceClientBuilder()
                .endpoint(storageAccountEndpoint)
                .credential(new DefaultAzureCredentialBuilder().build())
                .httpClient(createHttpClient())
                .retryOptions(createRetryOptions())
                .httpLogOptions(createLogOptions())
                .addPolicy(createTimeoutPolicy())
                .buildClient();
    }

    public BlobServiceAsyncClient createAsyncClient() {
        return new BlobServiceClientBuilder()
                .endpoint(storageAccountEndpoint)
                .credential(new DefaultAzureCredentialBuilder().build())
                .httpClient(createHttpClient())
                .retryOptions(createRetryOptions())
                .httpLogOptions(createLogOptions())
                .addPolicy(createTimeoutPolicy())
                .buildAsyncClient();
    }

    private HttpClient createHttpClient() {
        return new NettyAsyncHttpClientBuilder()
                .responseTimeout(requestTimeout)
                .build();
    }

    private ExponentialBackoffOptions createRetryOptions() {
        return new ExponentialBackoffOptions()
                .setMaxRetries(maxRetries)
                .setBaseDelay(retryDelay)
                .setMaxDelay(Duration.ofSeconds(60));
    }

    private HttpLogOptions createLogOptions() {
        return new HttpLogOptions()
                .setLogLevel(logLevel);
    }

    private HttpPipelinePolicy createTimeoutPolicy() {
        return (HttpPipelineCallContext context, HttpPipelineNextPolicy next) -> {
            context.getData("requestTimeout").ifPresent(timeout -> 
                context.setHttpRequest(context.getHttpRequest()));
            return next.process();
        };
    }

    public static class Builder {
        private String storageAccountEndpoint;
        private int maxRetries = 3;
        private Duration retryDelay = Duration.ofSeconds(2);
        private Duration requestTimeout = Duration.ofSeconds(60);
        private HttpLogDetailLevel logLevel = HttpLogDetailLevel.NONE;

        public Builder storageAccountEndpoint(String endpoint) {
            this.storageAccountEndpoint = endpoint;
            return this;
        }

        public Builder storageAccountEndpointFromEnv(String envVarName) {
            this.storageAccountEndpoint = System.getenv(envVarName);
            if (this.storageAccountEndpoint == null || this.storageAccountEndpoint.isEmpty()) {
                throw new IllegalArgumentException(
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

        public Builder requestTimeout(Duration timeout) {
            this.requestTimeout = timeout;
            return this;
        }

        public Builder logLevel(HttpLogDetailLevel level) {
            this.logLevel = level;
            return this;
        }

        public BlobStorageConfiguration build() {
            if (storageAccountEndpoint == null || storageAccountEndpoint.isEmpty()) {
                throw new IllegalStateException("Storage account endpoint must be set");
            }
            return new BlobStorageConfiguration(this);
        }
    }
}
