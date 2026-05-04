# Azure Event Hubs TypeScript Demo

This demo shows how to send and receive events with Azure Event Hubs using TypeScript.

## Features

1. **EventHubProducerClient** - Send events to Event Hubs
2. **Batch Processing** - Create and send batches of events with custom properties
3. **EventHubConsumerClient** - Receive events from Event Hubs
4. **Checkpoint Store** - Use BlobCheckpointStore for reliable event processing
5. **Event Handlers** - Process events and handle errors
6. **Graceful Shutdown** - Properly close connections

## Prerequisites

- Node.js 14+ and npm
- Azure subscription
- Azure Event Hubs namespace and Event Hub
- Azure Storage Account (for checkpointing)

## Required npm Packages

```bash
npm install
```

This installs:
- `@azure/event-hubs` - Azure Event Hubs client library
- `@azure/eventhubs-checkpointstore-blob` - Blob storage checkpoint store
- `@azure/storage-blob` - Azure Blob Storage client

## Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Azure credentials in `.env`:
   - `EVENT_HUB_CONNECTION_STRING` - Your Event Hubs connection string
   - `EVENT_HUB_NAME` - Name of your Event Hub
   - `STORAGE_CONNECTION_STRING` - Storage account connection string
   - `STORAGE_CONTAINER_NAME` - Container for checkpoints (default: eventhubs-checkpoints)
   - `CONSUMER_GROUP` - Consumer group name (default: $Default)

## Running the Demo

### Using ts-node (development):
```bash
npm run dev
```

### Using compiled JavaScript:
```bash
npm run build
npm start
```

## What the Demo Does

1. **Sends 10 events** with custom properties:
   - Event number
   - Timestamp
   - Source application
   - Priority level

2. **Creates a consumer** with blob checkpoint store

3. **Subscribes to events** with handlers for:
   - Processing events (prints body, properties, metadata)
   - Error handling
   - Checkpoint updates

4. **Gracefully shuts down** all connections

## Key Concepts

### Producer Pattern
```typescript
const producer = new EventHubProducerClient(connectionString, eventHubName);
const batch = await producer.createBatch();
batch.tryAdd(eventData);
await producer.sendBatch(batch);
await producer.close();
```

### Consumer Pattern with Checkpointing
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
      // Process event
      await context.updateCheckpoint(event);
    }
  },
  processError: async (error, context) => {
    console.error(error);
  }
});

await subscription.close();
await consumer.close();
```

## Output Example

```
=== Sending Events ===
Added event 1 to batch
Added event 2 to batch
...
Successfully sent 10 events

=== Receiving Events ===
Subscription started. Waiting for events...

Received 1 events from partition: 0

--- Event 1 ---
Body: Event message 1
Properties: { eventNumber: 1, timestamp: '2026-05-01T...' }
Checkpoint updated for partition 0
...
```
