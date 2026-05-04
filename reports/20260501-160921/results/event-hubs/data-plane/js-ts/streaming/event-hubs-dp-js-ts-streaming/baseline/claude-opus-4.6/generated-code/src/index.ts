import {
  EventHubProducerClient,
  EventHubConsumerClient,
  earliestEventPosition,
  ReceivedEventData,
  PartitionContext,
  SubscriptionEventHandlers,
  Subscription,
} from "@azure/event-hubs";
import { ContainerClient } from "@azure/storage-blob";
import { BlobCheckpointStore } from "@azure/eventhubs-checkpointstore-blob";

// ---------------------------------------------------------------------------
// Configuration – replace with your own values or set environment variables
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
// 1. Send events
// ---------------------------------------------------------------------------
async function sendEvents(): Promise<void> {
  const producer = new EventHubProducerClient(
    EVENT_HUB_CONNECTION_STRING,
    EVENT_HUB_NAME
  );

  try {
    // Create a batch – the SDK automatically handles size limits
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

      // tryAdd returns false when the batch is full
      if (!batch.tryAdd(event)) {
        throw new Error(`Event #${i} is too large for an empty batch.`);
      }
    }

    console.log(`Sending batch of ${batch.count} events…`);
    await producer.sendBatch(batch);
    console.log("Batch sent successfully.");
  } finally {
    await producer.close();
    console.log("Producer closed.");
  }
}

// ---------------------------------------------------------------------------
// 2. Receive events with blob-based checkpointing
// ---------------------------------------------------------------------------
async function receiveEvents(): Promise<void> {
  // Set up the blob checkpoint store so the consumer can persist its
  // position across restarts.
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

  const handlers: SubscriptionEventHandlers = {
    // Called with a batch of events (may be empty when maxWaitTimeInSeconds elapses)
    async processEvents(
      events: ReceivedEventData[],
      context: PartitionContext
    ): Promise<void> {
      if (events.length === 0) {
        return;
      }

      for (const event of events) {
        console.log(
          `Partition "${context.partitionId}" | Event: ${JSON.stringify(event.body)} | ` +
            `Properties: ${JSON.stringify(event.properties)}`
        );
      }

      // Update the checkpoint with the last event in this batch so we don't
      // reprocess these events after a restart.
      await context.updateCheckpoint(events[events.length - 1]);
      console.log(
        `Checkpoint updated for partition "${context.partitionId}".`
      );
    },

    async processError(
      err: Error,
      context: PartitionContext
    ): Promise<void> {
      console.error(
        `Error on partition "${context.partitionId}": ${err.message}`
      );
    },
  };

  console.log("Subscribing to events (press Ctrl+C to stop)…");

  const subscription: Subscription = consumer.subscribe(handlers, {
    startPosition: earliestEventPosition,
    maxWaitTimeInSeconds: 10,
  });

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
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.log("=== Azure Event Hubs Demo ===\n");

  // Step 1: send events
  await sendEvents();

  // Step 2: receive events with checkpointing
  await receiveEvents();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
