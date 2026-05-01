# Evaluation Report: event-hubs-dp-js-ts-streaming

**Config:** azure-mcp/gpt-5.3-codex | **Result:** ❌ FAILED | **Duration:** 29.3s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `event-hubs-dp-js-ts-streaming` |
| Config | azure-mcp/gpt-5.3-codex |
| Result | ❌ FAILED |
| Duration | 29.3s |
| Timestamp | 2026-04-30T23:18:54Z |
| Files Generated | 0 |
| Event Count | 24 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 29.1s |
| **Total** | **29.3s** |

## Configuration

- **name:** azure-mcp/gpt-5.3-codex
- **model:** gpt-5.3-codex

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | gpt-5.3-codex |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=25742 out=1590 |
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

Here’s a complete TypeScript example that sends and receives Event Hubs events with checkpointing and graceful shutdown.

```ts
// index.ts
import {
  EventHubProducerClient,
  EventHubConsumerClient,
  earliestEventPosition,
  ReceivedEventData
} from "@azure/event-hubs";
import { BlobCheckpointStore } from "@azure/eventhubs-checkpointstore-blob";
import { BlobServiceClient } from "@azure/storage-blob";

async function main(): Promise<void> {
  const eventHubsConnectionString = process.env.EVENT_HUBS_CONNECTION_STRING!;
  const eventHubName = process.env.EVENT_HUB_NAME!;
  const consumerGroup = process.env.EVENT_HUB_CONSUMER_GROUP ?? "$Default";

  const storageConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;
  const blobContainerName = process.env.BLOB_CONTAINER_NAME ?? "eventhub-checkpoints";

  if (!eventHubsConnectionString || !eventHubName || !storageConnectionString) {
    throw new Error(
      "Set EVENT_HUBS_CONNECTION_STRING, EVENT_HUB_NAME, and AZURE_STORAGE_CONNECTION_STRING."
    );
  }

  // 1) Producer client
  const producer = new EventHubProducerClient(eventHubsConnectionString, eventHubName);

  // 2) Create batch + add 10 events with custom properties
  const batch = await producer.createBatch();
  for (let i = 1; i <= 10; i++) {
    const ok = batch.tryAdd({
      body: { message: `Hello Event Hubs ${i}`, sentAt: new Date().toISOString() },
      properties: {
        source: "typescript-demo",
        sequence: i,
        customTag: `tag-${i}`
      }
    });

    if (!ok) {
      throw new Error(`Event ${i} could not be added to batch (batch is full).`);
    }
  }

  // 3) Send batch
  await producer.sendBatch(batch);
  console.log("Sent 10 events.");

  // 4) Consumer client + BlobCheckpointStore
  const blobServiceClient = BlobServiceClient.fromConnectionString(storageConnectionString);
  const containerClient = blobServiceClient.getContainerClient(blobContainerName);
  await containerClient.createIfNotExists();

  const checkpointStore = new BlobCheckpointStore(containerClient);
  const consumer = new EventHubConsumerClient(
    consumerGroup,
    eventHubsConnectionString,
    eventHubName,
    checkpointStore
  );

  // 5) Subscribe with processEvents/processError
  const subscription = consumer.subscribe(
    {
      // 6) Print bodies + update checkpoints
      processEvents: async (events: ReceivedEventData[], context) => {
        for (const event of events) {
          console.log(
            `Received from partition ${context.partitionId}:`,
            JSON.stringify(event.body)
          );
          await context.updateCheckpoint(event);
        }
      },
      processError: async (err, context) => {
        console.error(`Error on partition ${context.partitionId}:`, err);
      }
    },
    { startPosition: earliestEventPosition }
  );

  // 7) Graceful shutdown with close()
  let shuttingDown = false;
  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log("Shutting down...");
    await subscription.close();
    await consumer.close();
    await producer.close();
  };

  process.on("SIGINT", async () => {
    await shutdown();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await shutdown();
    process.exit(0);
  });

  console.log("Listening for events. Press Ctrl+C to stop.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
```

Install packages:

```bash
npm install @azure/event-hubs @azure/eventhubs-checkpointstore-blob @azure/storage-blob
```

`@azure/storage-blob` is needed to create the Blob container client used by `BlobCheckpointStore`.

## Re-run Command

```bash
hyoka run --prompt-id event-hubs-dp-js-ts-streaming --config azure-mcp/gpt-5.3-codex
```

---

[← Back to Summary](../../../../../../summary.md)
