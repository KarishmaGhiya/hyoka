import {
  EventHubProducerClient,
  EventHubConsumerClient,
  earliestEventPosition,
  ReceivedEventData,
  PartitionContext,
} from "@azure/event-hubs";
import { ContainerClient } from "@azure/storage-blob";
import { BlobCheckpointStore } from "@azure/eventhubs-checkpointstore-blob";

// Replace these with your actual connection details
const EVENT_HUB_CONNECTION_STRING = process.env.EVENTHUB_CONNECTION_STRING || "<your-event-hub-connection-string>";
const EVENT_HUB_NAME = process.env.EVENTHUB_NAME || "<your-event-hub-name>";
const CONSUMER_GROUP = process.env.CONSUMER_GROUP || EventHubConsumerClient.defaultConsumerGroupName;
const STORAGE_CONNECTION_STRING = process.env.STORAGE_CONNECTION_STRING || "<your-storage-connection-string>";
const STORAGE_CONTAINER_NAME = process.env.STORAGE_CONTAINER_NAME || "event-hub-checkpoints";

/**
 * Sends a batch of 10 events with custom properties to the Event Hub.
 */
async function sendEvents(): Promise<void> {
  const producer = new EventHubProducerClient(EVENT_HUB_CONNECTION_STRING, EVENT_HUB_NAME);

  try {
    const batch = await producer.createBatch();

    for (let i = 0; i < 10; i++) {
      const event = {
        body: { message: `Event #${i}`, timestamp: new Date().toISOString() },
        properties: {
          source: "event-hubs-demo",
          priority: i < 3 ? "high" : "normal",
          sequenceIndex: i,
        },
      };

      if (!batch.tryAdd(event)) {
        throw new Error(`Event #${i} is too large for the batch`);
      }
    }

    console.log(`Sending batch of ${batch.count} events...`);
    await producer.sendBatch(batch);
    console.log("Batch sent successfully.");
  } finally {
    await producer.close();
    console.log("Producer closed.");
  }
}

/**
 * Receives events using a consumer with blob-based checkpoint store.
 * Runs for a fixed duration then shuts down gracefully.
 */
async function receiveEvents(): Promise<void> {
  const containerClient = new ContainerClient(STORAGE_CONNECTION_STRING, STORAGE_CONTAINER_NAME);
  const checkpointStore = new BlobCheckpointStore(containerClient);

  const consumer = new EventHubConsumerClient(
    CONSUMER_GROUP,
    EVENT_HUB_CONNECTION_STRING,
    EVENT_HUB_NAME,
    checkpointStore
  );

  const subscription = consumer.subscribe(
    {
      processEvents: async (events: ReceivedEventData[], context: PartitionContext) => {
        if (events.length === 0) return;

        for (const event of events) {
          console.log(
            `Partition: ${context.partitionId} | Body: ${JSON.stringify(event.body)} | ` +
            `Properties: ${JSON.stringify(event.properties)}`
          );
        }

        // Update the checkpoint after processing the batch so that the consumer
        // can resume from this point if it restarts.
        const lastEvent = events[events.length - 1];
        if (lastEvent) {
          await context.updateCheckpoint(lastEvent);
        }
        console.log(`Checkpoint updated for partition ${context.partitionId}.`);
      },

      processError: async (err: Error, context: PartitionContext) => {
        console.error(`Error on partition ${context.partitionId}: ${err.message}`);
      },
    },
    { startPosition: earliestEventPosition }
  );

  // Graceful shutdown: close after 30 seconds or on SIGINT/SIGTERM.
  const shutDown = async (): Promise<void> => {
    console.log("\nShutting down...");
    await subscription.close();
    await consumer.close();
    console.log("Consumer closed.");
    process.exit(0);
  };

  process.on("SIGINT", shutDown);
  process.on("SIGTERM", shutDown);

  console.log("Receiving events (press Ctrl+C to stop)...");

  // Keep the process alive; auto-close after 30 seconds for demo purposes.
  await new Promise<void>((resolve) => setTimeout(resolve, 30_000));
  await shutDown();
}

async function main(): Promise<void> {
  console.log("=== Azure Event Hubs TypeScript Demo ===\n");

  await sendEvents();
  console.log();
  await receiveEvents();
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
