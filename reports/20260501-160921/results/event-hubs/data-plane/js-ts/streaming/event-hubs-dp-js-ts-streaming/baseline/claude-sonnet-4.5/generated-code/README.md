# Azure Event Hubs TypeScript Demo

A comprehensive TypeScript demonstration of sending and receiving events with Azure Event Hubs, including checkpoint management using Azure Blob Storage.

## Features

✅ **Event Producer**
- Create EventHubProducerClient with connection string
- Create event batches with `createBatch()`
- Add multiple events with custom properties
- Send batches efficiently with `sendBatch()`

✅ **Event Consumer**
- Create EventHubConsumerClient with BlobCheckpointStore
- Subscribe to events with `subscribe()`
- Process events with `processEvents` handler
- Handle errors with `processError` handler
- Update checkpoints after processing
- Resume from last checkpoint after restart

✅ **Best Practices**
- Proper async/await patterns throughout
- Graceful shutdown with `close()`
- Error handling and logging
- TypeScript type safety
- Environment variable configuration

## Required Packages

```json
{
  "@azure/event-hubs": "^5.12.0",
  "@azure/eventhubs-checkpointstore-blob": "^1.0.1",
  "@azure/storage-blob": "^12.17.0"
}
```

## Installation

```bash
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your Azure credentials:
   - `EVENT_HUB_CONNECTION_STRING`: Your Event Hub connection string
   - `EVENT_HUB_NAME`: Your Event Hub name
   - `STORAGE_CONNECTION_STRING`: Azure Storage connection string for checkpoints
   - `STORAGE_CONTAINER_NAME`: Container name for checkpoint storage
   - `CONSUMER_GROUP`: Consumer group name (default: $Default)

## Getting Azure Credentials

### Event Hub Connection String
1. Go to Azure Portal → Event Hubs namespace
2. Navigate to "Shared access policies"
3. Select or create a policy with Send/Listen permissions
4. Copy the connection string

### Storage Connection String
1. Go to Azure Portal → Storage Account
2. Navigate to "Access keys"
3. Copy the connection string from key1 or key2

## Usage

### Run with ts-node (recommended for development)
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

### 1. Sending Events
```typescript
const producer = new EventHubProducerClient(connectionString, eventHubName);
const batch = await producer.createBatch();

// Add events with custom properties
batch.tryAdd({
  body: { message: "Hello", timestamp: new Date() },
  properties: { customProperty: "value", priority: "high" }
});

await producer.sendBatch(batch);
await producer.close();
```

### 2. Receiving Events with Checkpointing
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
      console.log(event.body);
    }
    // Save checkpoint after processing
    await context.updateCheckpoint(events[events.length - 1]);
  },
  processError: async (error, context) => {
    console.error(error);
  }
});

// Graceful shutdown
await subscription.close();
```

## Key Concepts

### Batching
- Use `createBatch()` to create efficient batches
- `tryAdd()` returns false if event doesn't fit
- Send batch when full or ready

### Checkpointing
- Stores consumer position in Azure Blob Storage
- Enables resume from last processed event
- Update checkpoint after successful processing
- Prevents duplicate processing after restarts

### Consumer Groups
- Multiple consumers can read in parallel
- Each consumer group maintains independent checkpoints
- Default consumer group: `$Default`

### Graceful Shutdown
- Close subscriptions properly with `close()`
- Handle SIGINT and SIGTERM signals
- Ensures checkpoints are saved before exit

## Output Example

```
=== Starting Event Producer ===

Created event batch

Added event 1 to batch
Added event 2 to batch
...
Added event 10 to batch

Sending batch with 10 events...
✓ Batch sent successfully!

Producer client closed

=== Starting Event Consumer ===

Consumer client created with BlobCheckpointStore

--- Received 10 event(s) from partition: 0 ---

Event Body: {
  "message": "Event message 1",
  "timestamp": "2026-05-01T23:09:28.123Z",
  "sequenceNumber": 1
}
Custom Properties: { customProperty: 'CustomValue1', priority: 'normal' }

✓ Checkpoint updated for partition 0
```

## Troubleshooting

### Connection Issues
- Verify connection strings are correct
- Check firewall rules allow access
- Ensure Event Hub and Storage Account exist

### No Events Received
- Wait a few seconds for events to propagate
- Check consumer group name matches
- Verify events were sent successfully

### Checkpoint Errors
- Ensure storage container exists (create manually or let SDK create it)
- Verify storage account permissions
- Check storage connection string format

## Architecture

```
┌─────────────┐         ┌──────────────────┐
│  Producer   │ ───────>│   Event Hub      │
│   Client    │         │   (10 events)    │
└─────────────┘         └──────────────────┘
                                │
                                │ subscribe
                                ▼
                        ┌──────────────────┐
                        │   Consumer       │
                        │   Client         │
                        └──────────────────┘
                                │
                                │ checkpoint
                                ▼
                        ┌──────────────────┐
                        │  Blob Storage    │
                        │  (checkpoints)   │
                        └──────────────────┘
```

## License

MIT
