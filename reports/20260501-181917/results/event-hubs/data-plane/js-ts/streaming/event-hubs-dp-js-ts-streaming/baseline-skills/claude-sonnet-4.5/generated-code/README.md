# Azure Event Hubs TypeScript Demo

A comprehensive TypeScript demonstration of Azure Event Hubs featuring event production, consumption with checkpointing, and graceful shutdown patterns.

## Features

This demo showcases:

1. ✅ **EventHubProducerClient** - Creating producer with connection string
2. ✅ **Batch Creation** - Using `createBatch()` to create event batches
3. ✅ **Custom Properties** - Adding 10 events with custom properties
4. ✅ **Batch Sending** - Sending batches with `sendBatch()`
5. ✅ **EventHubConsumerClient** - Creating consumer with BlobCheckpointStore
6. ✅ **Event Subscription** - Using `subscribe()` with event handlers
7. ✅ **Event Processing** - Printing event bodies and properties
8. ✅ **Checkpointing** - Updating checkpoints after processing
9. ✅ **Graceful Shutdown** - Proper cleanup with `close()` methods

## Prerequisites

- Node.js 16.x or higher
- An Azure subscription
- Azure Event Hubs namespace and event hub
- Azure Storage account for checkpointing

## Required npm Packages

```json
{
  "@azure/event-hubs": "^5.12.0",
  "@azure/eventhubs-checkpointstore-blob": "^1.0.1",
  "@azure/storage-blob": "^12.18.0"
}
```

## Installation

```bash
npm install
```

## Azure Resources Setup

### 1. Create Event Hubs Namespace and Event Hub

```bash
# Set variables
RESOURCE_GROUP="myResourceGroup"
LOCATION="eastus"
NAMESPACE_NAME="myEventHubNamespace"
EVENTHUB_NAME="my-event-hub"

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create Event Hubs namespace
az eventhubs namespace create \
  --resource-group $RESOURCE_GROUP \
  --name $NAMESPACE_NAME \
  --location $LOCATION \
  --sku Standard

# Create event hub
az eventhubs eventhub create \
  --resource-group $RESOURCE_GROUP \
  --namespace-name $NAMESPACE_NAME \
  --name $EVENTHUB_NAME \
  --partition-count 4 \
  --message-retention 1

# Get connection string
az eventhubs namespace authorization-rule keys list \
  --resource-group $RESOURCE_GROUP \
  --namespace-name $NAMESPACE_NAME \
  --name RootManageSharedAccessKey \
  --query primaryConnectionString \
  --output tsv
```

### 2. Create Storage Account for Checkpointing

```bash
STORAGE_ACCOUNT="mycheckpointstorage"
CONTAINER_NAME="eventhub-checkpoints"

# Create storage account
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS

# Get connection string
az storage account show-connection-string \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --query connectionString \
  --output tsv

# Create container (or let the app create it)
az storage container create \
  --name $CONTAINER_NAME \
  --account-name $STORAGE_ACCOUNT
```

## Environment Configuration

Create a `.env` file in the project root:

```env
# Event Hubs Configuration
EVENTHUB_CONNECTION_STRING="Endpoint=sb://myeventhubnamespace.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=YOUR_KEY"
EVENTHUB_NAME="my-event-hub"

# Storage Configuration for Checkpointing
STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=mystorageaccount;AccountKey=YOUR_KEY;EndpointSuffix=core.windows.net"
STORAGE_CONTAINER_NAME="eventhub-checkpoints"
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `EVENTHUB_CONNECTION_STRING` | Event Hubs namespace connection string | Yes |
| `EVENTHUB_NAME` | Name of the event hub | Yes |
| `STORAGE_CONNECTION_STRING` | Storage account connection string for checkpointing | Yes |
| `STORAGE_CONTAINER_NAME` | Container name for checkpoint storage | No (default: "eventhub-checkpoints") |

## Usage

### Run the demo:

```bash
npm start
```

### For development with auto-reload:

```bash
npm run dev
```

### Build TypeScript:

```bash
npm run build
```

## How It Works

### 1. Event Production (Lines 25-68)

```typescript
// Create producer client with connection string
const producerClient = new EventHubProducerClient(
  eventHubConnectionString,
  eventHubName
);

// Create batch
const batch = await producerClient.createBatch();

// Add events with custom properties
for (let i = 1; i <= 10; i++) {
  batch.tryAdd({
    body: { message: `Event ${i}`, value: Math.random() * 100 },
    properties: {
      eventType: "telemetry",
      deviceId: `device-${i}`,
      priority: i <= 5 ? "high" : "normal"
    }
  });
}

// Send batch
await producerClient.sendBatch(batch);
```

### 2. Event Consumption with Checkpointing (Lines 76-185)

```typescript
// Create checkpoint store
const containerClient = new ContainerClient(
  storageConnectionString,
  storageContainerName
);
const checkpointStore = new BlobCheckpointStore(containerClient);

// Create consumer with checkpoint store
const consumerClient = new EventHubConsumerClient(
  "$Default",
  eventHubConnectionString,
  eventHubName,
  checkpointStore
);

// Subscribe to events
const subscription = consumerClient.subscribe({
  processEvents: async (events, context) => {
    // Process each event
    for (const event of events) {
      console.log(`Body: ${JSON.stringify(event.body)}`);
      console.log(`Properties: ${JSON.stringify(event.properties)}`);
    }
    
    // Update checkpoint
    if (events.length > 0) {
      await context.updateCheckpoint(events[events.length - 1]);
    }
  },
  processError: async (err, context) => {
    console.error(`Error on partition ${context.partitionId}: ${err.message}`);
  }
});
```

### 3. Graceful Shutdown (Lines 194-222)

```typescript
async function gracefulShutdown() {
  // Close subscription (stops receiving)
  await subscription.close();
  
  // Close consumer client
  await consumerClient.close();
  
  // Close producer client
  await producerClient.close();
}

// Handle SIGINT (Ctrl+C) and SIGTERM
process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
```

## Program Flow

1. **Initialization**: Validates configuration and sets up signal handlers
2. **Send Events**: Creates producer, builds batch with 10 events, sends to Event Hub
3. **Wait**: Brief pause to allow events to be available
4. **Receive Events**: Starts consumer with checkpoint store, subscribes to all partitions
5. **Process Events**: Prints event details and updates checkpoints after each batch
6. **Shutdown**: After processing target events, gracefully closes all resources

## Output Example

```
========================================
  Azure Event Hubs Demo
========================================

Configuration:
  Event Hub Name: my-event-hub
  Consumer Group: $Default
  Checkpoint Container: eventhub-checkpoints

=== SENDING EVENTS ===

Added event 1 to batch
Added event 2 to batch
...
Added event 10 to batch

Sending batch of 10 events...
✓ Successfully sent 10 events to Event Hub

=== RECEIVING EVENTS ===

✓ Checkpoint storage container ready: eventhub-checkpoints

Started receiving from partition 0
Subscription started. Waiting for events...

Received 10 events from partition 0:

--- Event 1 ---
Body: {"message":"Event message 1","timestamp":"2024-01-15T10:30:00.000Z","value":45.23}
Sequence Number: 1234
Custom Properties:
  Event Type: telemetry
  Device ID: device-1
  Priority: high

✓ Checkpointed at sequence number 1243 for partition 0

✓ Processed 10 events. Initiating shutdown...

=== GRACEFUL SHUTDOWN ===

Closing subscription...
✓ Subscription closed
Closing consumer client...
✓ Consumer client closed
Closing producer client...
✓ Producer client closed

✓ Graceful shutdown complete
```

## Key Concepts

### Checkpointing

- **Purpose**: Track processing progress per partition
- **Storage**: Uses Azure Blob Storage via BlobCheckpointStore
- **Strategy**: Checkpoint after each batch for reliability
- **Resume**: Automatically resumes from last checkpoint on restart

### Consumer Groups

- **Default**: `$Default` consumer group used by default
- **Multiple Consumers**: Use same consumer group for load balancing
- **Separate Pipelines**: Use different consumer groups for independent processing

### Partition Processing

- **Parallel**: Multiple partitions processed concurrently
- **Ordering**: Events within a partition are ordered
- **Load Balancing**: Partitions automatically distributed across consumers

### Error Handling

- **processError**: Handles SDK-level errors (connection, auth)
- **Per-Event**: Wrap individual event processing in try-catch
- **Retry**: SDK automatically retries transient errors
- **Checkpoint**: Don't checkpoint on processing failures

## Best Practices Demonstrated

1. ✅ **Batch Sending**: Use `createBatch()` for efficient transmission
2. ✅ **Custom Properties**: Add metadata for event routing and filtering
3. ✅ **Checkpoint Store**: Use BlobCheckpointStore for production
4. ✅ **After Processing**: Checkpoint only after successful processing
5. ✅ **Error Handling**: Separate handlers for SDK and processing errors
6. ✅ **Graceful Shutdown**: Properly close all resources
7. ✅ **Signal Handling**: Handle SIGINT/SIGTERM for clean shutdown
8. ✅ **Configuration**: Use environment variables for credentials

## Troubleshooting

### Connection Issues

- Verify Event Hubs connection string is correct
- Check firewall rules allow connection to `*.servicebus.windows.net`
- Ensure network allows AMQP (port 5671)

### No Events Received

- Verify events were sent successfully
- Check consumer is reading from correct Event Hub
- Try `earliestEventPosition` to read all events
- Verify checkpoint store container exists

### Checkpoint Errors

- Ensure Storage connection string is correct
- Verify container exists or app has permissions to create it
- Check storage account allows blob operations

## Additional Resources

- [Azure Event Hubs Documentation](https://learn.microsoft.com/azure/event-hubs/)
- [@azure/event-hubs SDK Reference](https://www.npmjs.com/package/@azure/event-hubs)
- [@azure/eventhubs-checkpointstore-blob](https://www.npmjs.com/package/@azure/eventhubs-checkpointstore-blob)
- [Event Hubs Quotas and Limits](https://learn.microsoft.com/azure/event-hubs/event-hubs-quotas)

## License

MIT
