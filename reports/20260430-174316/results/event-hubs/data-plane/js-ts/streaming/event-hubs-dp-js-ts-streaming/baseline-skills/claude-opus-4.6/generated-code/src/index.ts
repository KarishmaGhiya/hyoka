import {
  EventHubProducerClient,
  EventHubConsumerClient,
  ReceivedEventData,
  PartitionContext,
  earliestEventPosition,
} from "@azure/event-hubs";
import { ContainerClient } from "@azure/storage-blob";
import { BlobCheckpointStore } from "@azure/eventhubs-checkpointstore-blob";

// ---------------------------------------------------------------------------
// Configuration – replace with your own values or use environment variables
// ---------------------------------------------------------------------------
const EVENT_HUB_CONNECTION_STRING =
  process.env.EVENT_HUB_CONNECTION_STRING ||
  "<your-event-hub-namespace-connection-string>";
const EVENT_HUB_NAME =
  process.env.EVENT_HUB_NAME || "<your-event-hub-name>";
const CONSUMER_GROUP =
  process.env.CONSUMER_GROUP || EventHubConsumerClient.defaultConsumerGroupName;
const STORAGE_CONNECTION_STRING =
  process.env.STORAGE_CONNECTION_STRING ||
  "<your-storage-account-connection-string>";
const STORAGE_CONTAINER_NAME =
  process.env.STORAGE_CONTAINER_NAME || "event-hub-checkpoints";

// ---------------------------------------------------------------------------
// 1 & 2 & 3  –  Send a batch of 10 events
// ---------------------------------------------------------------------------
async function sendEvents(): Promise<void> {
  const producer = new EventHubProducerClient(
    EVENT_HUB_CONNECTION_STRING,
    EVENT_HUB_NAME
  );

  try {
    const batch = await producer.createBatch();

    for (let i = 0; i < 10; i++) {
      const event = {
        body: { message: `Event #${i}`, timestamp: new Date().toISOString() },
        properties: {
          source: "event-hubs-demo",
          sequenceIndex: i,
          priority: i < 3 ? "high" : "normal",
        },
      };

      if (!batch.tryAdd(event)) {
        throw new Error(`Event #${i} is too large for the batch.`);
      }
    }

    await producer.sendBatch(batch);
    console.log(`Successfully sent a batch of ${batch.count} events.`);
  } finally {
    await producer.close();
    console.log("Producer closed.");
  }
}

// ---------------------------------------------------------------------------
// 4 & 5 & 6 & 7  –  Receive events with checkpoint store & graceful shutdown
// ---------------------------------------------------------------------------
async function receiveEvents(): Promise<void> {
  // Create a blob checkpoint store for durable offset tracking
  const containerClient = new ContainerClient(
    STORAGE_CONNECTION_STRING,
    STORAGE_CONTAINER_NAME
  );
  await containerClient.createIfNotExists();
  const checkpointStore = new BlobCheckpointStore(containerClient);

  // Build the consumer with the checkpoint store
  const consumer = new EventHubConsumerClient(
    CONSUMER_GROUP,
    EVENT_HUB_CONNECTION_STRING,
    EVENT_HUB_NAME,
    checkpointStore
  );

  const subscription = consumer.subscribe(
    {
      processEvents: async (
        events: ReceivedEventData[],
        context: PartitionContext
      ) => {
        if (events.length === 0) return;

        for (const event of events) {
          console.log(
            `Partition: ${context.partitionId} | ` +
              `Offset: ${event.offset} | ` +
              `Body: ${JSON.stringify(event.body)} | ` +
              `Properties: ${JSON.stringify(event.properties)}`
          );
        }

        // Checkpoint after the last event in the batch
        await context.updateCheckpoint(events[events.length - 1]);
        console.log(
          `Checkpoint updated for partition ${context.partitionId}.`
        );
      },

      processError: async (err: Error, context: PartitionContext) => {
        console.error(
          `Error on partition "${context.partitionId}": ${err.message}`
        );
      },
    },
    { startPosition: earliestEventPosition }
  );

  // Graceful shutdown on SIGINT / SIGTERM
  const shutdown = async (): Promise<void> => {
    console.log("\nShutting down…");
    await subscription.close();
    await consumer.close();
    console.log("Consumer closed. Goodbye!");
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  console.log("Receiving events. Press Ctrl+C to stop.\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  await sendEvents();
  await receiveEvents();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
