import {
  EventHubConsumerClient,
  EventHubProducerClient,
  earliestEventPosition,
} from "@azure/event-hubs";
import { BlobCheckpointStore } from "@azure/eventhubs-checkpointstore-blob";
import { ContainerClient } from "@azure/storage-blob";

const receiveWindowInMs = 30_000;

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function hasEntityPath(connectionString: string): boolean {
  return /(?:^|;)EntityPath=/.test(connectionString);
}

function createProducerClient(
  eventHubsConnectionString: string,
  eventHubName: string,
): EventHubProducerClient {
  return hasEntityPath(eventHubsConnectionString)
    ? new EventHubProducerClient(eventHubsConnectionString)
    : new EventHubProducerClient(eventHubsConnectionString, eventHubName);
}

function createConsumerClient(
  consumerGroup: string,
  eventHubsConnectionString: string,
  eventHubName: string,
  checkpointStore: BlobCheckpointStore,
): EventHubConsumerClient {
  return hasEntityPath(eventHubsConnectionString)
    ? new EventHubConsumerClient(consumerGroup, eventHubsConnectionString, checkpointStore)
    : new EventHubConsumerClient(
        consumerGroup,
        eventHubsConnectionString,
        eventHubName,
        checkpointStore,
      );
}

function formatBody(body: unknown): string {
  if (Buffer.isBuffer(body)) {
    return body.toString("utf8");
  }

  if (typeof body === "string") {
    return body;
  }

  return JSON.stringify(body);
}

async function sendEvents(producerClient: EventHubProducerClient): Promise<void> {
  const batch = await producerClient.createBatch();

  for (let index = 1; index <= 10; index += 1) {
    const event = {
      body: {
        sequence: index,
        sentAt: new Date().toISOString(),
        message: `Demo event ${index}`,
      },
      properties: {
        source: "typescript-sample",
        priority: index % 2 === 0 ? "high" : "normal",
        batchId: "sample-batch-001",
      },
    };

    if (!batch.tryAdd(event)) {
      throw new Error(`Unable to add event ${index} to the batch.`);
    }
  }

  await producerClient.sendBatch(batch);
  console.log("Sent 10 events.");
}

async function main(): Promise<void> {
  const eventHubsConnectionString = getRequiredEnv("EVENT_HUBS_CONNECTION_STRING");
  const eventHubName = process.env.EVENT_HUB_NAME ?? "";
  const storageConnectionString = getRequiredEnv("STORAGE_CONNECTION_STRING");
  const storageContainerName = getRequiredEnv("STORAGE_CONTAINER_NAME");
  const consumerGroup = process.env.EVENT_HUB_CONSUMER_GROUP ?? "$Default";

  if (!hasEntityPath(eventHubsConnectionString) && eventHubName.length === 0) {
    throw new Error(
      "Set EVENT_HUB_NAME when EVENT_HUBS_CONNECTION_STRING does not include EntityPath.",
    );
  }

  const producerClient = createProducerClient(eventHubsConnectionString, eventHubName);

  await sendEvents(producerClient);

  const containerClient = new ContainerClient(storageConnectionString, storageContainerName);
  await containerClient.createIfNotExists();

  const checkpointStore = new BlobCheckpointStore(containerClient);
  const consumerClient = createConsumerClient(
    consumerGroup,
    eventHubsConnectionString,
    eventHubName,
    checkpointStore,
  );

  let isShuttingDown = false;
  let resolveStop!: () => void;

  const stopPromise = new Promise<void>((resolve) => {
    resolveStop = resolve;
  });

  const subscription = consumerClient.subscribe(
    {
      processEvents: async (events, context) => {
        if (events.length === 0) {
          return;
        }

        for (const event of events) {
          console.log(
            `[partition ${context.partitionId}] body=${formatBody(event.body)} properties=${JSON.stringify(
              event.properties ?? {},
            )}`,
          );
        }

        const latestEvent = events[events.length - 1];
        await context.updateCheckpoint(latestEvent);
        console.log(
          `[partition ${context.partitionId}] Checkpoint updated at sequence ${latestEvent.sequenceNumber}.`,
        );
      },
      processError: async (error, context) => {
        console.error(`[partition ${context.partitionId ?? "unknown"}] ${error.message}`);
      },
    },
    {
      startPosition: earliestEventPosition,
      maxWaitTimeInSeconds: 5,
    },
  );

  const shutdown = async (reason: string): Promise<void> => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    console.log(`Shutting down (${reason})...`);

    const closeResults = await Promise.allSettled([
      subscription.close(),
      consumerClient.close(),
      producerClient.close(),
    ]);

    for (const result of closeResults) {
      if (result.status === "rejected") {
        console.error(result.reason);
      }
    }

    resolveStop();
  };

  process.once("SIGINT", () => {
    void shutdown("SIGINT");
  });
  process.once("SIGTERM", () => {
    void shutdown("SIGTERM");
  });

  const timer = setTimeout(() => {
    void shutdown(`receive window of ${receiveWindowInMs}ms elapsed`);
  }, receiveWindowInMs);

  await stopPromise;
  clearTimeout(timer);
}

void main().catch(async (error: unknown) => {
  console.error("Sample failed:", error);
  process.exitCode = 1;
});
