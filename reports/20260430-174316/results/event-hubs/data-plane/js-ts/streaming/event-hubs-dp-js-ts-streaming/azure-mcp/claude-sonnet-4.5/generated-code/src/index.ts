import {
  EventHubProducerClient,
  EventHubConsumerClient,
  earliestEventPosition,
  ReceivedEventData,
  PartitionContext
} from "@azure/event-hubs";
import { ContainerClient } from "@azure/storage-blob";
import { BlobCheckpointStore } from "@azure/eventhubs-checkpointstore-blob";

// Configuration - Replace with your actual connection strings
const EVENT_HUB_CONNECTION_STRING = process.env.EVENT_HUB_CONNECTION_STRING || 
  "Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=your-key";
const EVENT_HUB_NAME = process.env.EVENT_HUB_NAME || "your-event-hub-name";
const STORAGE_CONNECTION_STRING = process.env.STORAGE_CONNECTION_STRING || 
  "DefaultEndpointsProtocol=https;AccountName=your-account;AccountKey=your-key;EndpointSuffix=core.windows.net";
const STORAGE_CONTAINER_NAME = process.env.STORAGE_CONTAINER_NAME || "eventhub-checkpoints";
const CONSUMER_GROUP = process.env.CONSUMER_GROUP || "$Default";

/**
 * Produces events to Event Hub
 */
async function produceEvents(): Promise<void> {
  console.log("\n=== PRODUCER: Starting event production ===\n");
  
  // 1. Create EventHubProducerClient using connection string
  const producer = new EventHubProducerClient(
    EVENT_HUB_CONNECTION_STRING,
    EVENT_HUB_NAME
  );

  try {
    // 2. Create a batch with createBatch()
    const batch = await producer.createBatch();
    console.log("Created event batch");

    // 3. Add 10 events with custom properties
    for (let i = 1; i <= 10; i++) {
      const eventData = {
        body: {
          message: `Event message ${i}`,
          timestamp: new Date().toISOString(),
          sequenceNumber: i
        },
        properties: {
          priority: i % 3 === 0 ? "high" : "normal",
          category: `category-${i % 4}`,
          source: "demo-producer",
          eventType: "custom-event"
        }
      };

      const wasAdded = batch.tryAdd(eventData);
      
      if (!wasAdded) {
        console.log(`Event ${i} could not be added to batch (batch full)`);
        break;
      }
      
      console.log(`Added event ${i} to batch with priority: ${eventData.properties.priority}`);
    }

    // 4. Send the batch using sendBatch()
    console.log(`\nSending batch with ${batch.count} events...`);
    await producer.sendBatch(batch);
    console.log("✓ Batch sent successfully");

  } catch (error) {
    console.error("Error in producer:", error);
    throw error;
  } finally {
    // 7. Implement graceful shutdown with close()
    await producer.close();
    console.log("✓ Producer closed");
  }
}

/**
 * Consumes events from Event Hub
 */
async function consumeEvents(): Promise<void> {
  console.log("\n=== CONSUMER: Starting event consumption ===\n");

  // Create BlobCheckpointStore for managing checkpoints
  const containerClient = new ContainerClient(
    STORAGE_CONNECTION_STRING,
    STORAGE_CONTAINER_NAME
  );

  // Ensure the container exists
  await containerClient.createIfNotExists();
  console.log(`Checkpoint store container ready: ${STORAGE_CONTAINER_NAME}`);

  // 4. Create EventHubConsumerClient with BlobCheckpointStore
  const checkpointStore = new BlobCheckpointStore(containerClient);
  const consumer = new EventHubConsumerClient(
    CONSUMER_GROUP,
    EVENT_HUB_CONNECTION_STRING,
    EVENT_HUB_NAME,
    checkpointStore
  );

  console.log("Consumer client created with checkpoint store");

  let eventCount = 0;
  const maxEvents = 10; // Stop after receiving all produced events

  // 5. Subscribe to events using subscribe() with processEvents and processError handlers
  const subscription = consumer.subscribe({
    // Process incoming events
    processEvents: async (
      events: ReceivedEventData[],
      context: PartitionContext
    ): Promise<void> => {
      if (events.length === 0) {
        console.log(`No events received from partition ${context.partitionId}`);
        return;
      }

      console.log(`\n--- Received ${events.length} events from partition ${context.partitionId} ---`);

      for (const event of events) {
        eventCount++;
        
        // 6. Print received event bodies
        console.log(`\nEvent #${eventCount}:`);
        console.log(`  Body: ${JSON.stringify(event.body)}`);
        console.log(`  Properties: ${JSON.stringify(event.properties)}`);
        console.log(`  Partition Key: ${event.partitionKey || "N/A"}`);
        console.log(`  Sequence Number: ${event.sequenceNumber}`);
        console.log(`  Offset: ${event.offset}`);
        console.log(`  Enqueued Time: ${event.enqueuedTimeUtc}`);
      }

      // 6. Update checkpoints after processing events
      try {
        await context.updateCheckpoint(events[events.length - 1]);
        console.log(`✓ Checkpoint updated for partition ${context.partitionId}`);
      } catch (error) {
        console.error(`Error updating checkpoint: ${error}`);
      }

      // Stop after receiving expected number of events
      if (eventCount >= maxEvents) {
        console.log(`\n✓ Received all ${maxEvents} events. Stopping consumer...`);
        await subscription.close();
        await consumer.close();
      }
    },

    // Process errors
    processError: async (error: Error, context: PartitionContext): Promise<void> => {
      console.error(`\n✗ Error on partition ${context.partitionId}:`, error);
    }
  }, {
    startPosition: earliestEventPosition // Start from the beginning of the partition
  });

  console.log("✓ Subscribed to Event Hub. Waiting for events...\n");
}

/**
 * Main execution flow
 */
async function main(): Promise<void> {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║  Azure Event Hubs TypeScript Demo                     ║");
  console.log("║  Producer & Consumer with Checkpoint Store            ║");
  console.log("╚════════════════════════════════════════════════════════╝");

  try {
    // Produce events first
    await produceEvents();

    // Wait a moment for events to be available
    console.log("\nWaiting 2 seconds before starting consumer...");
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Consume events
    await consumeEvents();

    // Keep process alive to receive events
    console.log("\nListening for events... (will auto-stop after receiving all events)");
    
    // Wait up to 30 seconds for events to be processed
    await new Promise(resolve => setTimeout(resolve, 30000));

  } catch (error) {
    console.error("\n✗ Fatal error:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n\nReceived SIGINT. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n\nReceived SIGTERM. Shutting down gracefully...");
  process.exit(0);
});

// Run the demo
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
