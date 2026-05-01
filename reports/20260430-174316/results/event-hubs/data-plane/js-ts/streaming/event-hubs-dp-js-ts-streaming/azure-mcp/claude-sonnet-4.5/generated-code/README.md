# Azure Event Hubs TypeScript Demo

A comprehensive demonstration of Azure Event Hubs operations using TypeScript, including:
- Event production with batching
- Event consumption with checkpoint management
- Custom properties and metadata
- Graceful shutdown handling

## Features

### Producer
- ✅ Creates `EventHubProducerClient` using connection string
- ✅ Creates batch with `createBatch()`
- ✅ Adds 10 events with custom properties (priority, category, source, eventType)
- ✅ Sends batch using `sendBatch()`
- ✅ Implements graceful shutdown with `close()`

### Consumer
- ✅ Creates `EventHubConsumerClient` with `BlobCheckpointStore`
- ✅ Subscribes to events using `subscribe()`
- ✅ Implements `processEvents` handler to print event bodies and metadata
- ✅ Implements `processError` handler for error management
- ✅ Updates checkpoints after processing events
- ✅ Implements graceful shutdown with `close()`

## Required Packages

```json
{
  "@azure/event-hubs": "^5.11.0",
  "@azure/storage-blob": "^12.17.0",
  "@azure/eventhubs-checkpointstore-blob": "^1.0.1"
}
```

## Prerequisites

1. **Azure Event Hub**
   - Event Hubs namespace
   - Event Hub instance
   - Connection string with send/receive permissions

2. **Azure Storage Account**
   - Storage account for checkpoint store
   - Connection string with blob permissions

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

3. **Build TypeScript**:
   ```bash
   npm run build
   ```

## Usage

### Run the demo
```bash
npm start
```

### Development mode
```bash
npm run dev
```

## How It Works

### 1. Producer Flow
```typescript
// Create producer client
const producer = new EventHubProducerClient(connectionString, eventHubName);

// Create batch
const batch = await producer.createBatch();

// Add events with custom properties
batch.tryAdd({
  body: { message: "Hello", timestamp: new Date() },
  properties: { priority: "high", category: "important" }
});

// Send batch
await producer.sendBatch(batch);

// Close gracefully
await producer.close();
```

### 2. Consumer Flow
```typescript
// Create checkpoint store
const checkpointStore = new BlobCheckpointStore(containerClient);

// Create consumer client
const consumer = new EventHubConsumerClient(
  consumerGroup,
  connectionString,
  eventHubName,
  checkpointStore
);

// Subscribe to events
consumer.subscribe({
  processEvents: async (events, context) => {
    for (const event of events) {
      console.log(event.body);
    }
    // Update checkpoint
    await context.updateCheckpoint(events[events.length - 1]);
  },
  processError: async (error, context) => {
    console.error("Error:", error);
  }
});

// Close gracefully
await consumer.close();
```

## Event Structure

Each event includes:
- **Body**: JSON payload with message, timestamp, and sequence number
- **Properties**: Custom metadata (priority, category, source, eventType)
- **System Properties**: Partition key, sequence number, offset, enqueued time

## Checkpoint Management

The demo uses Azure Blob Storage as a checkpoint store to:
- Track the last processed event in each partition
- Enable resume from last checkpoint after restarts
- Support distributed consumers with automatic load balancing

## Graceful Shutdown

The application handles:
- `SIGINT` (Ctrl+C)
- `SIGTERM` (process termination)
- Automatic cleanup after processing all events

## Output Example

```
╔════════════════════════════════════════════════════════╗
║  Azure Event Hubs TypeScript Demo                     ║
║  Producer & Consumer with Checkpoint Store            ║
╚════════════════════════════════════════════════════════╝

=== PRODUCER: Starting event production ===

Created event batch
Added event 1 to batch with priority: normal
Added event 2 to batch with priority: normal
Added event 3 to batch with priority: high
...
✓ Batch sent successfully
✓ Producer closed

=== CONSUMER: Starting event consumption ===

Consumer client created with checkpoint store
✓ Subscribed to Event Hub. Waiting for events...

--- Received 10 events from partition 0 ---

Event #1:
  Body: {"message":"Event message 1","timestamp":"2026-04-30T18:12:00.000Z","sequenceNumber":1}
  Properties: {"priority":"normal","category":"category-1","source":"demo-producer","eventType":"custom-event"}
...
✓ Checkpoint updated for partition 0
✓ Received all 10 events. Stopping consumer...
```

## Error Handling

The demo includes:
- Try-catch blocks for all async operations
- Error logging in `processError` handler
- Graceful degradation on checkpoint failures
- Proper resource cleanup in finally blocks

## Best Practices Demonstrated

✅ Async/await patterns throughout  
✅ Connection string configuration via environment variables  
✅ Batch processing for efficient throughput  
✅ Checkpoint management for reliability  
✅ Error handling and logging  
✅ Graceful shutdown and resource cleanup  
✅ TypeScript strict mode for type safety  

## License

MIT
