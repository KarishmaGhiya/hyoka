# Azure Event Hubs - Quick API Reference

## Producer APIs

### EventHubProducerClient

```typescript
import { EventHubProducerClient } from "@azure/event-hubs";

// Create with connection string
const producer = new EventHubProducerClient(
  connectionString,
  eventHubName
);

// Create with namespace + credential
const producer = new EventHubProducerClient(
  fullyQualifiedNamespace,
  eventHubName,
  credential
);
```

### Create and Send Batch

```typescript
// Create batch
const batch = await producer.createBatch();

// Add event to batch
const added = batch.tryAdd({
  body: { /* your data */ },
  properties: { /* custom properties */ },
  contentType: "application/json",
  correlationId: "id-123"
});

// Send batch
await producer.sendBatch(batch);

// Close producer
await producer.close();
```

### Partition-Specific Sending

```typescript
// By partition ID
const batch = await producer.createBatch({ partitionId: "0" });

// By partition key (for ordering)
const batch = await producer.createBatch({ partitionKey: "device-123" });
```

## Consumer APIs

### EventHubConsumerClient

```typescript
import { EventHubConsumerClient } from "@azure/event-hubs";
import { ContainerClient } from "@azure/storage-blob";
import { BlobCheckpointStore } from "@azure/eventhubs-checkpointstore-blob";

// Create checkpoint store
const containerClient = new ContainerClient(
  storageConnectionString,
  containerName
);
await containerClient.createIfNotExists();

const checkpointStore = new BlobCheckpointStore(containerClient);

// Create consumer with checkpoint store
const consumer = new EventHubConsumerClient(
  consumerGroup,
  connectionString,
  eventHubName,
  checkpointStore
);
```

### Subscribe to Events

```typescript
const subscription = consumer.subscribe(
  {
    processInitialize: async (context) => {
      console.log(`Started partition ${context.partitionId}`);
    },

    processEvents: async (events, context) => {
      for (const event of events) {
        // Access event properties
        console.log(event.body);
        console.log(event.sequenceNumber);
        console.log(event.offset);
        console.log(event.enqueuedTimeUtc);
        console.log(event.partitionKey);
        console.log(event.properties);
      }
      
      // Checkpoint after processing
      if (events.length > 0) {
        await context.updateCheckpoint(events[events.length - 1]);
      }
    },

    processError: async (err, context) => {
      console.error(`Error on ${context.partitionId}: ${err.message}`);
    },

    processClose: async (reason, context) => {
      console.log(`Closed partition ${context.partitionId}: ${reason}`);
    }
  },
  {
    startPosition: earliestEventPosition,  // or latestEventPosition
    maxBatchSize: 100,
    maxWaitTimeInSeconds: 30,
    trackLastEnqueuedEventProperties: true
  }
);
```

### Subscribe to Specific Partition

```typescript
const subscription = consumer.subscribe(
  "0",  // Partition ID
  {
    processEvents: async (events, context) => { /* ... */ },
    processError: async (err, context) => { /* ... */ }
  }
);
```

### Start Positions

```typescript
import { earliestEventPosition, latestEventPosition } from "@azure/event-hubs";

// From beginning
{ startPosition: earliestEventPosition }

// From end (new events only)
{ startPosition: latestEventPosition }

// From specific offset
{ startPosition: { offset: "12345" } }

// From specific sequence number
{ startPosition: { sequenceNumber: 1000 } }

// From specific time
{ startPosition: { enqueuedOn: new Date("2024-01-01") } }

// Different positions per partition
{
  startPosition: {
    "0": earliestEventPosition,
    "1": latestEventPosition,
    "2": { offset: "5000" }
  }
}
```

## Event Structure

### EventData (Sending)

```typescript
interface EventData {
  body: any;                              // Event payload
  properties?: Record<string, any>;       // Custom properties
  contentType?: string;                   // MIME type
  correlationId?: string | number | Buffer;  // For tracing
  messageId?: string | number | Buffer;      // Unique identifier
}
```

### ReceivedEventData (Receiving)

```typescript
interface ReceivedEventData {
  body: any;                              // Event payload
  properties?: Record<string, any>;       // Custom properties
  contentType?: string;
  correlationId?: string | number | Buffer;
  messageId?: string | number | Buffer;
  
  // System properties
  sequenceNumber: number;                 // Unique per partition
  offset: string;                         // Position in partition
  enqueuedTimeUtc: Date;                  // When event was enqueued
  partitionKey: string | null;            // Partition routing key
  systemProperties?: Record<string, any>;
}
```

## Checkpointing

### Update Checkpoint

```typescript
processEvents: async (events, context) => {
  // Process events...
  
  // Checkpoint at last event
  if (events.length > 0) {
    await context.updateCheckpoint(events[events.length - 1]);
  }
}
```

### Checkpoint Strategies

```typescript
// Every batch
await context.updateCheckpoint(events[events.length - 1]);

// Every N events
if (processedCount % 100 === 0) {
  await context.updateCheckpoint(event);
}

// Time-based
if (Date.now() - lastCheckpointTime > 30000) {
  await context.updateCheckpoint(lastEvent);
}
```

## Graceful Shutdown

```typescript
// Close subscription (stops receiving new events)
await subscription.close();

// Close consumer client
await consumer.close();

// Close producer client
await producer.close();

// Signal handlers
process.on("SIGINT", async () => {
  await subscription.close();
  await consumer.close();
  process.exit(0);
});
```

## Error Handling

```typescript
processEvents: async (events, context) => {
  try {
    for (const event of events) {
      await processEvent(event);
    }
    await context.updateCheckpoint(events[events.length - 1]);
  } catch (error) {
    // Don't checkpoint on error - events will be reprocessed
    console.error("Processing failed:", error);
  }
},

processError: async (err, context) => {
  if (err.name === "MessagingError") {
    // Transient error - SDK will retry
    console.warn("Transient error:", err.message);
  } else {
    // Fatal error
    console.error("Fatal error:", err);
  }
}
```

## Hub and Partition Properties

```typescript
// Get hub properties
const hubProps = await producer.getEventHubProperties();
console.log(`Partitions: ${hubProps.partitionIds}`);
console.log(`Created: ${hubProps.createdOn}`);

// Get partition properties
const partitionProps = await producer.getPartitionProperties("0");
console.log(`Last sequence: ${partitionProps.lastEnqueuedSequenceNumber}`);
console.log(`Last offset: ${partitionProps.lastEnqueuedOffset}`);
console.log(`Last enqueued: ${partitionProps.lastEnqueuedTimeUtc}`);
```

## Common Patterns

### Send Multiple Events

```typescript
const batch = await producer.createBatch();

for (const item of items) {
  const added = batch.tryAdd({ body: item });
  
  if (!added) {
    // Batch is full - send and create new batch
    await producer.sendBatch(batch);
    const newBatch = await producer.createBatch();
    newBatch.tryAdd({ body: item });
  }
}

if (batch.count > 0) {
  await producer.sendBatch(batch);
}
```

### Ordered Processing (by partition key)

```typescript
// Producer: Use partition key for related events
const batch = await producer.createBatch({ 
  partitionKey: customerId 
});
batch.tryAdd({ body: customerEvent });
await producer.sendBatch(batch);

// Consumer: Events with same key go to same partition (ordered)
```

### Monitor Lag

```typescript
const subscription = consumer.subscribe(
  {
    processEvents: async (events, context) => {
      if (context.lastEnqueuedEventProperties) {
        const lastEnqueued = context.lastEnqueuedEventProperties.sequenceNumber;
        const lastProcessed = events[events.length - 1]?.sequenceNumber || 0;
        const lag = lastEnqueued - lastProcessed;
        
        console.log(`Partition ${context.partitionId} lag: ${lag}`);
      }
    }
  },
  { trackLastEnqueuedEventProperties: true }
);
```

## Environment Setup

```bash
# Install packages
npm install @azure/event-hubs @azure/eventhubs-checkpointstore-blob @azure/storage-blob

# Set environment variables
export EVENTHUB_CONNECTION_STRING="Endpoint=sb://..."
export EVENTHUB_NAME="my-hub"
export STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;..."
export STORAGE_CONTAINER_NAME="checkpoints"
```

## Best Practices

1. ✓ Use `createBatch()` for efficient sending
2. ✓ Always use checkpoint store in production
3. ✓ Checkpoint after successful processing
4. ✓ Use partition keys for ordered events
5. ✓ Handle empty event batches
6. ✓ Close all clients on shutdown
7. ✓ Don't checkpoint on processing errors
8. ✓ Use consumer groups for multiple pipelines
9. ✓ Monitor lag in production
10. ✓ Handle both transient and fatal errors
