import {
  EventHubProducerClient,
  EventHubConsumerClient,
  ReceivedEventData,
  Subscription,
} from "@azure/event-hubs";
import { ContainerClient } from "@azure/storage-blob";
import { BlobCheckpointStore } from "@azure/eventhubs-checkpointstore-blob";

/**
 * Azure Event Hubs Demo - TypeScript
 * Demonstrates sending and receiving events with checkpointing
 */

// Configuration - Replace with your actual connection strings
const eventHubConnectionString = process.env.EVENT_HUB_CONNECTION_STRING || "Endpoint=sb://YOUR_NAMESPACE.servicebus.windows.net/;SharedAccessKeyName=YOUR_KEY_NAME;SharedAccessKey=YOUR_KEY";
const eventHubName = process.env.EVENT_HUB_NAME || "YOUR_EVENT_HUB_NAME";
const storageConnectionString = process.env.STORAGE_CONNECTION_STRING || "DefaultEndpointsProtocol=https;AccountName=YOUR_ACCOUNT;AccountKey=YOUR_KEY;EndpointSuffix=core.windows.net";
const storageContainerName = process.env.STORAGE_CONTAINER_NAME || "eventhub-checkpoints";

// Consumer group - use "$Default" or create a custom consumer group
const consumerGroup = process.env.CONSUMER_GROUP || "$Default";

/**
 * Send events to Event Hub
 */
async function sendEvents(): Promise<void> {
  console.log("=== Starting Event Producer ===\n");

  // Create producer client using connection string
  const producer = new EventHubProducerClient(
    eventHubConnectionString,
    eventHubName
  );

  try {
    // Create a batch - this allows efficient batching of multiple events
    const batch = await producer.createBatch();
    console.log("Created event batch\n");

    // Add 10 events with custom properties to the batch
    for (let i = 1; i <= 10; i++) {
      const eventData = {
        body: {
          message: `Event message ${i}`,
          timestamp: new Date().toISOString(),
          sequenceNumber: i,
        },
        properties: {
          customProperty: `CustomValue${i}`,
          priority: i % 3 === 0 ? "high" : "normal",
          category: `Category${(i % 3) + 1}`,
        },
      };

      // Try to add the event to the batch
      const isAdded = batch.tryAdd(eventData);

      if (!isAdded) {
        console.warn(`Event ${i} could not fit in the batch. Send current batch and create a new one.`);
        // In production, you would send the current batch and create a new one
        break;
      }

      console.log(`Added event ${i} to batch`);
    }

    // Send the batch to Event Hub
    console.log(`\nSending batch with ${batch.count} events...`);
    await producer.sendBatch(batch);
    console.log("✓ Batch sent successfully!\n");

  } catch (error) {
    console.error("Error sending events:", error);
    throw error;
  } finally {
    // Close the producer client
    await producer.close();
    console.log("Producer client closed\n");
  }
}

/**
 * Receive events from Event Hub with checkpointing
 */
async function receiveEvents(): Promise<Subscription> {
  console.log("=== Starting Event Consumer ===\n");

  // Create a blob container client for checkpoint store
  const containerClient = new ContainerClient(
    storageConnectionString,
    storageContainerName
  );

  // Create checkpoint store using Azure Blob Storage
  const checkpointStore = new BlobCheckpointStore(containerClient);

  // Create consumer client with checkpoint store
  const consumer = new EventHubConsumerClient(
    consumerGroup,
    eventHubConnectionString,
    eventHubName,
    checkpointStore
  );

  console.log("Consumer client created with BlobCheckpointStore\n");
  console.log("Starting to receive events...\n");

  // Subscribe to events with processEvents and processError handlers
  const subscription = consumer.subscribe({
    // Process incoming events
    processEvents: async (events: ReceivedEventData[], context) => {
      if (events.length === 0) {
        console.log("No events received in this interval");
        return;
      }

      console.log(`\n--- Received ${events.length} event(s) from partition: ${context.partitionId} ---`);

      for (const event of events) {
        // Print received event body
        console.log(`\nEvent Body:`, JSON.stringify(event.body, null, 2));
        
        // Print event properties
        if (event.properties) {
          console.log("Custom Properties:", event.properties);
        }

        // Print system properties
        console.log("System Properties:", {
          sequenceNumber: event.sequenceNumber,
          offset: event.offset,
          enqueuedTimeUtc: event.enqueuedTimeUtc,
          partitionKey: event.partitionKey,
        });
      }

      // Update checkpoint after processing events
      // This ensures we don't reprocess events after a restart
      try {
        await context.updateCheckpoint(events[events.length - 1]);
        console.log(`\n✓ Checkpoint updated for partition ${context.partitionId}`);
      } catch (error) {
        console.error("Error updating checkpoint:", error);
      }
    },

    // Handle errors during event processing
    processError: async (error, context) => {
      console.error(`\n✗ Error on partition "${context.partitionId}":`, error);
    },
  });

  console.log("Subscription active - listening for events...\n");
  return subscription;
}

/**
 * Main execution function with graceful shutdown
 */
async function main(): Promise<void> {
  let subscription: Subscription | null = null;

  // Set up graceful shutdown handlers
  const shutdown = async () => {
    console.log("\n\n=== Initiating Graceful Shutdown ===");

    try {
      if (subscription) {
        console.log("Closing subscription...");
        await subscription.close();
        console.log("✓ Subscription closed");
      }
      console.log("✓ Shutdown complete");
      process.exit(0);
    } catch (error) {
      console.error("Error during shutdown:", error);
      process.exit(1);
    }
  };

  // Register shutdown handlers for different termination signals
  process.on("SIGINT", shutdown);  // Ctrl+C
  process.on("SIGTERM", shutdown); // Termination signal

  try {
    // Step 1: Send events
    await sendEvents();

    // Wait a bit to ensure events are available
    console.log("Waiting 3 seconds before starting consumer...\n");
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 2: Receive events
    subscription = await receiveEvents();

    // Keep the process running to receive events
    // In production, you would typically run this until a shutdown signal
    console.log("Consumer running. Press Ctrl+C to stop...\n");
    
    // For demo purposes, run for 30 seconds then shutdown
    setTimeout(async () => {
      console.log("\n--- Demo timeout reached (30s) ---");
      await shutdown();
    }, 30000);

  } catch (error) {
    console.error("Fatal error in main:", error);
    await shutdown();
  }
}

// Run the demo
if (require.main === module) {
  main().catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
}

export { sendEvents, receiveEvents };
