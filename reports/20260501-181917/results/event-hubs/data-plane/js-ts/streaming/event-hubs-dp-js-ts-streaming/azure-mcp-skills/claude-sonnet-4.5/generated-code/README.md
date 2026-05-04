# Azure Event Hubs TypeScript Demo

A comprehensive TypeScript example demonstrating Azure Event Hubs operations including sending events, receiving events with checkpointing, and graceful shutdown.

## Features

✅ **EventHubProducerClient** - Send events using connection string  
✅ **Batch Operations** - Create batches and add multiple events  
✅ **Custom Properties** - Add custom properties to events  
✅ **EventHubConsumerClient** - Receive events from Event Hub  
✅ **BlobCheckpointStore** - Persistent checkpointing with Azure Blob Storage  
✅ **Event Handlers** - Process events with full lifecycle handlers  
✅ **Graceful Shutdown** - Proper cleanup and resource management  

## Prerequisites

- Node.js 18+ and npm
- Azure Event Hubs namespace and event hub
- Azure Storage account and container for checkpoints
- Connection strings for both services

## Installation

1. Install dependencies:

```bash
npm install
```

## Required Packages

```json
{
  "@azure/event-hubs": "^5.12.0",
  "@azure/eventhubs-checkpointstore-blob": "^1.1.0",
  "@azure/storage-blob": "^12.24.0"
}
```

## Configuration

Set the following environment variables:

```bash
# Event Hub Configuration
export EVENTHUB_CONNECTION_STRING="Endpoint=sb://YOUR-NAMESPACE.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=YOUR-KEY"
export EVENTHUB_NAME="my-event-hub"

# Storage Account Configuration (for checkpointing)
export STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=YOUR-ACCOUNT;AccountKey=YOUR-KEY;EndpointSuffix=core.windows.net"
export STORAGE_CONTAINER_NAME="eventhub-checkpoints"
```

### Get Connection Strings

**Event Hub Connection String:**
```bash
az eventhubs namespace authorization-rule keys list \
  --resource-group <resource-group> \
  --namespace-name <namespace> \
  --name RootManageSharedAccessKey \
  --query primaryConnectionString -o tsv
```

**Storage Connection String:**
```bash
az storage account show-connection-string \
  --name <storage-account> \
  --resource-group <resource-group> \
  --query connectionString -o tsv
```

## Usage

### Run with ts-node (Development)

```bash
npm run dev
```

### Build and Run (Production)

```bash
npm run build
npm start
```

## How It Works

### 1. Sending Events

The program creates an `EventHubProducerClient` using the connection string:

```typescript
const producer = new EventHubProducerClient(
  eventHubConnectionString,
  eventHubName
);
```

Creates a batch and adds 10 events with custom properties:

```typescript
const batch = await producer.createBatch();

for (let i = 1; i <= 10; i++) {
  batch.tryAdd({
    body: { message: `Event ${i}`, value: Math.random() * 100 },
    properties: {
      eventType: "telemetry",
      deviceId: `device-${i}`,
      priority: "high"
    },
    contentType: "application/json",
    correlationId: `correlation-${i}`
  });
}

await producer.sendBatch(batch);
```

### 2. Receiving Events with Checkpointing

Creates a `BlobCheckpointStore` for persistent checkpoints:

```typescript
const containerClient = new ContainerClient(
  storageConnectionString,
  storageContainerName
);
await containerClient.createIfNotExists();

const checkpointStore = new BlobCheckpointStore(containerClient);
```

Creates an `EventHubConsumerClient` with the checkpoint store:

```typescript
const consumer = new EventHubConsumerClient(
  "$Default",
  eventHubConnectionString,
  eventHubName,
  checkpointStore
);
```

### 3. Subscribe with Handlers

Subscribes to events with full lifecycle handlers:

```typescript
const subscription = consumer.subscribe({
  processInitialize: async (context) => {
    console.log(`Started receiving from partition ${context.partitionId}`);
  },

  processEvents: async (events, context) => {
    for (const event of events) {
      console.log(`Body: ${JSON.stringify(event.body)}`);
      console.log(`Properties: ${JSON.stringify(event.properties)}`);
    }
    
    // Update checkpoint after processing
    if (events.length > 0) {
      await context.updateCheckpoint(events[events.length - 1]);
    }
  },

  processError: async (err, context) => {
    console.error(`Error on partition ${context.partitionId}: ${err.message}`);
  },

  processClose: async (reason, context) => {
    console.log(`Stopped receiving from partition ${context.partitionId}`);
  }
}, {
  startPosition: { offset: "@earliest" },
  maxBatchSize: 10,
  maxWaitTimeInSeconds: 30
});
```

### 4. Graceful Shutdown

Handles SIGINT and SIGTERM signals:

```typescript
async function shutdown() {
  await subscription.close();
  await consumer.close();
  await producer.close();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
```

## Key Concepts

### Event Properties

Each event includes:
- **body** - Event payload (any JSON-serializable data)
- **properties** - Custom application properties
- **contentType** - MIME type of the body
- **correlationId** - For request-response patterns
- **sequenceNumber** - Unique sequence per partition
- **offset** - Position in the partition
- **enqueuedTimeUtc** - When event was enqueued
- **partitionKey** - Key for partition assignment

### Checkpointing

Checkpointing tracks the last successfully processed event:
- Enables resumption after restart
- Prevents reprocessing of events
- Stored persistently in Azure Blob Storage
- Updated after successful event processing
- Critical for production scenarios

### Consumer Groups

Consumer groups enable multiple independent consumers:
- `$Default` is the built-in consumer group
- Each consumer group maintains its own checkpoints
- Multiple consumers in same group load-balance partitions

## Best Practices

1. ✅ **Always use checkpointing** in production
2. ✅ **Checkpoint after processing**, not before
3. ✅ **Use batches** for efficient sending
4. ✅ **Handle empty event batches** (processEvents may receive [])
5. ✅ **Close clients** on shutdown
6. ✅ **Add retry logic** for transient failures
7. ✅ **Monitor consumer lag** in production

## Troubleshooting

### Connection Issues

- Verify Event Hub connection string includes event hub name or pass separately
- Check firewall rules allow access to Event Hubs (port 5671/5672)
- Ensure storage container exists and is accessible

### No Events Received

- Check events were sent successfully
- Verify consumer group name matches
- Check start position (use `@earliest` to receive all events)
- Wait for `maxWaitTimeInSeconds` before expecting events

### Checkpoint Errors

- Ensure storage container exists: `az storage container create`
- Verify storage connection string is valid
- Check storage account has sufficient permissions

## Output Example

```
=== Azure Event Hubs Demo ===

=== SENDING EVENTS ===

Creating batch...
Added event 1 to batch
Added event 2 to batch
...
Added event 10 to batch

Sending batch with 10 events...
Successfully sent 10 events!

=== RECEIVING EVENTS ===

Ensuring checkpoint container exists...
Checkpoint container ready.

Starting event consumer...
Consumer is now listening for events...

[INIT] Started receiving from partition 0

[PARTITION 0] Received 10 event(s)

  Event Details:
    Sequence Number: 123
    Offset: 4567
    Enqueued Time: 2024-01-15T10:30:00.000Z
    Custom Properties:
      eventType: telemetry
      deviceId: device-1
      priority: high
    Body: {
      "message": "Event message 1",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "value": 42
    }

[PARTITION 0] Checkpoint updated at sequence 132

Press Ctrl+C to stop.
```

## Resources

- [Azure Event Hubs Documentation](https://learn.microsoft.com/azure/event-hubs/)
- [@azure/event-hubs SDK](https://www.npmjs.com/package/@azure/event-hubs)
- [@azure/eventhubs-checkpointstore-blob SDK](https://www.npmjs.com/package/@azure/eventhubs-checkpointstore-blob)
- [Event Hubs Quotas and Limits](https://learn.microsoft.com/azure/event-hubs/event-hubs-quotas)

## License

MIT
