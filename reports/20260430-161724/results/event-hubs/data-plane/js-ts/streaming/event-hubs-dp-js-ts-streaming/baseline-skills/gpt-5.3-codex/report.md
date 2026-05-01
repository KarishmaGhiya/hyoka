# Evaluation Report: event-hubs-dp-js-ts-streaming

**Config:** baseline-skills/gpt-5.3-codex | **Result:** ❌ FAILED | **Duration:** 29.6s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `event-hubs-dp-js-ts-streaming` |
| Config | baseline-skills/gpt-5.3-codex |
| Result | ❌ FAILED |
| Duration | 29.6s |
| Timestamp | 2026-04-30T23:24:16Z |
| Files Generated | 0 |
| Event Count | 60 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 29.5s |
| **Total** | **29.6s** |

## Configuration

- **name:** baseline-skills/gpt-5.3-codex
- **model:** gpt-5.3-codex

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | gpt-5.3-codex |
| Skills Loaded | customize-cloud-agent |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=44302 out=2040 |
| Turn Count | 3 |

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

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Creating Event Hubs demo"}
```

### 🔧 2. view

**Input:**

```json
{"path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-baseline-skills-gpt-5.3-codex-2759774374"}
```

### 🔧 3. glob

**Input:**

```json
{"pattern":"*"}
```

### 🔧 4. glob

**Input:**

```json
{"pattern":"**/*"}
```

## Copilot Response

```ts
// eventhubs-demo.ts
import {
  EventHubConsumerClient,
  EventHubProducerClient,
  earliestEventPosition,
  type Subscription,
} from "@azure/event-hubs";
import { BlobCheckpointStore } from "@azure/eventhubs-checkpointstore-blob";
import { BlobServiceClient } from "@azure/storage-blob";

const EVENT_HUB_CONNECTION_STRING = process.env.EVENT_HUB_CONNECTION_STRING!;
const STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING!;
const BLOB_CONTAINER_NAME = process.env.BLOB_CONTAINER_NAME ?? "eventhub-checkpoints";
const RUN_FOR_MS = 30_000;

async function main(): Promise<void> {
  if (!EVENT_HUB_CONNECTION_STRING || !STORAGE_CONNECTION_STRING) {
    throw new Error(
      "Set EVENT_HUB_CONNECTION_STRING and AZURE_STORAGE_CONNECTION_STRING first."
    );
  }

  const producer = new EventHubProducerClient(EVENT_HUB_CONNECTION_STRING);

  const blobServiceClient = BlobServiceClient.fromConnectionString(STORAGE_CONNECTION_STRING);
  const containerClient = blobServiceClient.getContainerClient(BLOB_CONTAINER_NAME);
  await containerClient.createIfNotExists();

  const checkpointStore = new BlobCheckpointStore(containerClient);
  const consumer = new EventHubConsumerClient(
    EventHubConsumerClient.defaultConsumerGroupName,
    EVENT_HUB_CONNECTION_STRING,
    checkpointStore
  );

  let subscription: Subscription | undefined;
  let shuttingDown = false;

  const shutdown = async (reason: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\nShutting down (${reason})...`);
    if (subscription) await subscription.close();
    await consumer.close();
    await producer.close();
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  try {
    // 1-3) Produce events in a batch
    let batch = await producer.createBatch();

    for (let i = 0; i < 10; i++) {
      const event = {
        body: { message: `Hello Event Hubs #${i}`, sentAt: new Date().toISOString() },
        properties: { source: "typescript-demo", index: i, customTag: "sample" },
      };

      if (!batch.tryAdd(event)) {
        await producer.sendBatch(batch);
        batch = await producer.createBatch();

        if (!batch.tryAdd(event)) {
          throw new Error(`Event ${i} is too large to fit in an empty batch.`);
        }
      }
    }

    if (batch.count > 0) {
      await producer.sendBatch(batch);
    }
    console.log("Sent 10 events.");

    // 4-6) Consume, print bodies, and checkpoint
    subscription = consumer.subscribe(
      {
        processEvents: async (events, context) => {
          for (const event of events) {
            console.log(
              `Received seq=${event.sequenceNumber}, body=${JSON.stringify(event.body)}`
            );
            await context.updateCheckpoint(event);
          }
        },
        processError: async (err, context) => {
          console.error(
            `Error on partition ${context.partitionId}:`,
            err
          );
        },
      },
      { startPosition: earliestEventPosition }
    );

    console.log(`Listening for events for ${RUN_FOR_MS / 1000}s...`);
    await new Promise((resolve) => setTimeout(resolve, RUN_FOR_MS));
  } finally {
    await shutdown("completed");
  }
}

void main().catch((err) => {
  console.error("Fatal error:", err);
  process.exitCode = 1;
});
```

Install packages:

```bash
npm install @azure/event-hubs @azure/eventhubs-checkpointstore-blob @azure/storage-blob
```

The two you asked for are required; `@azure/storage-blob` is also needed to create the `ContainerClient` used by `BlobCheckpointStore`.

## Re-run Command

```bash
hyoka run --prompt-id event-hubs-dp-js-ts-streaming --config baseline-skills/gpt-5.3-codex
```

---

[← Back to Summary](../../../../../../summary.md)
