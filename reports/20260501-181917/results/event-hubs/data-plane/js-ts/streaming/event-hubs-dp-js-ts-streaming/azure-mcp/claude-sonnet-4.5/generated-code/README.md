# Azure Event Hubs TypeScript Demo

Complete demonstration of sending and receiving events with Azure Event Hubs using TypeScript.

## Features

✅ **EventHubProducerClient** - Send events with connection string  
✅ **Batch Creation** - Create batches with `createBatch()` and add 10 events  
✅ **Custom Properties** - Events include custom properties and metadata  
✅ **EventHubConsumerClient** - Receive events with checkpoint management  
✅ **BlobCheckpointStore** - Persist checkpoints to Azure Blob Storage  
✅ **Subscribe Pattern** - Process events with `subscribe()` handlers  
✅ **Checkpoint Updates** - Update checkpoints after processing  
✅ **Graceful Shutdown** - Proper cleanup with `close()`  
✅ **Error Handling** - processError handler for robust error management  

## Required Packages

```json
{
  "@azure/event-hubs": "^5.11.0",
  "@azure/eventhubs-checkpointstore-blob": "^1.0.1",
  "@azure/storage-blob": "^12.17.0"
}
```

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   Copy `.env.example` to `.env` and fill in your Azure credentials:
   ```bash
   cp .env.example .env
   ```

   Or set environment variables:
   ```bash
   # Windows PowerShell
   $env:EVENT_HUB_CONNECTION_STRING="Endpoint=sb://..."
   $env:EVENT_HUB_NAME="my-event-hub"
   $env:STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;..."
   $env:CONTAINER_NAME="eventhub-checkpoints"
   ```

3. **Build TypeScript:**
   ```bash
   npm run build
   ```

## Usage

### Run the demo:
```bash
npm start
```

### Run with ts-node (development):
```bash
npm run dev
```

## How It Works

### 1. Producer (Send Events)

```typescript
const producer = new EventHubProducerClient(connectionString, eventHubName);
const batch = await producer.createBatch();

// Add events with custom properties
batch.tryAdd({
  body: { id: 1, message: "Event 1" },
  properties: { eventType: "sensor-reading", priority: "high" }
});

await producer.sendBatch(batch);
await producer.close();
```

### 2. Consumer (Receive Events)

```typescript
const checkpointStore = new BlobCheckpointStore(containerClient);
const consumer = new EventHubConsumerClient(
  consumerGroup,
  connectionString,
  eventHubName,
  checkpointStore
);

const subscription = consumer.subscribe({
  processEvents: async (events, context) => {
    for (const event of events) {
      console.log("Received:", event.body);
    }
    // Update checkpoint
    await context.updateCheckpoint(events[events.length - 1]);
  },
  processError: async (error, context) => {
    console.error("Error:", error);
  }
});

// Later: cleanup
await subscription.close();
```

## Key Concepts

### Event Data Structure
```typescript
{
  body: any,                    // Event payload
  properties: {                 // Custom properties
    eventType: string,
    priority: string,
    source: string
  },
  contentType: string,          // MIME type
  correlationId?: string,       // For message correlation
  messageId?: string            // Unique message identifier
}
```

### Checkpoint Management

Checkpoints track the last successfully processed event per partition. Benefits:
- **Resume from last position** after restart
- **At-least-once delivery** guarantee
- **Parallel processing** across partitions
- **Fault tolerance** in distributed systems

### Graceful Shutdown

Always close resources properly:
```typescript
await producer.close();      // Close producer
await subscription.close();  // Close consumer subscription
```

## Azure Resources Required

1. **Event Hubs Namespace** - Container for Event Hubs
2. **Event Hub** - Specific event stream
3. **Storage Account** - For checkpoint persistence
4. **Blob Container** - Store checkpoint data

## Best Practices

✅ Use environment variables for secrets  
✅ Always update checkpoints after processing  
✅ Implement error handlers with retry logic  
✅ Close connections gracefully on shutdown  
✅ Use batch operations for better throughput  
✅ Set appropriate partition keys for ordering  
✅ Monitor consumer lag and throughput  
✅ Use consumer groups for parallel processing  

## Error Handling

The demo includes comprehensive error handling:
- Producer errors during batch creation/sending
- Consumer errors during event processing
- Checkpoint update failures
- Connection and network issues

## Troubleshooting

### "Connection refused" or timeout
- Verify Event Hub connection string
- Check firewall rules and network access
- Ensure Event Hub exists and is active

### "Container not found"
- Storage connection string is correct
- Container name matches configuration
- Storage account is accessible

### No events received
- Wait longer (events may be delayed)
- Check consumer group name
- Verify producer sent events successfully

## Production Considerations

- **Scaling**: Use multiple consumer instances with same consumer group
- **Partitioning**: Use partition keys for ordered processing
- **Monitoring**: Track metrics (throughput, lag, errors)
- **Security**: Use Managed Identity instead of connection strings
- **Retry Logic**: Implement exponential backoff
- **Batching**: Optimize batch sizes for your workload

## License

MIT
