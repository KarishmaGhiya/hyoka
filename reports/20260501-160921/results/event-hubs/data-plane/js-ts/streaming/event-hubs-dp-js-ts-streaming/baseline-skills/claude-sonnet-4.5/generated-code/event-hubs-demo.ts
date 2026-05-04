import { 
  EventHubProducerClient, 
  EventHubConsumerClient, 
  SubscriptionEventHandlers,
  Subscription
} from "@azure/event-hubs";
import { BlobCheckpointStore } from "@azure/eventhubs-checkpointstore-blob";
import { ContainerClient } from "@azure/storage-blob";

// Configuration - replace with your actual values
const eventHubConnectionString = process.env.EVENT_HUB_CONNECTION_STRING || "";
const eventHubName = process.env.EVENT_HUB_NAME || "";
const storageConnectionString = process.env.STORAGE_CONNECTION_STRING || "";
const containerName = process.env.STORAGE_CONTAINER_NAME || "eventhubs-checkpoints";
const consumerGroup = process.env.CONSUMER_GROUP || "$Default";

async function sendEvents(): Promise<void> {
  console.log("=== Sending Events ===");
  
  // 1. Create an EventHubProducerClient using a connection string
  const producer = new EventHubProducerClient(
    eventHubConnectionString,
    eventHubName
  );

  try {
    // 2. Create a batch with createBatch() and add 10 events with custom properties
    const batch = await producer.createBatch();
    
    for (let i = 1; i <= 10; i++) {
      const eventData = {
        body: `Event message ${i}`,
        properties: {
          eventNumber: i,
          timestamp: new Date().toISOString(),
          source: "demo-app",
          priority: i % 3 === 0 ? "high" : "normal"
        }
      };

      const wasAdded = batch.tryAdd(eventData);
      
      if (!wasAdded) {
        console.log(`Event ${i} could not be added to the batch (batch full)`);
        break;
      }
      
      console.log(`Added event ${i} to batch`);
    }

    // 3. Send the batch using sendBatch()
    console.log(`\nSending batch of ${batch.count} events...`);
    await producer.sendBatch(batch);
    console.log(`Successfully sent ${batch.count} events\n`);
    
  } catch (error) {
    console.error("Error sending events:", error);
    throw error;
  } finally {
    // 7. Implement graceful shutdown with close()
    await producer.close();
    console.log("Producer closed");
  }
}

async function receiveEvents(): Promise<void> {
  console.log("\n=== Receiving Events ===");
  
  // 4. Create an EventHubConsumerClient with a BlobCheckpointStore
  const containerClient = new ContainerClient(
    storageConnectionString,
    containerName
  );
  
  // Create the container if it doesn't exist
  await containerClient.createIfNotExists();
  
  const checkpointStore = new BlobCheckpointStore(containerClient);
  
  const consumer = new EventHubConsumerClient(
    consumerGroup,
    eventHubConnectionString,
    eventHubName,
    checkpointStore
  );

  let subscription: Subscription | undefined;
  let receivedCount = 0;
  const maxEventsToReceive = 10;

  try {
    // 5. Subscribe to events using subscribe() with processEvents and processError handlers
    const handlers: SubscriptionEventHandlers = {
      // 6. Print received event bodies and update checkpoints
      processEvents: async (events, context) => {
        if (events.length === 0) {
          console.log("No events received in this batch");
          return;
        }

        console.log(`\nReceived ${events.length} events from partition: ${context.partitionId}`);
        
        for (const event of events) {
          receivedCount++;
          
          // Print received event bodies
          console.log(`\n--- Event ${receivedCount} ---`);
          console.log(`Body: ${event.body}`);
          console.log(`Properties:`, event.properties);
          console.log(`Sequence Number: ${event.sequenceNumber}`);
          console.log(`Offset: ${event.offset}`);
          console.log(`Enqueued Time: ${event.enqueuedTimeUtc}`);
          
          // Update checkpoint after processing each event
          await context.updateCheckpoint(event);
          console.log(`Checkpoint updated for partition ${context.partitionId}`);
        }

        // Stop after receiving the target number of events
        if (receivedCount >= maxEventsToReceive) {
          console.log(`\nReceived ${receivedCount} events, stopping subscription...`);
          await subscription?.close();
        }
      },

      processError: async (error, context) => {
        console.error(`Error in partition ${context.partitionId}:`, error);
      }
    };

    // Subscribe to all partitions
    subscription = consumer.subscribe(handlers, {
      startPosition: { enqueuedOn: new Date() } // Start from now
    });

    console.log("Subscription started. Waiting for events...");
    console.log("(Will process up to 10 events)\n");

    // Wait for events to be processed (with timeout)
    const maxWaitTime = 60000; // 60 seconds
    const startTime = Date.now();
    
    while (!subscription.isClosed && (Date.now() - startTime) < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (receivedCount >= maxEventsToReceive) {
        break;
      }
    }

    if (receivedCount === 0) {
      console.log("\nNo events received within the timeout period.");
      console.log("This is normal if no events were sent recently.");
    }

  } catch (error) {
    console.error("Error receiving events:", error);
    throw error;
  } finally {
    // 7. Implement graceful shutdown with close()
    if (subscription && !subscription.isClosed) {
      await subscription.close();
      console.log("\nSubscription closed");
    }
    
    await consumer.close();
    console.log("Consumer closed");
  }
}

async function main(): Promise<void> {
  console.log("Azure Event Hubs Demo - TypeScript\n");
  
  // Validate environment variables
  if (!eventHubConnectionString || !eventHubName || !storageConnectionString) {
    console.error("ERROR: Missing required environment variables:");
    console.error("- EVENT_HUB_CONNECTION_STRING");
    console.error("- EVENT_HUB_NAME");
    console.error("- STORAGE_CONNECTION_STRING");
    console.error("- STORAGE_CONTAINER_NAME (optional, defaults to 'eventhubs-checkpoints')");
    console.error("- CONSUMER_GROUP (optional, defaults to '$Default')");
    process.exit(1);
  }

  try {
    // Send events first
    await sendEvents();
    
    // Wait a moment for events to be available
    console.log("\nWaiting 5 seconds before starting consumer...");
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Then receive events
    await receiveEvents();
    
    console.log("\n=== Demo completed successfully ===");
  } catch (error) {
    console.error("\nDemo failed with error:", error);
    process.exit(1);
  }
}

// Run the demo
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
