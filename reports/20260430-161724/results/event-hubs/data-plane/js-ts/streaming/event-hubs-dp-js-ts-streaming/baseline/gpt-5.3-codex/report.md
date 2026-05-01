# Evaluation Report: event-hubs-dp-js-ts-streaming

**Config:** baseline/gpt-5.3-codex | **Result:** ❌ FAILED | **Duration:** 28.3s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `event-hubs-dp-js-ts-streaming` |
| Config | baseline/gpt-5.3-codex |
| Result | ❌ FAILED |
| Duration | 28.3s |
| Timestamp | 2026-04-30T23:24:26Z |
| Files Generated | 0 |
| Event Count | 22 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 28.2s |
| **Total** | **28.3s** |

## Configuration

- **name:** baseline/gpt-5.3-codex
- **model:** gpt-5.3-codex

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | gpt-5.3-codex |
| Skills Loaded | customize-cloud-agent |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=14457 out=2023 |
| Turn Count | 1 |

## Error

```
0 files generated — agent did not create any files
```

## Prompt Sent

```
Write a TypeScript program
that demonstrates sending and receiving events with Azure Event Hubs:
1. Create an EventHubProducerClient using a connection string
2. Create a batch with createBatch() and add 10 events with custom properties
3. Send the batch using sendBatch()
4. Create an EventHubConsumerClient with a BlobCheckpointStore
5. Subscribe to events using subscribe() with processEvents and processError handlers
6. Print received event bodies and update checkpoints
7. Implement graceful shutdown with close()

Show required npm packages (@azure/event-hubs and
@azure/eventhubs-checkpointstore-blob) and proper async/await patterns.
```

## Copilot Response

Here’s a complete TypeScript example that does all 7 steps with proper `async/await`, checkpointing, and graceful shutdown.

```ts
// eventhubs-demo.ts
import {
  EventHubProducerClient,
  EventHubConsumerClient,
  earliestEventPosition
} from "@azure/event-hubs";
import { BlobCheckpointStore } from "@azure/eventhubs-checkpointstore-blob";
import { ContainerClient } from "@azure/storage-blob";

async function main(): Promise<void> {
  // Required env vars:
  // EVENTHUBS_CONNECTION_STRING
  // EVENTHUB_NAME
  // BLOB_STORAGE_CONNECTION_STRING
  // BLOB_CONTAINER_NAME
  // Optional: EVENTHUB_CONSUMER_GROUP (defaults to "$Default")
  const eventHubsConnectionString = process.env.EVENTHUBS_CONNECTION_STRING!;
  const eventHubName = process.env.EVENTHUB_NAME!;
  const blobConnectionString = process.env.BLOB_STORAGE_CONNECTION_STRING!;
  const blobContainerName = process.env.BLOB_CONTAINER_NAME!;
  const consumerGroup = process.env.EVENTHUB_CONSUMER_GROUP || "$Default";

  if (
    !eventHubsConnectionString ||
    !eventHubName ||
    !blobConnectionString ||
    !blobContainerName
  ) {
    throw new Error("Missing required environment variables.");
  }

  // 1) Producer client
  const producer = new EventHubProducerClient(
    eventHubsConnectionString,
    eventHubName
  );

  // 2) Create batch and add 10 events with custom properties
  const batch = await producer.createBatch();
  for (let i = 1; i <= 10; i++) {
    const event = {
      body: { message: `Hello Event Hubs #${i}`, sentAt: new Date().toISOString() },
      properties: {
        source: "typescript-demo",
        index: i,
        importance: i % 2 === 0 ? "high" : "normal"
      }
    };

    if (!batch.tryAdd(event)) {
      throw new Error(`Event ${i} did not fit in the batch.`);
    }
  }

  // 3) Send batch
  await producer.sendBatch(batch);
  console.log("Sent 10 events.");

  // 4) Consumer client + BlobCheckpointStore
  const containerClient = new ContainerClient(
    blobConnectionString,
    blobContainerName
  );
  await containerClient.createIfNotExists();

  const checkpointStore = new BlobCheckpointStore(containerClient);
  const consumer = new EventHubConsumerClient(
    consumerGroup,
    eventHubsConnectionString,
    eventHubName,
    checkpointStore
  );

  // 5) Subscribe with handlers
  const subscription = consumer.subscribe(
    {
      processEvents: async (events, context) => {
        // 6) Print bodies and update checkpoints
        for (const event of events) {
          console.log(
            `Received from partition ${context.partitionId}:`,
            event.body,
            "properties:",
            event.properties
          );
          await context.updateCheckpoint(event);
        }
      },
      processError: async (err, context) => {
        console.error(
          `Error on partition ${context.partitionId}:`,
          err
        );
      }
    },
    {
      // Read from earliest so this demo can read events just sent.
      startPosition: earliestEventPosition
    }
  );

  // 7) Graceful shutdown with close()
  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Shutting down (${signal})...`);
    await subscription.close();
    await consumer.close();
    await producer.close();
    console.log("Closed producer, consumer, and subscription.");
  };

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));

  // Keep running briefly to receive events in this demo.
  setTimeout(() => {
    void shutdown("demo-timeout");
  }, 30_000);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
```

Install packages:

```bash
npm install @azure/event-hubs @azure/eventhubs-checkpointstore-blob @azure/storage-blob
npm install -D typescript ts-node @types/node
```

Run:

```bash
npx ts-node eventhubs-demo.ts
```

## Re-run Command

```bash
hyoka run --prompt-id event-hubs-dp-js-ts-streaming --config baseline/gpt-5.3-codex
```

---

[← Back to Summary](../../../../../../summary.md)
