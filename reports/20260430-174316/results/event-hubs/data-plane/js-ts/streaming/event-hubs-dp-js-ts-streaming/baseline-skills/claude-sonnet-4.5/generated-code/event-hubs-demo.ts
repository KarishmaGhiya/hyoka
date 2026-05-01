import { EventHubProducerClient, EventHubConsumerClient, earliestEventPosition } from "@azure/event-hubs";
import { ContainerClient } from "@azure/storage-blob";
import { BlobCheckpointStore } from "@azure/eventhubs-checkpointstore-blob";

/**
 * Azure Event Hubs Producer and Consumer Demo
 * 
 * This program demonstrates:
 * - Sending events with custom properties using EventHubProducerClient
 * - Receiving events with checkpoint management using EventHubConsumerClient
 * - Graceful shutdown of both producer and consumer
 */

// Configuration - set these environment variables
const eventHubsConnectionString = process.env.EVENT_HUBS_CONNECTION_STRING || "";
const eventHubName = process.env.EVENT_HUB_NAME || "";
const storageConnectionString = process.env.STORAGE_CONNECTION_STRING || "";
const storageContainerName = process.env.STORAGE_CONTAINER_NAME || "eventhub-checkpoints";
const consumerGroup = process.env.CONSUMER_GROUP || "$Default";

/**
 * Produces a batch of events to Event Hubs
 */
async function produceEvents(): Promise<void> {
  console.log("=== Starting Event Producer ===");
  
  // 1. Create EventHubProducerClient using connection string
  const producer = new EventHubProducerClient(
    eventHubsConnectionString,
    eventHubName
  );

  try {
    // 2. Create a batch with createBatch()
    const batch = await producer.createBatch();
    console.log(`Created batch with max size: ${batch.maxSizeInBytes} bytes`);

    // 3. Add 10 events with custom properties
    for (let i = 1; i <= 10; i++) {
      const eventData = {
        body: {
          message: `Event message ${i}`,
          timestamp: new Date().toISOString(),
          eventNumber: i
        },
        properties: {
          priority: i % 3 === 0 ? "high" : "normal",
          source: "typescript-demo",
          version: "1.0.0",
          eventId: `evt-${Date.now()}-${i}`
        }
      };

      const added = batch.tryAdd(eventData);
      
      if (!added) {
        console.warn(`Event ${i} could not be added to batch (batch full)`);
        break;
      }
      
      console.log(`Added event ${i} to batch`);
    }

    // 4. Send the batch using sendBatch()
    console.log(`Sending batch with ${batch.count} events...`);
    await producer.sendBatch(batch);
    console.log(`✓ Successfully sent ${batch.count} events`);

  } catch (error) {
    console.error("Error producing events:", error);
    throw error;
  } finally {
    // 7. Implement graceful shutdown with close()
    await producer.close();
    console.log("Producer closed\n");
  }
}

/**
 * Consumes events from Event Hubs with checkpoint management
 */
async function consumeEvents(): Promise<void> {
  console.log("=== Starting Event Consumer ===");

  // 5. Create an EventHubConsumerClient with a BlobCheckpointStore
  const containerClient = new ContainerClient(
    storageConnectionString,
    storageContainerName
  );

  // Create container if it doesn't exist
  await containerClient.createIfNotExists();
  console.log(`Checkpoint container '${storageContainerName}' ready`);

  const checkpointStore = new BlobCheckpointStore(containerClient);
  
  const consumer = new EventHubConsumerClient(
    consumerGroup,
    eventHubsConnectionString,
    eventHubName,
    checkpointStore
  );

  // Track received events for demo purposes
  let receivedCount = 0;
  const maxEvents = 10;

  // 6. Subscribe to events using subscribe() with processEvents and processError handlers
  const subscription = consumer.subscribe({
    processEvents: async (events, context) => {
      if (events.length === 0) {
        console.log("No events received in this interval");
        return;
      }

      console.log(`\nReceived ${events.length} event(s) from partition: ${context.partitionId}`);

      for (const event of events) {
        receivedCount++;
        
        // 7. Print received event bodies
        console.log(`\n--- Event ${receivedCount} ---`);
        console.log("Body:", JSON.stringify(event.body, null, 2));
        console.log("Properties:", event.properties);
        console.log("System Properties:", {
          sequenceNumber: event.sequenceNumber,
          enqueuedTimeUtc: event.enqueuedTimeUtc,
          offset: event.offset
        });

        // 8. Update checkpoints
        await context.updateCheckpoint(event);
        console.log(`✓ Checkpoint updated for partition ${context.partitionId}`);
      }

      // Stop after receiving the expected number of events (for demo purposes)
      if (receivedCount >= maxEvents) {
        console.log(`\nReceived ${receivedCount} events, stopping consumer...`);
        await subscription.close();
      }
    },

    processError: async (error, context) => {
      console.error(`Error processing events from partition ${context.partitionId}:`, error);
    }
  }, {
    startPosition: earliestEventPosition // Start from the beginning of the stream
  });

  console.log("Consumer subscribed, waiting for events...");
  console.log("(Consumer will stop after receiving 10 events)\n");

  // Wait for the subscription to complete or timeout after 60 seconds
  const timeout = 60000;
  const startTime = Date.now();
  
  while (!subscription.isRunning && Date.now() - startTime < timeout) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Wait for events to be processed
  while (subscription.isRunning && Date.now() - startTime < timeout) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // 7. Implement graceful shutdown with close()
  if (subscription.isRunning) {
    await subscription.close();
  }
  
  await consumer.close();
  console.log("\nConsumer closed");
  console.log(`Total events received: ${receivedCount}`);
}

/**
 * Main execution flow
 */
async function main(): Promise<void> {
  // Validate configuration
  if (!eventHubsConnectionString || !eventHubName || !storageConnectionString) {
    console.error("ERROR: Missing required environment variables!");
    console.error("Please set:");
    console.error("  - EVENT_HUBS_CONNECTION_STRING");
    console.error("  - EVENT_HUB_NAME");
    console.error("  - STORAGE_CONNECTION_STRING");
    console.error("  - STORAGE_CONTAINER_NAME (optional, defaults to 'eventhub-checkpoints')");
    console.error("  - CONSUMER_GROUP (optional, defaults to '$Default')");
    process.exit(1);
  }

  try {
    // First, produce events
    await produceEvents();

    // Wait a moment for events to be available
    console.log("Waiting 2 seconds before starting consumer...\n");
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Then, consume events
    await consumeEvents();

    console.log("\n=== Demo completed successfully ===");
  } catch (error) {
    console.error("\n=== Demo failed ===");
    console.error("Error:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown on SIGINT/SIGTERM
process.on("SIGINT", () => {
  console.log("\nReceived SIGINT, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\nReceived SIGTERM, shutting down gracefully...");
  process.exit(0);
});

// Run the demo
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
