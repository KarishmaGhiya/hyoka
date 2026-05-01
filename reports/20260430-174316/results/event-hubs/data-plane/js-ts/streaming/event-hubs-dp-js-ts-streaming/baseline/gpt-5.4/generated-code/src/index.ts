import {
  EventHubConsumerClient,
  EventHubProducerClient,
  earliestEventPosition,
  type EventData,
  type Subscription,
} from "@azure/event-hubs";
import { BlobCheckpointStore } from "@azure/eventhubs-checkpointstore-blob";
import { ContainerClient } from "@azure/storage-blob";

const eventHubsConnectionString = readRequiredEnv("EVENT_HUBS_CONNECTION_STRING");
const storageConnectionString = readRequiredEnv("AZURE_STORAGE_CONNECTION_STRING");
const checkpointContainerName = process.env.CHECKPOINT_CONTAINER ?? "eventhubs-checkpoints";
const consumerGroup =
  process.env.EVENT_HUB_CONSUMER_GROUP ?? EventHubConsumerClient.defaultConsumerGroupName;
const expectedEventCount = 10;

function readRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function stringifyBody(body: unknown): string {
  if (typeof body === "string") {
    return body;
  }

  try {
    return JSON.stringify(body);
  } catch {
    return String(body);
  }
}

async function sendSampleBatch(producer: EventHubProducerClient): Promise<void> {
  const batch = await producer.createBatch();

  for (let index = 1; index <= expectedEventCount; index += 1) {
    const event: EventData = {
      body: {
        message: `Hello from TypeScript event ${index}`,
        index,
        createdAt: new Date().toISOString(),
      },
      properties: {
        source: "typescript-event-hubs-sample",
        category: "demo",
        eventNumber: index,
      },
    };

    if (!batch.tryAdd(event)) {
      throw new Error(`Event ${index} exceeded the maximum batch size.`);
    }
  }

  await producer.sendBatch(batch);
  console.log(`Sent ${expectedEventCount} events.`);
}

async function main(): Promise<void> {
  const producer = new EventHubProducerClient(eventHubsConnectionString);
  const containerClient = ContainerClient.fromConnectionString(
    storageConnectionString,
    checkpointContainerName,
  );

  await containerClient.createIfNotExists();

  const checkpointStore = new BlobCheckpointStore(containerClient);
  const consumer = new EventHubConsumerClient(
    consumerGroup,
    eventHubsConnectionString,
    checkpointStore,
  );

  let subscription: Subscription | undefined;
  let receivedCount = 0;
  let shutdownRequested = false;
  let fatalError: Error | undefined;
  let resolveDone!: () => void;

  const done = new Promise<void>((resolve) => {
    resolveDone = resolve;
  });

  const requestShutdown = (reason: string, error?: unknown): void => {
    if (shutdownRequested) {
      return;
    }

    shutdownRequested = true;

    if (error) {
      fatalError = error instanceof Error ? error : new Error(String(error));
    }

    console.log(`Shutting down: ${reason}`);
    resolveDone();
  };

  const closeClients = async (): Promise<void> => {
    await Promise.allSettled([subscription?.close(), consumer.close(), producer.close()]);
  };

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => requestShutdown(`received ${signal}`));
  }

  subscription = consumer.subscribe(
    {
      processEvents: async (events, context) => {
        if (events.length === 0) {
          return;
        }

        for (const event of events) {
          receivedCount += 1;

          console.log(
            `[partition ${context.partitionId}] body=${stringifyBody(event.body)} properties=${JSON.stringify(
              event.properties ?? {},
            )}`,
          );

          await context.updateCheckpoint(event);
          console.log(
            `[partition ${context.partitionId}] checkpoint updated at sequence ${event.sequenceNumber}`,
          );

          if (receivedCount >= expectedEventCount) {
            requestShutdown("received all expected events");
          }
        }
      },
      processError: async (args) => {
        console.error(
          `Consumer error on partition ${args.partitionId ?? "unknown"}:`,
          args.error,
        );
        requestShutdown("consumer error", args.error);
      },
    },
    {
      startPosition: earliestEventPosition,
    },
  );

  await sendSampleBatch(producer);
  await done;
  await closeClients();

  if (fatalError) {
    throw fatalError;
  }
}

main().catch((error: unknown) => {
  console.error("Event Hubs sample failed:", error);
  process.exitCode = 1;
});
