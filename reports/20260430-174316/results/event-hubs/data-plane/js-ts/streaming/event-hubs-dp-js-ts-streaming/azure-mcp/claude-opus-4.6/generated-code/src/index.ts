import {
  EventHubProducerClient,
  EventHubConsumerClient,
  earliestEventPosition,
  ReceivedEventData,
  PartitionContext,
  Subscription,
} from "@azure/event-hubs";
import { ContainerClient } from "@azure/storage-blob";
import { BlobCheckpointStore } from "@azure/eventhubs-checkpointstore-blob";

// ---------------------------------------------------------------------------
// Configuration – replace with your own values or set environment variables
// ---------------------------------------------------------------------------
const EVENT_HUB_CONNECTION_STRING =
  process.env.EVENT_HUB_CONNECTION_STRING || "<your-event-hub-connection-string>";
const EVENT_HUB_NAME =
  process.env.EVENT_HUB_NAME || "<your-event-hub-name>";
const CONSUMER_GROUP =
  process.env.CONSUMER_GROUP || EventHubConsumerClient.defaultConsumerGroupName;
const STORAGE_CONNECTION_STRING =
  process.env.STORAGE_CONNECTION_STRING || "<your-storage-connection-string>";
const STORAGE_CONTAINER_NAME =
  process.env.STORAGE_CONTAINER_NAME || "event-hub-checkpoints";

// ---------------------------------------------------------------------------
// 1 & 2 & 3  –  Send a batch of 10 events
// ---------------------------------------------------------------------------
async function sendEvents(): Promise<void> {
  // 1 – Create an EventHubProducerClient using a connection string
  const producer = new EventHubProducerClient(
    EVENT_HUB_CONNECTION_STRING,
    EVENT_HUB_NAME
  );

  try {
    // 2 – Create a batch and add 10 events with custom properties
    const batch = await producer.createBatch();

    for (let i = 0; i < 10; i++) {
      const event = {
        body: { message: `Event #${i}`, timestamp: new Date().toISOString() },
        properties: {
          source: "streaming-demo",
          index: i,
          priority: i < 3 ? "high" : "normal",
        },
      };

      if (!batch.tryAdd(event)) {
        throw new Error(`Event #${i} is too large for the batch.`);
      }
    }

    // 3 – Send the batch
    await producer.sendBatch(batch);
    console.log(`✓ Sent batch of ${batch.count} events.`);
  } finally {
    await producer.close();
    console.log("  Producer closed.");
  }
}

// ---------------------------------------------------------------------------
// 4 & 5 & 6 & 7  –  Receive events with checkpoint store & graceful shutdown
// ---------------------------------------------------------------------------
async function receiveEvents(): Promise<void> {
  // 4 – Create an EventHubConsumerClient with a BlobCheckpointStore
  const containerClient = new ContainerClient(
    STORAGE_CONNECTION_STRING,
    STORAGE_CONTAINER_NAME
  );
  const checkpointStore = new BlobCheckpointStore(containerClient);

  const consumer = new EventHubConsumerClient(
    CONSUMER_GROUP,
    EVENT_HUB_CONNECTION_STRING,
    EVENT_HUB_NAME,
    checkpointStore
  );

  // 5 – Subscribe to events with processEvents and processError handlers
  const subscription: Subscription = consumer.subscribe(
    {
      processEvents: async (
        events: ReceivedEventData[],
        context: PartitionContext
      ) => {
        if (events.length === 0) return;

        for (const event of events) {
          // 6 – Print received event bodies
          console.log(
            `  Partition ${context.partitionId} | Offset ${event.offset} | ` +
              `Body: ${JSON.stringify(event.body)}`
          );
        }

        // 6 – Update checkpoint after processing the batch
        await context.updateCheckpoint(events[events.length - 1]);
        console.log(
          `  ✓ Checkpoint updated for partition ${context.partitionId}`
        );
      },

      processError: async (err: Error, context: PartitionContext) => {
        console.error(
          `  ✗ Error on partition ${context.partitionId}: ${err.message}`
        );
      },
    },
    { startPosition: earliestEventPosition }
  );

  // 7 – Graceful shutdown on SIGINT / SIGTERM
  const shutdown = async (): Promise<void> => {
    console.log("\nShutting down…");
    await subscription.close();
    await consumer.close();
    console.log("Consumer closed. Goodbye!");
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  console.log("Listening for events (Ctrl+C to stop)…");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.log("=== Azure Event Hubs Streaming Demo ===\n");

  await sendEvents();

  console.log();

  await receiveEvents();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
