# Azure Event Hubs TypeScript Demo

A comprehensive TypeScript demonstration of Azure Event Hubs streaming with both producer and consumer functionality.

## Features

✅ **Producer Client**
- Create EventHubProducerClient with connection string
- Create event batches with `createBatch()`
- Add events with custom properties
- Send batches with `sendBatch()`

✅ **Consumer Client**
- EventHubConsumerClient with BlobCheckpointStore
- Subscribe to events with `subscribe()`
- Process events with `processEvents` handler
- Handle errors with `processError` handler
- Update checkpoints after processing

✅ **Best Practices**
- Proper async/await patterns
- Graceful shutdown with `close()`
- Signal handling (SIGINT, SIGTERM)
- Error handling and logging
- TypeScript type safety

## Required Packages

```json
{
  "@azure/event-hubs": "^5.12.0",
  "@azure/eventhubs-checkpointstore-blob": "^1.1.0",
  "@azure/storage-blob": "^12.17.0"
}
```

## Prerequisites

1. **Azure Event Hubs Namespace** and Event Hub
2. **Azure Storage Account** for checkpoint storage
3. Node.js 16+ and npm

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

   Required values:
   - `EVENT_HUB_CONNECTION_STRING`: Your Event Hubs connection string
   - `EVENT_HUB_NAME`: Name of your Event Hub
   - `STORAGE_CONNECTION_STRING`: Storage account connection string
   - `STORAGE_CONTAINER_NAME`: Container name for checkpoints (created automatically)
   - `CONSUMER_GROUP`: Consumer group name (defaults to `$Default`)

## Running the Demo

### Using ts-node (recommended for development):
```bash
npm start
```

### Using ts-node-dev (with auto-reload):
```bash
npm run dev
```

### Build and run compiled JavaScript:
```bash
npm run build
node dist/event-hubs-demo.js
```

## What the Demo Does

1. **Sends 10 events** with custom properties:
   - Message body with timestamp and sequence number
   - Custom application properties (eventType, priority, version, customId)

2. **Receives and processes events**:
   - Subscribes to all partitions
   - Prints event body, sequence number, and custom properties
   - Updates checkpoints after each event
   - Automatically shuts down after receiving 10 events

3. **Handles graceful shutdown**:
   - Closes subscription
   - Closes consumer client
   - Handles SIGINT (Ctrl+C) and SIGTERM signals

## Sample Output

```
Azure Event Hubs Streaming Demo
================================

=== Starting Event Producer ===
Created event batch
Added event 1 to batch
Added event 2 to batch
...
✓ Batch sent successfully!
Producer closed

=== Starting Event Consumer ===
Checkpoint store container ready
Subscribed to Event Hub. Waiting for events...

Received 10 event(s) from partition 0

--- Event 1 ---
Body: {
  "message": "Event message 1",
  "timestamp": "2026-04-30T18:12:30.123Z",
  "sequenceNumber": 1
}
Custom Properties: {
  eventType: 'demo',
  priority: 'normal',
  version: '1.0',
  customId: 'event-1'
}
✓ Checkpoint updated
...

=== Initiating Graceful Shutdown ===
✓ Subscription closed
✓ Consumer client closed
=== Shutdown Complete ===
```

## Key Concepts

### Event Batching
Events are sent in batches for efficiency. Use `tryAdd()` to add events to a batch, which returns `false` if the batch is full.

### Checkpointing
The BlobCheckpointStore persists consumer progress. If the consumer restarts, it resumes from the last checkpoint rather than reprocessing all events.

### Partitions
Event Hubs are partitioned for parallel processing. The consumer subscribes to all partitions by default.

### Custom Properties
Application properties allow you to attach metadata to events for routing, filtering, or processing logic.

## Error Handling

The demo includes:
- Try-catch blocks for all async operations
- Error logging with context
- Graceful shutdown on errors
- Process signal handling

## Troubleshooting

**Connection errors:**
- Verify connection strings are correct
- Check firewall rules allow access to Event Hubs and Storage
- Ensure Event Hub and container exist

**No events received:**
- Verify producer sent events successfully
- Check consumer group name matches
- Ensure storage container has proper permissions

**Checkpoint errors:**
- Verify storage connection string is correct
- Check container name and permissions
- Ensure container is created (demo creates it automatically)

## License

MIT
