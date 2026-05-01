import {
  EventHubProducerClient,
  EventHubConsumerClient,
  ReceivedEventData,
  PartitionContext,
  SubscriptionEventHandlers,
  earliestEventPosition,
} from "@azure/event-hubs";
import { ContainerClient } from "@azure/storage-blob";
import { BlobCheckpointStore } from "@azure/eventhubs-checkpointstore-blob";

// ---------------------------------------------------------------------------
// Configuration – replace with your own values or set environment variables
// ---------------------------------------------------------------------------
const EVENT_HUB_CONNECTION_STRING =
  process.env.EVENT_HUB_CONNECTION_STRING ??
  "<your-event-hub-namespace-connection-string>";

const EVENT_HUB_NAME =
  process.env.EVENT_HUB_NAME ?? "<your-event-hub-name>";

const CONSUMER_GROUP =
  process.env.CONSUMER_GROUP ?? EventHubConsumerClient.defaultConsumerGroupName;

const STORAGE_CONNECTION_STRING =
  process.env.STORAGE_CONNECTION_STRING ??
  "<your-storage-account-connection-string>";

const STORAGE_CONTAINER_NAME =
  process.env.STORAGE_CONTAINER_NAME ?? "event-hub-checkpoints";

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
          source: "demo-app",
          priority: i < 3 ? "high" : "normal",
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
    console.log("Producer closed.");
  }
}

// ---------------------------------------------------------------------------
// 4 & 5 & 6  –  Receive events with checkpoint store
// ---------------------------------------------------------------------------
async function receiveEvents(): Promise<void> {
  // Create a blob container client for the checkpoint store
  const containerClient = new ContainerClient(
    STORAGE_CONNECTION_STRING,
    STORAGE_CONTAINER_NAME
  );

  // Ensure the container exists
  await containerClient.createIfNotExists();

  const checkpointStore = new BlobCheckpointStore(containerClient);

  const consumer = new EventHubConsumerClient(
    CONSUMER_GROUP,
    EVENT_HUB_CONNECTION_STRING,
    EVENT_HUB_NAME,
    checkpointStore
  );

  const handlers: SubscriptionEventHandlers = {
    // Called for each batch of events received
    processEvents: async (
      events: ReceivedEventData[],
      context: PartitionContext
    ) => {
      if (events.length === 0) {
        return;
      }

      for (const event of events) {
        console.log(
          `Partition: ${context.partitionId} | ` +
            `Offset: ${event.offset} | ` +
            `Body: ${JSON.stringify(event.body)} | ` +
            `Properties: ${JSON.stringify(event.properties)}`
        );
      }

      // Update the checkpoint with the last event in the batch
      const lastEvent = events[events.length - 1];
      if (lastEvent) {
        await context.updateCheckpoint(lastEvent);
      }
      console.log(
        `Checkpoint updated for partition ${context.partitionId}.`
      );
    },

    processError: async (err: Error, context: PartitionContext) => {
      console.error(
        `Error on partition "${context.partitionId}": ${err.message}`
      );
    },
  };

  console.log("Starting consumer – press Ctrl+C to stop...");

  const subscription = consumer.subscribe(handlers, {
    startPosition: earliestEventPosition,
  });

  // -----------------------------------------------------------------------
  // 7  –  Graceful shutdown
  // -----------------------------------------------------------------------
  const shutdown = async (): Promise<void> => {
    console.log("\nShutting down...");
    await subscription.close();
    await consumer.close();
    console.log("Consumer closed. Goodbye!");
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.log("=== Azure Event Hubs Demo ===\n");

  // Send events first
  await sendEvents();

  // Then start receiving
  await receiveEvents();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
