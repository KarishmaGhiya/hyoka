# Azure Event Hubs TypeScript Demo

A comprehensive TypeScript example demonstrating Azure Event Hubs producer and consumer patterns with checkpointing.

## Features

✅ **EventHubProducerClient** - Send events using connection string  
✅ **Batch Operations** - Create and send batches with `createBatch()` and `sendBatch()`  
✅ **Custom Properties** - Add custom properties to events  
✅ **EventHubConsumerClient** - Receive events with checkpoint store  
✅ **BlobCheckpointStore** - Persist consumer position in Azure Blob Storage  
✅ **Event Processing** - Handle events with `processEvents` callback  
✅ **Error Handling** - Robust error handling with `processError` callback  
✅ **Checkpointing** - Update checkpoints after processing events  
✅ **Graceful Shutdown** - Proper cleanup with `close()` methods  

## Prerequisites

- Node.js 18+ and npm
- Azure Event Hubs namespace and Event Hub
- Azure Storage Account (for checkpoint store)

## Required NPM Packages

```json
{
  "@azure/event-hubs": "^5.12.0",
  "@azure/eventhubs-checkpointstore-blob": "^1.1.0",
  "@azure/storage-blob": "^12.24.0"
}
```

## Installation

```bash
npm install
```

## Configuration

Set the following environment variables:

```bash
# Required
export EVENT_HUB_CONNECTION_STRING="Endpoint=sb://...;SharedAccessKeyName=...;SharedAccessKey=..."
export EVENT_HUB_NAME="your-event-hub-name"
export STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net"

# Optional (defaults provided)
export STORAGE_CONTAINER_NAME="eventhub-checkpoints"
export CONSUMER_GROUP="$Default"
```

### Windows (PowerShell)
```powershell
$env:EVENT_HUB_CONNECTION_STRING="Endpoint=sb://..."
$env:EVENT_HUB_NAME="your-event-hub-name"
$env:STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;..."
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

### 1. Producer Flow

```typescript
// Create producer client with connection string
const producerClient = new EventHubProducerClient(
  EVENT_HUB_CONNECTION_STRING,
  EVENT_HUB_NAME
);

// Create a batch
const batch = await producerClient.createBatch();

// Add events with custom properties
batch.tryAdd({
  body: { message: "Event data" },
  properties: { eventType: "demo", priority: "high" }
});

// Send the batch
await producerClient.sendBatch(batch);

// Close the client
await producerClient.close();
```

### 2. Consumer Flow with Checkpointing

```typescript
// Create checkpoint store
const containerClient = new ContainerClient(
  STORAGE_CONNECTION_STRING,
  STORAGE_CONTAINER_NAME
);
const checkpointStore = new BlobCheckpointStore(containerClient);

// Create consumer client with checkpoint store
const consumerClient = new EventHubConsumerClient(
  CONSUMER_GROUP,
  EVENT_HUB_CONNECTION_STRING,
  EVENT_HUB_NAME,
  checkpointStore
);

// Subscribe to events
const subscription = consumerClient.subscribe({
  processEvents: async (events, context) => {
    for (const event of events) {
      // Process event
      console.log(event.body);
      
      // Update checkpoint
      await context.updateCheckpoint(event);
    }
  },
  processError: async (error, context) => {
    console.error(`Error in partition ${context.partitionId}:`, error);
  }
});

// Graceful shutdown
await subscription.close();
await consumerClient.close();
```

## Key Concepts

### Batching
- Use `createBatch()` to create an optimized batch
- Use `tryAdd()` to safely add events (returns false if batch is full)
- Send complete batches with `sendBatch()`

### Custom Properties
Events support both body data and custom properties:
```typescript
{
  body: { /* your data */ },
  properties: { /* custom metadata */ }
}
```

### Checkpointing
- Checkpoints track the last processed event per partition
- Stored in Azure Blob Storage for durability
- Enables resuming from last position after restart
- Update after successful processing: `context.updateCheckpoint(event)`

### Error Handling
- `processError` callback handles partition-level errors
- Always use try-catch in async operations
- Implement graceful shutdown in finally blocks

## Troubleshooting

### Connection Issues
- Verify connection strings are correct
- Check firewall rules allow Azure Event Hubs traffic
- Ensure Event Hub and Storage Account exist

### No Events Received
- Verify events were sent successfully
- Check consumer group name matches
- Ensure sufficient time for events to propagate

### Checkpoint Errors
- Verify Storage Account connection string
- Check container exists and is accessible
- Ensure proper permissions on storage account

## References

- [Azure Event Hubs Documentation](https://learn.microsoft.com/azure/event-hubs/)
- [@azure/event-hubs npm package](https://www.npmjs.com/package/@azure/event-hubs)
- [@azure/eventhubs-checkpointstore-blob npm package](https://www.npmjs.com/package/@azure/eventhubs-checkpointstore-blob)
- [Azure Event Hubs Node.js Samples](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/eventhub/event-hubs/samples)
