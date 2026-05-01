import {
  EventHubProducerClient,
  EventHubConsumerClient,
  ReceivedEventData,
  PartitionContext,
} from "@azure/event-hubs";
import { ContainerClient } from "@azure/storage-blob";
import { BlobCheckpointStore } from "@azure/eventhubs-checkpointstore-blob";

// Configuration - Replace with your actual values
const EVENT_HUB_CONNECTION_STRING = process.env.EVENT_HUB_CONNECTION_STRING || "Endpoint=sb://...";
const EVENT_HUB_NAME = process.env.EVENT_HUB_NAME || "my-event-hub";
const STORAGE_CONNECTION_STRING = process.env.STORAGE_CONNECTION_STRING || "DefaultEndpointsProtocol=https;...";
const STORAGE_CONTAINER_NAME = process.env.STORAGE_CONTAINER_NAME || "eventhub-checkpoints";
const CONSUMER_GROUP = process.env.CONSUMER_GROUP || "$Default";

// Global reference for graceful shutdown
let consumerClient: EventHubConsumerClient | null = null;
let subscription: any = null;

/**
 * Step 1-3: Send events using EventHubProducerClient
 */
async function sendEvents(): Promise<void> {
  console.log("\n=== Starting Event Producer ===");
  
  // 1. Create an EventHubProducerClient using connection string
  const producer = new EventHubProducerClient(
    EVENT_HUB_CONNECTION_STRING,
    EVENT_HUB_NAME
  );

  try {
    // 2. Create a batch with createBatch()
    const batch = await producer.createBatch();
    console.log("Created event batch");

    // Add 10 events with custom properties
    for (let i = 1; i <= 10; i++) {
      const eventData = {
        body: {
          message: `Event message ${i}`,
          timestamp: new Date().toISOString(),
          sequenceNumber: i,
        },
        // Custom properties (application properties)
        properties: {
          eventType: "demo",
          priority: i % 3 === 0 ? "high" : "normal",
          version: "1.0",
          customId: `event-${i}`,
        },
      };

      const added = batch.tryAdd(eventData);
      if (!added) {
        console.warn(`Event ${i} could not be added to batch - batch full`);
        break;
      }
      console.log(`Added event ${i} to batch`);
    }

    // 3. Send the batch using sendBatch()
    console.log(`\nSending batch with ${batch.count} events...`);
    await producer.sendBatch(batch);
    console.log("✓ Batch sent successfully!");

  } catch (error) {
    console.error("Error sending events:", error);
    throw error;
  } finally {
    // Clean up producer
    await producer.close();
    console.log("Producer closed");
  }
}

/**
 * Step 4-6: Receive events using EventHubConsumerClient with BlobCheckpointStore
 */
async function receiveEvents(): Promise<void> {
  console.log("\n=== Starting Event Consumer ===");

  // 4. Create a BlobCheckpointStore for tracking progress
  const containerClient = new ContainerClient(
    STORAGE_CONNECTION_STRING,
    STORAGE_CONTAINER_NAME
  );

  // Ensure the container exists
  await containerClient.createIfNotExists();
  console.log("Checkpoint store container ready");

  const checkpointStore = new BlobCheckpointStore(containerClient);

  // Create EventHubConsumerClient with checkpoint store
  consumerClient = new EventHubConsumerClient(
    CONSUMER_GROUP,
    EVENT_HUB_CONNECTION_STRING,
    EVENT_HUB_NAME,
    checkpointStore
  );

  let eventCount = 0;
  const maxEvents = 10; // Stop after receiving 10 events

  // 5. Subscribe to events with processEvents and processError handlers
  subscription = consumerClient.subscribe({
    // Handler for processing events
    processEvents: async (
      events: ReceivedEventData[],
      context: PartitionContext
    ) => {
      if (events.length === 0) {
        console.log(
          `No events received from partition ${context.partitionId} within wait time`
        );
        return;
      }

      console.log(
        `\nReceived ${events.length} event(s) from partition ${context.partitionId}`
      );

      // 6. Print received event bodies and process
      for (const event of events) {
        eventCount++;
        
        console.log(`\n--- Event ${eventCount} ---`);
        console.log("Body:", JSON.stringify(event.body, null, 2));
        console.log("Sequence Number:", event.sequenceNumber);
        console.log("Enqueued Time:", event.enqueuedTimeUtc);
        console.log("Partition Key:", event.partitionKey || "none");
        
        // Display custom properties
        if (event.properties) {
          console.log("Custom Properties:", event.properties);
        }

        // Display system properties
        console.log("Offset:", event.offset);

        // Update checkpoint after processing event
        await context.updateCheckpoint(event);
        console.log("✓ Checkpoint updated");
      }

      // Stop after receiving enough events
      if (eventCount >= maxEvents) {
        console.log(`\nReceived ${maxEvents} events, initiating shutdown...`);
        await gracefulShutdown();
      }
    },

    // Handler for processing errors
    processError: async (error: Error, context: PartitionContext) => {
      console.error(
        `Error processing events from partition ${context.partitionId}:`,
        error
      );
    },
  });

  console.log("Subscribed to Event Hub. Waiting for events...");
  console.log("Press Ctrl+C to exit\n");
}

/**
 * Step 7: Implement graceful shutdown
 */
async function gracefulShutdown(): Promise<void> {
  console.log("\n=== Initiating Graceful Shutdown ===");

  try {
    // Close subscription
    if (subscription) {
      console.log("Closing subscription...");
      await subscription.close();
      console.log("✓ Subscription closed");
    }

    // Close consumer client
    if (consumerClient) {
      console.log("Closing consumer client...");
      await consumerClient.close();
      console.log("✓ Consumer client closed");
    }

    console.log("=== Shutdown Complete ===\n");
  } catch (error) {
    console.error("Error during shutdown:", error);
  }
}

/**
 * Main execution flow
 */
async function main(): Promise<void> {
  try {
    console.log("Azure Event Hubs Streaming Demo");
    console.log("================================");

    // Send events first
    await sendEvents();

    // Wait a moment for events to be available
    console.log("\nWaiting 2 seconds before starting consumer...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Receive events
    await receiveEvents();

    // Keep the process alive (consumer runs in background)
    // The consumer will auto-shutdown after receiving 10 events
    // Or you can press Ctrl+C to exit

  } catch (error) {
    console.error("Fatal error:", error);
    await gracefulShutdown();
    process.exit(1);
  }
}

// Handle process termination signals for graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nReceived SIGINT signal");
  await gracefulShutdown();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nReceived SIGTERM signal");
  await gracefulShutdown();
  process.exit(0);
});

// Run the demo
main().catch(async (error) => {
  console.error("Unhandled error:", error);
  await gracefulShutdown();
  process.exit(1);
});
