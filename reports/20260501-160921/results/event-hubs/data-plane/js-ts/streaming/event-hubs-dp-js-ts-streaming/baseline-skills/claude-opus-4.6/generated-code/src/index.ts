import {
  EventHubProducerClient,
  EventHubConsumerClient,
} from "@azure/event-hubs";
import type {
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
  process.env.EVENT_HUB_CONNECTION_STRING ||
  "<your-event-hub-connection-string>";
const EVENT_HUB_NAME =
  process.env.EVENT_HUB_NAME || "<your-event-hub-name>";
const CONSUMER_GROUP =
  process.env.CONSUMER_GROUP || EventHubConsumerClient.defaultConsumerGroupName;
const STORAGE_CONNECTION_STRING =
  process.env.STORAGE_CONNECTION_STRING ||
  "<your-storage-connection-string>";
const STORAGE_CONTAINER_NAME =
  process.env.STORAGE_CONTAINER_NAME || "checkpoint-container";

// ---------------------------------------------------------------------------
// 1 & 2 & 3  –  Send a batch of 10 events
// ---------------------------------------------------------------------------
async function sendEvents(): Promise<void> {
  const producer = new EventHubProducerClient(
    EVENT_HUB_CONNECTION_STRING,
    EVENT_HUB_NAME,
  );

  try {
    const batch = await producer.createBatch();

    for (let i = 0; i < 10; i++) {
      const event = {
        body: { message: `Event #${i}`, timestamp: new Date().toISOString() },
        properties: {
          source: "demo-app",
          priority: i < 5 ? "high" : "low",
          sequenceIndex: i,
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
    console.log("Producer client closed.");
  }
}

// ---------------------------------------------------------------------------
// 4 & 5 & 6  –  Receive events with checkpoint store
// ---------------------------------------------------------------------------
async function receiveEvents(): Promise<void> {
  const containerClient = new ContainerClient(
    STORAGE_CONNECTION_STRING,
    STORAGE_CONTAINER_NAME,
  );

  // Ensure the checkpoint container exists
  await containerClient.createIfNotExists();

  const checkpointStore = new BlobCheckpointStore(containerClient);

  const consumer = new EventHubConsumerClient(
    CONSUMER_GROUP,
    EVENT_HUB_CONNECTION_STRING,
    EVENT_HUB_NAME,
    checkpointStore,
  );

  const subscription: Subscription = consumer.subscribe({
    processEvents: async (
      events: ReceivedEventData[],
      context: PartitionContext,
    ) => {
      if (events.length === 0) {
        return;
      }

      for (const event of events) {
        console.log(
          `Partition: ${context.partitionId} | Body: ${JSON.stringify(event.body)} | ` +
            `Properties: ${JSON.stringify(event.properties)}`,
        );
      }

      // Update the checkpoint after processing the last event in the batch
      await context.updateCheckpoint(events[events.length - 1]);
      console.log(
        `Checkpoint updated for partition ${context.partitionId}.`,
      );
    },

    processError: async (err: Error, context: PartitionContext) => {
      console.error(
        `Error on partition "${context.partitionId}": ${err.message}`,
      );
    },
  });

  // ---------------------------------------------------------------------------
  // 7  –  Graceful shutdown on SIGINT / SIGTERM
  // ---------------------------------------------------------------------------
  async function shutdown(): Promise<void> {
    console.log("\nShutting down...");
    await subscription.close();
    await consumer.close();
    console.log("Consumer client closed. Goodbye!");
    process.exit(0);
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  console.log("Listening for events. Press Ctrl+C to stop.\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.log("=== Azure Event Hubs – Send & Receive Demo ===\n");

  await sendEvents();
  console.log();
  await receiveEvents();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
