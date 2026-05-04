import {
  EventHubProducerClient,
  EventHubConsumerClient,
  ReceivedEventData,
  Subscription,
} from "@azure/event-hubs";
import { BlobCheckpointStore } from "@azure/eventhubs-checkpointstore-blob";
import { ContainerClient } from "@azure/storage-blob";

// Configuration - replace with your actual values
const EVENT_HUB_CONNECTION_STRING = process.env.EVENT_HUB_CONNECTION_STRING || "";
const EVENT_HUB_NAME = process.env.EVENT_HUB_NAME || "";
const STORAGE_CONNECTION_STRING = process.env.STORAGE_CONNECTION_STRING || "";
const STORAGE_CONTAINER_NAME = process.env.STORAGE_CONTAINER_NAME || "eventhub-checkpoints";
const CONSUMER_GROUP = process.env.CONSUMER_GROUP || "$Default";

/**
 * Demonstrates sending events using EventHubProducerClient
 */
async function sendEvents(): Promise<void> {
  console.log("=== Sending Events ===");

  // 1. Create EventHubProducerClient using connection string
  const producerClient = new EventHubProducerClient(
    EVENT_HUB_CONNECTION_STRING,
    EVENT_HUB_NAME
  );

  try {
    // 2. Create a batch with createBatch()
    const batch = await producerClient.createBatch();

    // 3. Add 10 events with custom properties
    for (let i = 1; i <= 10; i++) {
      const eventData = {
        body: {
          message: `Event message ${i}`,
          timestamp: new Date().toISOString(),
          sequenceNumber: i,
        },
        properties: {
          eventType: "demo",
          priority: i % 3 === 0 ? "high" : "normal",
          source: "typescript-demo",
          customId: `evt-${i}`,
        },
      };

      const wasAdded = batch.tryAdd(eventData);

      if (!wasAdded) {
        console.log(`Event ${i} could not fit in the batch, sending current batch...`);
        await producerClient.sendBatch(batch);
        
        // Create a new batch and add the event
        const newBatch = await producerClient.createBatch();
        newBatch.tryAdd(eventData);
        await producerClient.sendBatch(newBatch);
      } else {
        console.log(`✓ Added event ${i} to batch`);
      }
    }

    // Send any remaining events in the batch
    if (batch.count > 0) {
      console.log(`\nSending batch with ${batch.count} events...`);
      await producerClient.sendBatch(batch);
      console.log("✓ Batch sent successfully!");
    }
  } catch (error) {
    console.error("Error sending events:", error);
    throw error;
  } finally {
    // 7. Implement graceful shutdown with close()
    await producerClient.close();
    console.log("Producer client closed.\n");
  }
}

/**
 * Demonstrates receiving events using EventHubConsumerClient with checkpointing
 */
async function receiveEvents(): Promise<void> {
  console.log("=== Receiving Events ===");

  // 4. Create an EventHubConsumerClient with a BlobCheckpointStore
  const containerClient = new ContainerClient(
    STORAGE_CONNECTION_STRING,
    STORAGE_CONTAINER_NAME
  );

  // Create the container if it doesn't exist
  await containerClient.createIfNotExists();
  console.log(`✓ Checkpoint store container ready: ${STORAGE_CONTAINER_NAME}`);

  const checkpointStore = new BlobCheckpointStore(containerClient);

  const consumerClient = new EventHubConsumerClient(
    CONSUMER_GROUP,
    EVENT_HUB_CONNECTION_STRING,
    EVENT_HUB_NAME,
    checkpointStore
  );

  let subscription: Subscription | undefined;
  let eventCount = 0;
  const maxEvents = 10;

  try {
    // 5. Subscribe to events using subscribe() with processEvents and processError handlers
    subscription = consumerClient.subscribe({
      // 6. Print received event bodies and update checkpoints
      processEvents: async (events: ReceivedEventData[], context) => {
        if (events.length === 0) {
          console.log("No events received in this interval.");
          return;
        }

        console.log(`\n--- Received ${events.length} events from partition: ${context.partitionId} ---`);

        for (const event of events) {
          eventCount++;

          console.log(`\nEvent #${eventCount}:`);
          console.log(`  Body: ${JSON.stringify(event.body)}`);
          console.log(`  Properties:`, event.properties);
          console.log(`  System Properties:`);
          console.log(`    Sequence Number: ${event.sequenceNumber}`);
          console.log(`    Offset: ${event.offset}`);
          console.log(`    Enqueued Time: ${event.enqueuedTimeUtc}`);
          console.log(`    Partition Key: ${event.partitionKey || "N/A"}`);

          // Update checkpoint for this event
          await context.updateCheckpoint(event);
          console.log(`  ✓ Checkpoint updated for sequence number: ${event.sequenceNumber}`);
        }

        // Stop after receiving maxEvents for demo purposes
        if (eventCount >= maxEvents) {
          console.log(`\n✓ Received ${maxEvents} events, stopping subscription...`);
          await subscription?.close();
        }
      },

      processError: async (error, context) => {
        console.error(`\n❌ Error in partition ${context.partitionId}:`, error);
      },
    });

    console.log("✓ Subscription started. Listening for events...");
    console.log("(Waiting for events or press Ctrl+C to stop)\n");

    // Keep the process running to receive events
    // In production, you'd have proper lifecycle management
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        console.log("\nTimeout reached, stopping consumer...");
        resolve();
      }, 30000); // 30 second timeout

      // Clear timeout if subscription closes early
      subscription?.close().then(() => {
        clearTimeout(timeout);
        resolve();
      });
    });
  } catch (error) {
    console.error("Error receiving events:", error);
    throw error;
  } finally {
    // 7. Implement graceful shutdown with close()
    if (subscription) {
      await subscription.close();
      console.log("Subscription closed.");
    }
    await consumerClient.close();
    console.log("Consumer client closed.");
  }
}

/**
 * Main function to orchestrate the demo
 */
async function main(): Promise<void> {
  console.log("Azure Event Hubs TypeScript Demo\n");
  console.log("================================\n");

  // Validate environment variables
  if (!EVENT_HUB_CONNECTION_STRING || !EVENT_HUB_NAME || !STORAGE_CONNECTION_STRING) {
    console.error("❌ Error: Required environment variables are missing!");
    console.error("Please set the following:");
    console.error("  - EVENT_HUB_CONNECTION_STRING");
    console.error("  - EVENT_HUB_NAME");
    console.error("  - STORAGE_CONNECTION_STRING");
    console.error("  - STORAGE_CONTAINER_NAME (optional, defaults to 'eventhub-checkpoints')");
    console.error("  - CONSUMER_GROUP (optional, defaults to '$Default')");
    process.exit(1);
  }

  try {
    // Step 1: Send events
    await sendEvents();

    // Wait a moment for events to be available
    console.log("Waiting 2 seconds before consuming events...\n");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Step 2: Receive events
    await receiveEvents();

    console.log("\n✓ Demo completed successfully!");
  } catch (error) {
    console.error("\n❌ Demo failed:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown on SIGINT/SIGTERM
process.on("SIGINT", () => {
  console.log("\n\nReceived SIGINT, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n\nReceived SIGTERM, shutting down gracefully...");
  process.exit(0);
});

// Run the demo
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
