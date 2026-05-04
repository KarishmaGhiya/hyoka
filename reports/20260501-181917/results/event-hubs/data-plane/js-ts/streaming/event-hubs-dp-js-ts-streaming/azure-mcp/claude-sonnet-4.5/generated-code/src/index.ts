import {
  EventHubProducerClient,
  EventHubConsumerClient,
  EventData,
  Subscription,
  ReceivedEventData,
} from "@azure/event-hubs";
import { BlobCheckpointStore } from "@azure/eventhubs-checkpointstore-blob";
import { ContainerClient } from "@azure/storage-blob";

// Configuration - Replace with your actual connection strings
const EVENT_HUB_CONNECTION_STRING = process.env.EVENT_HUB_CONNECTION_STRING || 
  "Endpoint=sb://YOUR-NAMESPACE.servicebus.windows.net/;SharedAccessKeyName=YOUR-KEY-NAME;SharedAccessKey=YOUR-KEY";
const EVENT_HUB_NAME = process.env.EVENT_HUB_NAME || "YOUR-EVENT-HUB-NAME";
const CONSUMER_GROUP = process.env.CONSUMER_GROUP || "$Default";

// Blob Storage for checkpoint management
const STORAGE_CONNECTION_STRING = process.env.STORAGE_CONNECTION_STRING || 
  "DefaultEndpointsProtocol=https;AccountName=YOUR-ACCOUNT;AccountKey=YOUR-KEY;EndpointSuffix=core.windows.net";
const CONTAINER_NAME = process.env.CONTAINER_NAME || "eventhub-checkpoints";

/**
 * Producer: Send events to Event Hub
 */
async function sendEvents(): Promise<void> {
  console.log("\n=== PRODUCER: Sending Events ===");
  
  // Create producer client
  const producer = new EventHubProducerClient(
    EVENT_HUB_CONNECTION_STRING,
    EVENT_HUB_NAME
  );

  try {
    // Create a batch
    const batch = await producer.createBatch();
    console.log(`Created batch with max size: ${batch.maxSizeInBytes} bytes`);

    // Add 10 events with custom properties
    for (let i = 1; i <= 10; i++) {
      const eventData: EventData = {
        body: {
          id: i,
          message: `Event message ${i}`,
          timestamp: new Date().toISOString(),
          data: {
            sensor: `sensor-${i % 3}`,
            temperature: 20 + Math.random() * 10,
            humidity: 40 + Math.random() * 30,
          },
        },
        properties: {
          eventType: "sensor-reading",
          priority: i % 2 === 0 ? "high" : "normal",
          source: "demo-app",
          version: "1.0",
        },
        contentType: "application/json",
      };

      const isAdded = batch.tryAdd(eventData);
      if (!isAdded) {
        console.warn(`Event ${i} could not be added to batch (batch full)`);
        break;
      }
      console.log(`✓ Added event ${i} to batch`);
    }

    console.log(`\nBatch contains ${batch.count} events`);
    console.log(`Batch size: ${batch.sizeInBytes} bytes`);

    // Send the batch
    console.log("\nSending batch...");
    await producer.sendBatch(batch);
    console.log("✓ Batch sent successfully!");

  } catch (error) {
    console.error("Error sending events:", error);
    throw error;
  } finally {
    // Graceful shutdown
    await producer.close();
    console.log("✓ Producer closed");
  }
}

/**
 * Consumer: Receive events from Event Hub with checkpoint management
 */
async function receiveEvents(): Promise<Subscription> {
  console.log("\n=== CONSUMER: Receiving Events ===");

  // Create blob container client for checkpoint store
  const containerClient = new ContainerClient(
    STORAGE_CONNECTION_STRING,
    CONTAINER_NAME
  );

  // Ensure container exists
  await containerClient.createIfNotExists();
  console.log(`✓ Checkpoint container ready: ${CONTAINER_NAME}`);

  // Create checkpoint store
  const checkpointStore = new BlobCheckpointStore(containerClient);

  // Create consumer client
  const consumer = new EventHubConsumerClient(
    CONSUMER_GROUP,
    EVENT_HUB_CONNECTION_STRING,
    EVENT_HUB_NAME,
    checkpointStore
  );

  let eventCount = 0;

  // Subscribe to events
  const subscription = consumer.subscribe({
    /**
     * Process incoming events
     */
    processEvents: async (events: ReceivedEventData[], context) => {
      if (events.length === 0) {
        console.log(`No events received in partition ${context.partitionId}`);
        return;
      }

      console.log(`\n--- Received ${events.length} event(s) from partition ${context.partitionId} ---`);

      for (const event of events) {
        eventCount++;
        
        // Print event details
        console.log(`\nEvent #${eventCount}:`);
        console.log(`  Sequence Number: ${event.sequenceNumber}`);
        console.log(`  Offset: ${event.offset}`);
        console.log(`  Enqueued Time: ${event.enqueuedTimeUtc}`);
        
        // Print event body
        console.log(`  Body:`, JSON.stringify(event.body, null, 2));
        
        // Print custom properties
        if (event.properties) {
          console.log(`  Properties:`, event.properties);
        }

        // Print system properties
        console.log(`  Content Type: ${event.contentType}`);
        console.log(`  Partition Key: ${event.partitionKey || "none"}`);
      }

      // Update checkpoint after processing all events
      try {
        await context.updateCheckpoint(events[events.length - 1]);
        console.log(`✓ Checkpoint updated for partition ${context.partitionId}`);
      } catch (error) {
        console.error(`Error updating checkpoint:`, error);
      }
    },

    /**
     * Handle errors
     */
    processError: async (error, context) => {
      console.error(`\n❌ ERROR in partition ${context.partitionId}:`);
      console.error(`  Error: ${error.message}`);
      console.error(`  Full error:`, error);
    },
  });

  console.log("✓ Subscribed to Event Hub");
  console.log("  Listening for events... (Press Ctrl+C to stop)");

  return subscription;
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log("=================================");
  console.log("Azure Event Hubs TypeScript Demo");
  console.log("=================================");

  let subscription: Subscription | undefined;

  try {
    // Step 1: Send events
    await sendEvents();

    // Wait a bit for events to be available
    console.log("\nWaiting 3 seconds for events to be available...");
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 2: Receive events
    subscription = await receiveEvents();

    // Keep the consumer running for 30 seconds to receive events
    console.log("\nConsumer will run for 30 seconds...");
    await new Promise(resolve => setTimeout(resolve, 30000));

  } catch (error) {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  } finally {
    // Graceful shutdown
    console.log("\n\n=== SHUTDOWN ===");
    if (subscription) {
      console.log("Closing subscription...");
      await subscription.close();
      console.log("✓ Subscription closed");
    }
    console.log("\n✓ Demo completed successfully!");
  }
}

// Handle process termination
process.on("SIGINT", async () => {
  console.log("\n\nReceived SIGINT, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n\nReceived SIGTERM, shutting down gracefully...");
  process.exit(0);
});

// Run the demo
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
