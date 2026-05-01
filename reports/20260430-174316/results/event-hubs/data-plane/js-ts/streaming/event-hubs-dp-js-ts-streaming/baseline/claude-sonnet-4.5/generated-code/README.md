# Azure Event Hubs TypeScript Demo

A comprehensive TypeScript example demonstrating Azure Event Hubs producer and consumer patterns with checkpoint management.

## Features

- ✅ **EventHubProducerClient** - Creates producer with connection string
- ✅ **Batch Processing** - Creates batches and adds 10 events with custom properties
- ✅ **Event Sending** - Sends batches using sendBatch()
- ✅ **EventHubConsumerClient** - Configures consumer with BlobCheckpointStore
- ✅ **Event Subscription** - Subscribes with processEvents and processError handlers
- ✅ **Checkpoint Management** - Tracks progress and updates checkpoints
- ✅ **Graceful Shutdown** - Proper cleanup with close()
- ✅ **Async/Await Patterns** - Modern TypeScript async handling

## Required Packages

```json
{
  "@azure/event-hubs": "^5.11.0",
  "@azure/eventhubs-checkpointstore-blob": "^1.0.1",
  "@azure/storage-blob": "^12.17.0"
}
```

## Installation

```bash
npm install
```

## Configuration

Set the following environment variables before running:

```bash
# Event Hub connection string
export EVENT_HUB_CONNECTION_STRING="Endpoint=sb://YOUR-NAMESPACE.servicebus.windows.net/;SharedAccessKeyName=YOUR-KEY-NAME;SharedAccessKey=YOUR-KEY"

# Event Hub name
export EVENT_HUB_NAME="your-event-hub"

# Azure Storage connection string for checkpoints
export STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=YOUR-ACCOUNT;AccountKey=YOUR-KEY;EndpointSuffix=core.windows.net"

# Container name for checkpoints
export CONTAINER_NAME="eventhub-checkpoints"

# Consumer group (optional, defaults to $Default)
export CONSUMER_GROUP="$Default"
```

### Windows (PowerShell)

```powershell
$env:EVENT_HUB_CONNECTION_STRING="Endpoint=sb://..."
$env:EVENT_HUB_NAME="your-event-hub"
$env:STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;..."
$env:CONTAINER_NAME="eventhub-checkpoints"
```

## Usage

### Run with ts-node

```bash
npm start
```

### Build and run

```bash
npm run build
node dist/event-hubs-demo.js
```

### Development mode with auto-reload

```bash
npm run dev
```

## How It Works

### 1. Producer (Sending Events)

The producer:
- Creates an `EventHubProducerClient` with connection string
- Creates a batch using `createBatch()`
- Adds 10 events with custom properties (eventType, priority, source, customId)
- Sends the batch using `sendBatch()`
- Closes the producer gracefully

### 2. Consumer (Receiving Events)

The consumer:
- Creates a `BlobCheckpointStore` for checkpoint persistence
- Creates an `EventHubConsumerClient` with the checkpoint store
- Subscribes to events using `subscribe()` with two handlers:
  - **processEvents**: Receives events, prints bodies, and updates checkpoints
  - **processError**: Handles errors from any partition
- Runs for 30 seconds (configurable) before closing

### 3. Checkpoint Management

Checkpoints are automatically:
- Stored in Azure Blob Storage
- Updated after processing each batch of events
- Used to resume from the last processed event on restart

### 4. Graceful Shutdown

The program handles:
- SIGINT (Ctrl+C)
- SIGTERM signals
- Proper cleanup of producers and consumers
- Subscription closure

## Output Example

```
=== PRODUCING EVENTS ===
Created batch with max size: 1048576 bytes
Added event 1 to batch
Added event 2 to batch
...
✓ Batch sent successfully!
✓ Producer closed

=== CONSUMING EVENTS ===
✓ Checkpoint container ready: eventhub-checkpoints
✓ Subscribed to Event Hub, waiting for events...

--- Partition 0: Received 10 event(s) ---

Event received:
  Body: {"message":"Event message 1","timestamp":"2026-04-30T...","sequenceNumber":1}
  Sequence Number: 123
  Offset: 456
  Enqueued Time: 2026-04-30T...
  Custom Properties:
    eventType: demo-event
    priority: normal
    source: typescript-producer
    customId: event-1
...
✓ Checkpoint updated for partition 0
```

## Error Handling

The demo includes comprehensive error handling:
- Try-catch blocks around producer and consumer operations
- Process-level error handlers for unhandled rejections
- Partition-level error handling with `processError` callback
- Graceful degradation on failures

## Best Practices Demonstrated

1. **Connection Management** - Proper client creation and disposal
2. **Batching** - Efficient batch creation with size checking
3. **Checkpointing** - Regular checkpoint updates for fault tolerance
4. **Error Handling** - Comprehensive error handling at all levels
5. **Resource Cleanup** - Graceful shutdown with proper cleanup
6. **Async/Await** - Modern async patterns throughout
7. **Type Safety** - Full TypeScript typing for safety

## Learn More

- [Azure Event Hubs Documentation](https://docs.microsoft.com/azure/event-hubs/)
- [Azure Event Hubs SDK for JavaScript](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/eventhub/event-hubs)
- [Event Hubs Checkpoint Store](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/eventhub/eventhubs-checkpointstore-blob)
