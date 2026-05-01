import {
  type EventData,
  EventHubConsumerClient,
  EventHubProducerClient,
  Subscription,
  earliestEventPosition,
} from "@azure/event-hubs";
import { BlobCheckpointStore } from "@azure/eventhubs-checkpointstore-blob";
import { ContainerClient } from "@azure/storage-blob";

type Config = {
  eventHubsConnectionString: string;
  eventHubName: string;
  storageConnectionString: string;
  blobContainerName: string;
  consumerGroup: string;
  eventCount: number;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function loadConfig(): Config {
  return {
    eventHubsConnectionString: getRequiredEnv("EVENT_HUBS_CONNECTION_STRING"),
    eventHubName: getRequiredEnv("EVENT_HUB_NAME"),
    storageConnectionString: getRequiredEnv("AZURE_STORAGE_CONNECTION_STRING"),
    blobContainerName: process.env.BLOB_CONTAINER_NAME ?? "eventhub-checkpoints",
    consumerGroup:
      process.env.EVENT_HUB_CONSUMER_GROUP ??
      EventHubConsumerClient.defaultConsumerGroupName,
    eventCount: 10,
  };
}

async function ensureCheckpointContainer(
  storageConnectionString: string,
  containerName: string,
): Promise<ContainerClient> {
  const containerClient = new ContainerClient(storageConnectionString, containerName);
  await containerClient.createIfNotExists();
  return containerClient;
}

function createEvents(eventCount: number): EventData[] {
  return Array.from({ length: eventCount }, (_, index) => ({
    body: {
      id: index + 1,
      message: `Hello from Event Hubs event ${index + 1}`,
      sentAt: new Date().toISOString(),
    },
    contentType: "application/json",
    properties: {
      source: "typescript-sample",
      sequenceLabel: `event-${index + 1}`,
      isEven: (index + 1) % 2 === 0,
    },
  }));
}

async function sendBatch(
  producerClient: EventHubProducerClient,
  eventCount: number,
): Promise<void> {
  const batch = await producerClient.createBatch();

  for (const event of createEvents(eventCount)) {
    if (!batch.tryAdd(event)) {
      throw new Error("The batch is full before all 10 events could be added.");
    }
  }

  await producerClient.sendBatch(batch);
  console.log(`Sent ${eventCount} events.`);
}

async function main(): Promise<void> {
  const config = loadConfig();
  const checkpointContainer = await ensureCheckpointContainer(
    config.storageConnectionString,
    config.blobContainerName,
  );
  const checkpointStore = new BlobCheckpointStore(checkpointContainer);

  const producerClient = new EventHubProducerClient(
    config.eventHubsConnectionString,
    config.eventHubName,
  );
  const consumerClient = new EventHubConsumerClient(
    config.consumerGroup,
    config.eventHubsConnectionString,
    config.eventHubName,
    checkpointStore,
  );

  let subscription: Subscription | undefined;
  let closingPromise: Promise<void> | undefined;
  let resolveDone!: () => void;
  const done = new Promise<void>((resolve) => {
    resolveDone = resolve;
  });
  let receivedCount = 0;

  const close = async (): Promise<void> => {
    if (closingPromise) {
      return closingPromise;
    }

    closingPromise = (async () => {
      console.log("Closing Event Hubs clients...");
      await subscription?.close();
      await consumerClient.close();
      await producerClient.close();
      resolveDone();
    })();

    return closingPromise;
  };

  const handleSignal = (signal: NodeJS.Signals): void => {
    console.log(`Received ${signal}. Starting graceful shutdown...`);
    void close();
  };

  process.once("SIGINT", () => handleSignal("SIGINT"));
  process.once("SIGTERM", () => handleSignal("SIGTERM"));

  try {
    await sendBatch(producerClient, config.eventCount);

    subscription = consumerClient.subscribe(
      {
        processEvents: async (events, context) => {
          if (events.length === 0) {
            return;
          }

          for (const event of events) {
            receivedCount += 1;
            console.log(
              `[partition ${context.partitionId}] body=${JSON.stringify(event.body)} properties=${JSON.stringify(event.properties ?? {})}`,
            );
          }

          const lastEvent = events[events.length - 1];
          await context.updateCheckpoint(lastEvent);
          console.log(
            `[partition ${context.partitionId}] checkpoint updated at sequence ${lastEvent.sequenceNumber}`,
          );

          if (receivedCount >= config.eventCount) {
            await close();
          }
        },
        processError: async (error, context) => {
          console.error(
            `Error while receiving from partition ${context.partitionId ?? "unknown"}:`,
            error,
          );
          await close();
        },
      },
      {
        startPosition: earliestEventPosition,
        maxWaitTimeInSeconds: 5,
      },
    );

    console.log("Waiting to receive events. Press Ctrl+C to stop.");
    await done;
  } catch (error) {
    console.error("Sample failed:", error);
    process.exitCode = 1;
    await close();
  }
}

void main();
