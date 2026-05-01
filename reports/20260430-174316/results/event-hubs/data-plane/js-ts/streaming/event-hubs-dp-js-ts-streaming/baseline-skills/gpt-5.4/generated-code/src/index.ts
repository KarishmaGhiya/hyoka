import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import {
  EventHubConsumerClient,
  EventHubProducerClient,
  type EventData,
  type EventPosition,
  type ReceivedEventData,
  type Subscription,
} from "@azure/event-hubs";
import { BlobCheckpointStore } from "@azure/eventhubs-checkpointstore-blob";
import { ContainerClient } from "@azure/storage-blob";

const totalEventsToSend = 10;

type EventHubClientFactory = {
  createProducer(): EventHubProducerClient;
  createConsumer(checkpointStore: BlobCheckpointStore): EventHubConsumerClient;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function createEventHubFactory(connectionString: string, eventHubName?: string): EventHubClientFactory {
  return {
    createProducer: () =>
      eventHubName
        ? new EventHubProducerClient(connectionString, eventHubName)
        : new EventHubProducerClient(connectionString),
    createConsumer: (checkpointStore) =>
      eventHubName
        ? new EventHubConsumerClient(
            process.env.EVENT_HUB_CONSUMER_GROUP ?? EventHubConsumerClient.defaultConsumerGroupName,
            connectionString,
            eventHubName,
            checkpointStore,
          )
        : new EventHubConsumerClient(
            process.env.EVENT_HUB_CONSUMER_GROUP ?? EventHubConsumerClient.defaultConsumerGroupName,
            connectionString,
            checkpointStore,
          ),
  };
}

async function main(): Promise<void> {
  const eventHubConnectionString = requireEnv("EVENT_HUB_CONNECTION_STRING");
  const storageConnectionString = requireEnv("STORAGE_CONNECTION_STRING");
  const storageContainerName = requireEnv("STORAGE_CONTAINER_NAME");
  const eventHubName = process.env.EVENT_HUB_NAME;
  const demoRunId = randomUUID();
  const startPosition: EventPosition = { enqueuedOn: new Date() };

  const containerClient = new ContainerClient(storageConnectionString, storageContainerName);
  if (!(await containerClient.exists())) {
    await containerClient.create();
  }

  const checkpointStore = new BlobCheckpointStore(containerClient);
  const eventHubFactory = createEventHubFactory(eventHubConnectionString, eventHubName);
  const producerClient = eventHubFactory.createProducer();
  const consumerClient = eventHubFactory.createConsumer(checkpointStore);

  let subscription: Subscription | undefined;
  let closingPromise: Promise<void> | undefined;

  const closeResources = async (): Promise<void> => {
    if (closingPromise) {
      return closingPromise;
    }

    closingPromise = (async () => {
      if (subscription) {
        await subscription.close();
      }

      await consumerClient.close();
      await producerClient.close();
    })();

    return closingPromise;
  };

  const shutdown = (reason: string, exitCode = 0): void => {
    void (async () => {
      console.log(reason);
      await closeResources();
      process.exit(exitCode);
    })().catch((error: unknown) => {
      console.error("Failed to shut down cleanly.", error);
      process.exit(1);
    });
  };

  process.once("SIGINT", () => shutdown("Received SIGINT. Closing Event Hubs clients..."));
  process.once("SIGTERM", () => shutdown("Received SIGTERM. Closing Event Hubs clients..."));

  try {
    const batch = await producerClient.createBatch();

    for (let i = 0; i < totalEventsToSend; i += 1) {
      const event: EventData = {
        body: {
          message: `Hello from TypeScript event ${i + 1}`,
          index: i + 1,
          sentAt: new Date().toISOString(),
        },
        properties: {
          demoRunId,
          category: "streaming-demo",
          sequence: i + 1,
        },
      };

      if (!batch.tryAdd(event)) {
        throw new Error(`Event ${i + 1} did not fit in the batch.`);
      }
    }

    await producerClient.sendBatch(batch);
    console.log(`Sent ${totalEventsToSend} events to Event Hubs.`);

    let receivedCount = 0;
    let resolved = false;

    const receiveAllEvents = new Promise<void>((resolve, reject) => {
      subscription = consumerClient.subscribe(
        {
          processEvents: async (events, context) => {
            if (events.length === 0) {
              return;
            }

            let lastMatchingEvent: ReceivedEventData | undefined;

            for (const event of events) {
              if (event.properties?.demoRunId !== demoRunId) {
                continue;
              }

              console.log(`[partition ${context.partitionId}]`, event.body);
              receivedCount += 1;
              lastMatchingEvent = event;
            }

            if (!lastMatchingEvent) {
              return;
            }

            await context.updateCheckpoint(lastMatchingEvent);
            console.log(
              `Checkpoint updated for partition ${context.partitionId} after ${receivedCount} matching event(s).`,
            );

            if (receivedCount >= totalEventsToSend && !resolved) {
              resolved = true;
              resolve();
            }
          },
          processError: async (error, context) => {
            console.error(`Error while reading partition ${context.partitionId ?? "unknown"}:`, error);
            if (!resolved) {
              resolved = true;
              reject(error);
            }
          },
        },
        {
          startPosition,
          maxBatchSize: totalEventsToSend,
          maxWaitTimeInSeconds: 10,
        },
      );
    });

    await Promise.race([
      receiveAllEvents,
      delay(30_000).then(() => {
        throw new Error("Timed out waiting to receive all demo events.");
      }),
    ]);

    console.log("Received and checkpointed all demo events.");
  } finally {
    await closeResources();
  }
}

main().catch((error: unknown) => {
  console.error("The demo failed.", error);
  process.exitCode = 1;
});
