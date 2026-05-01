# Azure Event Hubs TypeScript Demo

A comprehensive TypeScript demonstration of Azure Event Hubs producer and consumer patterns with checkpoint storage using Azure Blob Storage.

## Features

- **Event Production**: Send batched events with custom properties
- **Event Consumption**: Receive events with checkpoint management
- **Blob Checkpoint Store**: Persist consumer progress to Azure Blob Storage
- **Graceful Shutdown**: Proper cleanup of producer and consumer clients
- **Error Handling**: Comprehensive error handling for production scenarios
- **Async/Await**: Modern async patterns throughout

## Required NPM Packages

```bash
npm install
```

This installs:
- `@azure/event-hubs` (^5.11.0) - Core Event Hubs client library
- `@azure/eventhubs-checkpointstore-blob` (^1.0.1) - Blob-based checkpoint store
- `@azure/storage-blob` (^12.17.0) - Azure Blob Storage client

## Prerequisites

1. **Azure Event Hubs Namespace**: Create an Event Hubs namespace in Azure
2. **Event Hub**: Create an Event Hub within the namespace
3. **Storage Account**: Create an Azure Storage account for checkpoints
4. **Connection Strings**: Get connection strings for both services

## Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your Azure credentials:
   ```env
   EVENT_HUBS_CONNECTION_STRING=<your-event-hubs-connection-string>
   EVENT_HUB_NAME=<your-event-hub-name>
   STORAGE_CONNECTION_STRING=<your-storage-connection-string>
   STORAGE_CONTAINER_NAME=eventhub-checkpoints
   CONSUMER_GROUP=$Default
   ```

## Running the Demo

### Development Mode (with ts-node):
```bash
npm run dev
```

### Production Mode:
```bash
npm run build
npm start
```

## What the Demo Does

### Producer Flow:
1. Creates an `EventHubProducerClient` with connection string
2. Creates a batch using `createBatch()`
3. Adds 10 events with custom properties to the batch
4. Sends the batch using `sendBatch()`
5. Closes the producer client gracefully

### Consumer Flow:
1. Creates a `BlobCheckpointStore` for managing consumer state
2. Creates an `EventHubConsumerClient` with the checkpoint store
3. Subscribes to events using `subscribe()` with:
   - `processEvents`: Handler for incoming events
   - `processError`: Handler for errors
4. Prints received event bodies and properties
5. Updates checkpoints after processing each event
6. Closes the consumer client gracefully

## Key Concepts

### Batching
Events are sent in batches to optimize throughput. The `createBatch()` method creates a batch that respects size limits, and `tryAdd()` safely adds events.

### Checkpointing
Checkpoints track the consumer's progress through the event stream. They're stored in Azure Blob Storage, allowing the consumer to resume from the last processed event after a restart.

### Consumer Groups
Multiple applications can read from the same Event Hub independently using different consumer groups. Each group maintains its own checkpoints.

### Graceful Shutdown
Both producer and consumer implement proper cleanup with `close()` methods, ensuring all resources are released correctly.

## Error Handling

The demo includes:
- Configuration validation
- Try-catch blocks for async operations
- Error handlers in the consumer subscription
- Process signal handlers (SIGINT/SIGTERM)

## Output Example

```
=== Starting Event Producer ===
Created batch with max size: 1048576 bytes
Added event 1 to batch
Added event 2 to batch
...
✓ Successfully sent 10 events
Producer closed

Waiting 2 seconds before starting consumer...

=== Starting Event Consumer ===
Checkpoint container 'eventhub-checkpoints' ready
Consumer subscribed, waiting for events...

Received 10 event(s) from partition: 0

--- Event 1 ---
Body: {
  "message": "Event message 1",
  "timestamp": "2026-04-30T18:43:39.569Z",
  "eventNumber": 1
}
Properties: { priority: 'normal', source: 'typescript-demo', ... }
✓ Checkpoint updated for partition 0
...

Consumer closed
Total events received: 10

=== Demo completed successfully ===
```

## Troubleshooting

### Missing Environment Variables
Ensure all required environment variables are set in `.env` or exported in your shell.

### Connection Errors
- Verify connection strings are correct
- Check firewall rules allow access to Azure services
- Ensure the Event Hub and Storage Container exist

### No Events Received
- Check that events were successfully sent by the producer
- Verify the consumer group name matches
- Check checkpoint container permissions

## Additional Resources

- [Azure Event Hubs Documentation](https://docs.microsoft.com/azure/event-hubs/)
- [@azure/event-hubs NPM Package](https://www.npmjs.com/package/@azure/event-hubs)
- [@azure/eventhubs-checkpointstore-blob NPM Package](https://www.npmjs.com/package/@azure/eventhubs-checkpointstore-blob)
