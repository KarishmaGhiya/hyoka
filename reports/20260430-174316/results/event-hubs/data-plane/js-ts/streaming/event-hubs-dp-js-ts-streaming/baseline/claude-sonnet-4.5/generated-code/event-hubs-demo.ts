/**
 * Azure Event Hubs TypeScript Demo
 * Demonstrates sending and receiving events with batching and checkpoint management
 */

import { 
  EventHubProducerClient, 
  EventHubConsumerClient,
  ReceivedEventData,
  Subscription
} from "@azure/event-hubs";
import { ContainerClient } from "@azure/storage-blob";
import { BlobCheckpointStore } from "@azure/eventhubs-checkpointstore-blob";

// Configuration - Replace with your actual values
const CONNECTION_STRING = process.env.EVENT_HUB_CONNECTION_STRING || "Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=your-key-name;SharedAccessKey=your-key";
const EVENT_HUB_NAME = process.env.EVENT_HUB_NAME || "your-event-hub";
const STORAGE_CONNECTION_STRING = process.env.STORAGE_CONNECTION_STRING || "DefaultEndpointsProtocol=https;AccountName=your-storage;AccountKey=your-key;EndpointSuffix=core.windows.net";
const CONTAINER_NAME = process.env.CONTAINER_NAME || "eventhub-checkpoints";
const CONSUMER_GROUP = process.env.CONSUMER_GROUP || "$Default";

/**
 * Producer: Creates and sends a batch of 10 events with custom properties
 */
async function produceEvents(): Promise<void> {
  console.log("\n=== PRODUCING EVENTS ===");
  
  // 1. Create EventHubProducerClient using connection string
  const producer = new EventHubProducerClient(CONNECTION_STRING, EVENT_HUB_NAME);
  
  try {
    // 2. Create a batch with createBatch()
    const batch = await producer.createBatch();
    console.log(`Created batch with max size: ${batch.maxSizeInBytes} bytes`);
    
    // Add 10 events with custom properties
    for (let i = 1; i <= 10; i++) {
      const eventData = {
        body: {
          message: `Event message ${i}`,
          timestamp: new Date().toISOString(),
          sequenceNumber: i
        },
        properties: {
          eventType: "demo-event",
          priority: i % 3 === 0 ? "high" : "normal",
          source: "typescript-producer",
          customId: `event-${i}`
        }
      };
      
      // Try to add event to batch
      const isAdded = batch.tryAdd(eventData);
      
      if (!isAdded) {
        console.warn(`Event ${i} could not fit in the batch`);
        break;
      }
      
      console.log(`Added event ${i} to batch`);
    }
    
    // 3. Send the batch using sendBatch()
    console.log(`\nSending batch with ${batch.count} events...`);
    await producer.sendBatch(batch);
    console.log("✓ Batch sent successfully!");
    
  } catch (error) {
    console.error("Error producing events:", error);
    throw error;
  } finally {
    // 7. Graceful shutdown with close()
    await producer.close();
    console.log("✓ Producer closed");
  }
}

/**
 * Consumer: Receives events using EventHubConsumerClient with checkpoint management
 */
async function consumeEvents(): Promise<Subscription> {
  console.log("\n=== CONSUMING EVENTS ===");
  
  // 4. Create BlobCheckpointStore for checkpoint management
  const containerClient = new ContainerClient(
    STORAGE_CONNECTION_STRING,
    CONTAINER_NAME
  );
  
  // Create container if it doesn't exist
  await containerClient.createIfNotExists();
  console.log(`✓ Checkpoint container ready: ${CONTAINER_NAME}`);
  
  const checkpointStore = new BlobCheckpointStore(containerClient);
  
  // Create EventHubConsumerClient with BlobCheckpointStore
  const consumer = new EventHubConsumerClient(
    CONSUMER_GROUP,
    CONNECTION_STRING,
    EVENT_HUB_NAME,
    checkpointStore
  );
  
  // 5. Subscribe to events using subscribe() with handlers
  const subscription = consumer.subscribe({
    // 6. Process events handler - prints bodies and updates checkpoints
    processEvents: async (events: ReceivedEventData[], context) => {
      if (events.length === 0) {
        console.log(`No events received from partition ${context.partitionId}`);
        return;
      }
      
      console.log(`\n--- Partition ${context.partitionId}: Received ${events.length} event(s) ---`);
      
      for (const event of events) {
        // Print received event body
        console.log(`\nEvent received:`);
        console.log(`  Body: ${JSON.stringify(event.body)}`);
        console.log(`  Sequence Number: ${event.sequenceNumber}`);
        console.log(`  Offset: ${event.offset}`);
        console.log(`  Enqueued Time: ${event.enqueuedTimeUtc}`);
        
        // Print custom properties
        if (event.properties) {
          console.log(`  Custom Properties:`);
          for (const [key, value] of Object.entries(event.properties)) {
            console.log(`    ${key}: ${value}`);
          }
        }
      }
      
      // Update checkpoint after processing all events in the batch
      await context.updateCheckpoint(events[events.length - 1]);
      console.log(`✓ Checkpoint updated for partition ${context.partitionId}`);
    },
    
    // Process errors handler
    processError: async (error, context) => {
      console.error(`\nError on partition ${context.partitionId}:`, error);
      console.error(`  Error name: ${error.name}`);
      console.error(`  Error message: ${error.message}`);
    }
  });
  
  console.log("✓ Subscribed to Event Hub, waiting for events...");
  console.log("  (Press Ctrl+C to stop)\n");
  
  return subscription;
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  let subscription: Subscription | null = null;
  
  try {
    console.log("=================================");
    console.log("Azure Event Hubs TypeScript Demo");
    console.log("=================================");
    
    // Step 1: Produce events
    await produceEvents();
    
    // Wait a moment for events to be available
    console.log("\nWaiting 3 seconds before consuming...");
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 2: Consume events
    subscription = await consumeEvents();
    
    // Keep the consumer running for 30 seconds to receive events
    console.log("Consumer will run for 30 seconds...");
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error("\nFatal error:", error);
    process.exit(1);
  } finally {
    // 7. Graceful shutdown
    if (subscription) {
      console.log("\n\n=== SHUTTING DOWN ===");
      await subscription.close();
      console.log("✓ Consumer subscription closed");
    }
    
    console.log("✓ Demo completed");
  }
}

// Handle process termination gracefully
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
