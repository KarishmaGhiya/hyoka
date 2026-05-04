import {
  EventHubProducerClient,
  EventHubConsumerClient,
  ReceivedEventData,
  PartitionContext,
  Subscription,
} from "@azure/event-hubs";
import { ContainerClient } from "@azure/storage-blob";
import { BlobCheckpointStore } from "@azure/eventhubs-checkpointstore-blob";

/**
 * Azure Event Hubs Demo
 * 
 * Demonstrates:
 * 1. Sending events with EventHubProducerClient
 * 2. Creating and sending batches with custom properties
 * 3. Receiving events with EventHubConsumerClient
 * 4. Using BlobCheckpointStore for persistent checkpointing
 * 5. Processing events with handlers
 * 6. Graceful shutdown
 */

// Configuration from environment variables
const eventHubConnectionString = process.env.EVENTHUB_CONNECTION_STRING || "";
const eventHubName = process.env.EVENTHUB_NAME || "my-event-hub";
const storageConnectionString = process.env.STORAGE_CONNECTION_STRING || "";
const storageContainerName = process.env.STORAGE_CONTAINER_NAME || "eventhub-checkpoints";
const consumerGroup = "$Default"; // Use $Default consumer group

// Global subscription reference for graceful shutdown
let subscription: Subscription | null = null;
let producerClient: EventHubProducerClient | null = null;
let consumerClient: EventHubConsumerClient | null = null;

/**
 * Send events to Event Hub
 */
async function sendEvents(): Promise<void> {
  console.log("\n=== SENDING EVENTS ===\n");

  // Create producer client using connection string
  producerClient = new EventHubProducerClient(
    eventHubConnectionString,
    eventHubName
  );

  try {
    // Create a batch
    console.log("Creating batch...");
    const batch = await producerClient.createBatch();

    // Add 10 events with custom properties
    for (let i = 1; i <= 10; i++) {
      const eventData = {
        body: {
          message: `Event message ${i}`,
          timestamp: new Date().toISOString(),
          value: Math.floor(Math.random() * 100),
        },
        properties: {
          eventType: "telemetry",
          deviceId: `device-${i % 3 + 1}`, // Distribute across 3 devices
          priority: i % 2 === 0 ? "high" : "normal",
        },
        contentType: "application/json",
        correlationId: `correlation-${i}`,
      };

      // Try adding event to batch
      const isAdded = batch.tryAdd(eventData);
      if (!isAdded) {
        console.log(`Event ${i} could not be added to batch (batch full)`);
        break;
      }
      console.log(`Added event ${i} to batch`);
    }

    // Send the batch
    console.log(`\nSending batch with ${batch.count} events...`);
    await producerClient.sendBatch(batch);
    console.log(`Successfully sent ${batch.count} events!\n`);
  } catch (error) {
    console.error("Error sending events:", error);
    throw error;
  }
}

/**
 * Receive events from Event Hub with checkpointing
 */
async function receiveEvents(): Promise<void> {
  console.log("\n=== RECEIVING EVENTS ===\n");

  // Create container client for checkpoint storage
  const containerClient = new ContainerClient(
    storageConnectionString,
    storageContainerName
  );

  // Ensure container exists
  console.log("Ensuring checkpoint container exists...");
  await containerClient.createIfNotExists();
  console.log("Checkpoint container ready.\n");

  // Create BlobCheckpointStore
  const checkpointStore = new BlobCheckpointStore(containerClient);

  // Create consumer client with checkpoint store
  consumerClient = new EventHubConsumerClient(
    consumerGroup,
    eventHubConnectionString,
    eventHubName,
    checkpointStore
  );

  console.log("Starting event consumer...\n");

  // Subscribe to events with handlers
  subscription = consumerClient.subscribe(
    {
      // Initialize handler - called when starting to receive from a partition
      processInitialize: async (context: PartitionContext) => {
        console.log(`[INIT] Started receiving from partition ${context.partitionId}`);
      },

      // Events handler - processes batches of events
      processEvents: async (
        events: ReceivedEventData[],
        context: PartitionContext
      ) => {
        // Handle empty batches
        if (events.length === 0) {
          console.log(`[PARTITION ${context.partitionId}] No events received, waiting...`);
          return;
        }

        console.log(
          `\n[PARTITION ${context.partitionId}] Received ${events.length} event(s)\n`
        );

        // Process each event
        for (const event of events) {
          // Print event details
          console.log(`  Event Details:`);
          console.log(`    Sequence Number: ${event.sequenceNumber}`);
          console.log(`    Offset: ${event.offset}`);
          console.log(`    Enqueued Time: ${event.enqueuedTimeUtc?.toISOString()}`);
          console.log(`    Partition Key: ${event.partitionKey || "none"}`);
          console.log(`    Content Type: ${event.contentType || "none"}`);
          console.log(`    Correlation ID: ${event.correlationId || "none"}`);

          // Print custom properties
          if (event.properties) {
            console.log(`    Custom Properties:`);
            for (const [key, value] of Object.entries(event.properties)) {
              console.log(`      ${key}: ${value}`);
            }
          }

          // Print event body
          console.log(`    Body: ${JSON.stringify(event.body, null, 2)}`);
          console.log("");

          // Simulate event processing
          await processEvent(event);
        }

        // Update checkpoint after successfully processing all events in batch
        const lastEvent = events[events.length - 1];
        try {
          await context.updateCheckpoint(lastEvent);
          console.log(
            `[PARTITION ${context.partitionId}] Checkpoint updated at sequence ${lastEvent.sequenceNumber}\n`
          );
        } catch (error) {
          console.error(
            `[PARTITION ${context.partitionId}] Failed to update checkpoint:`,
            error
          );
        }
      },

      // Error handler - handles errors during event processing
      processError: async (err: Error, context: PartitionContext) => {
        console.error(
          `\n[ERROR] Partition ${context.partitionId}: ${err.message}\n`
        );
      },

      // Close handler - called when stopping receiving from a partition
      processClose: async (reason: string, context: PartitionContext) => {
        console.log(
          `[CLOSE] Stopped receiving from partition ${context.partitionId}, reason: ${reason}`
        );
      },
    },
    {
      // Start from earliest available event (for demo purposes)
      startPosition: { offset: "@earliest" },
      // Maximum events per batch
      maxBatchSize: 10,
      // Maximum wait time in seconds for a batch
      maxWaitTimeInSeconds: 30,
    }
  );

  console.log("Consumer is now listening for events...");
  console.log("Press Ctrl+C to stop.\n");
}

/**
 * Simulate processing an event
 */
async function processEvent(event: ReceivedEventData): Promise<void> {
  // Simulate some processing work
  await new Promise((resolve) => setTimeout(resolve, 100));
  // In a real application, you would process the event here
  // e.g., save to database, call API, trigger workflow, etc.
}

/**
 * Graceful shutdown handler
 */
async function shutdown(): Promise<void> {
  console.log("\n\n=== SHUTTING DOWN GRACEFULLY ===\n");

  try {
    // Close subscription first (stops receiving new events)
    if (subscription) {
      console.log("Closing subscription...");
      await subscription.close();
      console.log("Subscription closed.");
    }

    // Close consumer client
    if (consumerClient) {
      console.log("Closing consumer client...");
      await consumerClient.close();
      console.log("Consumer client closed.");
    }

    // Close producer client
    if (producerClient) {
      console.log("Closing producer client...");
      await producerClient.close();
      console.log("Producer client closed.");
    }

    console.log("\nShutdown complete!");
  } catch (error) {
    console.error("Error during shutdown:", error);
  } finally {
    process.exit(0);
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log("=== Azure Event Hubs Demo ===");

  // Validate configuration
  if (!eventHubConnectionString) {
    throw new Error("EVENTHUB_CONNECTION_STRING environment variable is required");
  }
  if (!storageConnectionString) {
    throw new Error("STORAGE_CONNECTION_STRING environment variable is required");
  }

  try {
    // Step 1: Send events
    await sendEvents();

    // Wait a moment before starting consumer
    console.log("Waiting 2 seconds before starting consumer...\n");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Step 2: Receive events
    await receiveEvents();

    // Run for 60 seconds then shutdown (for demo purposes)
    // In production, you would keep this running continuously
    setTimeout(async () => {
      console.log("\n\nDemo time limit reached (60 seconds).");
      await shutdown();
    }, 60000);
  } catch (error) {
    console.error("Error in main:", error);
    await shutdown();
  }
}

// Setup signal handlers for graceful shutdown
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Handle unhandled rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  shutdown();
});

// Start the application
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
