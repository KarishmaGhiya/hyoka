import {
  EventHubProducerClient,
  EventHubConsumerClient,
  ReceivedEventData,
  PartitionContext,
  Subscription,
  earliestEventPosition
} from "@azure/event-hubs";
import { ContainerClient } from "@azure/storage-blob";
import { BlobCheckpointStore } from "@azure/eventhubs-checkpointstore-blob";

/**
 * Azure Event Hubs Demo
 * Demonstrates sending and receiving events with checkpointing
 */

// Configuration
const eventHubConnectionString = process.env.EVENTHUB_CONNECTION_STRING || "";
const eventHubName = process.env.EVENTHUB_NAME || "my-event-hub";
const storageConnectionString = process.env.STORAGE_CONNECTION_STRING || "";
const storageContainerName = process.env.STORAGE_CONTAINER_NAME || "eventhub-checkpoints";
const consumerGroup = "$Default";

let subscription: Subscription | null = null;
let producerClient: EventHubProducerClient | null = null;
let consumerClient: EventHubConsumerClient | null = null;

/**
 * Send events to Event Hub
 */
async function sendEvents(): Promise<void> {
  console.log("\n=== SENDING EVENTS ===\n");

  // 1. Create EventHubProducerClient using connection string
  producerClient = new EventHubProducerClient(
    eventHubConnectionString,
    eventHubName
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
          value: Math.random() * 100
        },
        properties: {
          eventType: "telemetry",
          deviceId: `device-${(i % 3) + 1}`,
          priority: i <= 5 ? "high" : "normal",
          sequenceId: i
        },
        contentType: "application/json",
        correlationId: `correlation-${i}`
      };

      const added = batch.tryAdd(eventData);
      
      if (!added) {
        throw new Error("Event is too large to fit in batch");
      }

      console.log(`Added event ${i} to batch`);
    }

    // 4. Send the batch using sendBatch()
    console.log(`\nSending batch of ${batch.count} events...`);
    await producerClient.sendBatch(batch);
    console.log(`✓ Successfully sent ${batch.count} events to Event Hub`);

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

  // Create storage container client for checkpointing
  const containerClient = new ContainerClient(
    storageConnectionString,
    storageContainerName
  );

  // Ensure container exists
  await containerClient.createIfNotExists();
  console.log(`✓ Checkpoint storage container ready: ${storageContainerName}\n`);

  // 5. Create BlobCheckpointStore
  const checkpointStore = new BlobCheckpointStore(containerClient);

  // 6. Create EventHubConsumerClient with BlobCheckpointStore
  consumerClient = new EventHubConsumerClient(
    consumerGroup,
    eventHubConnectionString,
    eventHubName,
    checkpointStore
  );

  let processedCount = 0;
  const targetCount = 10;

  // 7. Subscribe to events with processEvents and processError handlers
  subscription = consumerClient.subscribe(
    {
      // Initialize handler - called when starting to receive from a partition
      processInitialize: async (context: PartitionContext) => {
        console.log(`Started receiving from partition ${context.partitionId}`);
      },

      // Process events handler
      processEvents: async (events: ReceivedEventData[], context: PartitionContext) => {
        if (events.length === 0) {
          console.log(`No events received from partition ${context.partitionId}. Waiting...`);
          return;
        }

        console.log(`\nReceived ${events.length} events from partition ${context.partitionId}:`);

        // 8. Print received event bodies and properties
        for (const event of events) {
          processedCount++;
          
          console.log(`\n--- Event ${processedCount} ---`);
          console.log(`Body: ${JSON.stringify(event.body)}`);
          console.log(`Sequence Number: ${event.sequenceNumber}`);
          console.log(`Offset: ${event.offset}`);
          console.log(`Enqueued Time: ${event.enqueuedTimeUtc.toISOString()}`);
          console.log(`Partition Key: ${event.partitionKey || "none"}`);
          
          // Display custom properties
          if (event.properties) {
            console.log("Custom Properties:");
            console.log(`  Event Type: ${event.properties.eventType}`);
            console.log(`  Device ID: ${event.properties.deviceId}`);
            console.log(`  Priority: ${event.properties.priority}`);
            console.log(`  Sequence ID: ${event.properties.sequenceId}`);
          }
          
          if (event.contentType) {
            console.log(`Content Type: ${event.contentType}`);
          }
          
          if (event.correlationId) {
            console.log(`Correlation ID: ${event.correlationId}`);
          }
        }

        // 9. Update checkpoint after processing batch
        if (events.length > 0) {
          const lastEvent = events[events.length - 1];
          await context.updateCheckpoint(lastEvent);
          console.log(`\n✓ Checkpointed at sequence number ${lastEvent.sequenceNumber} for partition ${context.partitionId}`);
        }

        // Stop after processing target number of events
        if (processedCount >= targetCount) {
          console.log(`\n✓ Processed ${processedCount} events. Initiating shutdown...`);
          setTimeout(() => gracefulShutdown(), 2000);
        }
      },

      // Error handler
      processError: async (err: Error, context: PartitionContext) => {
        console.error(`\n❌ Error on partition ${context.partitionId}:`);
        console.error(`   ${err.message}`);
        
        if (err.name === "MessagingError") {
          console.log("   (Transient error - SDK will retry automatically)");
        }
      },

      // Close handler - called when stopping receiving from a partition
      processClose: async (reason, context: PartitionContext) => {
        console.log(`\nStopped receiving from partition ${context.partitionId}`);
        console.log(`Reason: ${reason}`);
      }
    },
    {
      // Start from the earliest available event
      startPosition: earliestEventPosition,
      
      // Max events per batch
      maxBatchSize: 100,
      
      // Max wait time in seconds for a batch
      maxWaitTimeInSeconds: 30,
      
      // Track last enqueued event for lag monitoring
      trackLastEnqueuedEventProperties: true
    }
  );

  console.log("Subscription started. Waiting for events...");
}

/**
 * 10. Implement graceful shutdown with close()
 */
async function gracefulShutdown(): Promise<void> {
  console.log("\n=== GRACEFUL SHUTDOWN ===\n");

  try {
    // Close subscription first (stops receiving new events)
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

    // Close producer client
    if (producerClient) {
      console.log("Closing producer client...");
      await producerClient.close();
      console.log("✓ Producer client closed");
    }

    console.log("\n✓ Graceful shutdown complete\n");
    process.exit(0);

  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
}

/**
 * Handle process termination signals
 */
function setupSignalHandlers(): void {
  process.on("SIGINT", async () => {
    console.log("\nReceived SIGINT (Ctrl+C)");
    await gracefulShutdown();
  });

  process.on("SIGTERM", async () => {
    console.log("\nReceived SIGTERM");
    await gracefulShutdown();
  });

  // Handle uncaught errors
  process.on("unhandledRejection", (error) => {
    console.error("Unhandled rejection:", error);
    gracefulShutdown();
  });
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log("========================================");
  console.log("  Azure Event Hubs Demo");
  console.log("========================================");

  // Validate configuration
  if (!eventHubConnectionString) {
    throw new Error("EVENTHUB_CONNECTION_STRING environment variable is required");
  }
  if (!storageConnectionString) {
    throw new Error("STORAGE_CONNECTION_STRING environment variable is required");
  }

  console.log("\nConfiguration:");
  console.log(`  Event Hub Name: ${eventHubName}`);
  console.log(`  Consumer Group: ${consumerGroup}`);
  console.log(`  Checkpoint Container: ${storageContainerName}`);

  // Setup signal handlers for graceful shutdown
  setupSignalHandlers();

  try {
    // Step 1-4: Send events
    await sendEvents();

    // Wait a moment before starting to receive
    console.log("\nWaiting 3 seconds before starting consumer...\n");
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 5-9: Receive events with checkpointing
    await receiveEvents();

  } catch (error) {
    console.error("\n❌ Error in main execution:", error);
    await gracefulShutdown();
  }
}

// Run the demo
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
