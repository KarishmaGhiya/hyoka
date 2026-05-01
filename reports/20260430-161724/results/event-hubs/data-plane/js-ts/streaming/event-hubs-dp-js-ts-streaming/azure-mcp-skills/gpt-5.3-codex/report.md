# Evaluation Report: event-hubs-dp-js-ts-streaming

**Config:** azure-mcp-skills/gpt-5.3-codex | **Result:** ❌ FAILED | **Duration:** 30.7s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `event-hubs-dp-js-ts-streaming` |
| Config | azure-mcp-skills/gpt-5.3-codex |
| Result | ❌ FAILED |
| Duration | 30.7s |
| Timestamp | 2026-04-30T23:19:06Z |
| Files Generated | 0 |
| Event Count | 24 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 30.5s |
| **Total** | **30.7s** |

## Configuration

- **name:** azure-mcp-skills/gpt-5.3-codex
- **model:** gpt-5.3-codex

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | gpt-5.3-codex |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=25748 out=1887 |
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

```bash
npm install @azure/event-hubs @azure/eventhubs-checkpointstore-blob @azure/storage-blob
npm install -D typescript ts-node @types/node
```

```ts
// index.ts
import {
  EventHubProducerClient,
  EventHubConsumerClient,
  earliestEventPosition,
  type Subscription,
} from "@azure/event-hubs";
import { BlobCheckpointStore } from "@azure/eventhubs-checkpointstore-blob";
import { ContainerClient } from "@azure/storage-blob";

async function main(): Promise<void> {
  const eventHubConnectionString = process.env.EVENT_HUB_CONNECTION_STRING!;
  const eventHubName = process.env.EVENT_HUB_NAME!;
  const storageConnectionString = process.env.STORAGE_CONNECTION_STRING!;
  const storageContainerName = process.env.STORAGE_CONTAINER_NAME!;
  const consumerGroup = EventHubConsumerClient.defaultConsumerGroupName;

  if (!eventHubConnectionString || !eventHubName || !storageConnectionString || !storageContainerName) {
    throw new Error(
      "Set EVENT_HUB_CONNECTION_STRING, EVENT_HUB_NAME, STORAGE_CONNECTION_STRING, STORAGE_CONTAINER_NAME"
    );
  }

  const producerClient = new EventHubProducerClient(eventHubConnectionString, eventHubName);

  const containerClient = new ContainerClient(storageConnectionString, storageContainerName);
  await containerClient.createIfNotExists();

  const checkpointStore = new BlobCheckpointStore(containerClient);
  const consumerClient = new EventHubConsumerClient(
    consumerGroup,
    eventHubConnectionString,
    eventHubName,
    checkpointStore
  );

  let subscription: Subscription | undefined;

  const shutdown = async (): Promise<void> => {
    console.log("\nGraceful shutdown...");
    await subscription?.close();
    await consumerClient.close();
    await producerClient.close();
    console.log("Clients closed.");
  };

  process.once("SIGINT", () => void shutdown());
  process.once("SIGTERM", () => void shutdown());

  try {
    // 1-3) Producer: create batch, add 10 events with custom properties, send batch
    const batch = await producerClient.createBatch();

    for (let i = 1; i <= 10; i++) {
      const event = {
        body: { message: `Event #${i}`, sentAt: new Date().toISOString() },
        properties: {
          source: "ts-demo",
          sequence: i,
          priority: i % 2 === 0 ? "high" : "normal",
        },
      };

      if (!batch.tryAdd(event)) {
        throw new Error(`Event #${i} did not fit in the batch.`);
      }
    }

    await producerClient.sendBatch(batch);
    console.log("Sent 10 events.");

    // 4-6) Consumer: subscribe with checkpoint store, print bodies, update checkpoints
    subscription = consumerClient.subscribe(
      {
        processEvents: async (events, context) => {
          for (const event of events) {
            console.log(
              `Received body=${JSON.stringify(event.body)} properties=${JSON.stringify(event.properties)}`
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
      {
        startPosition: earliestEventPosition,
      }
    );

    console.log("Listening for events. Press Ctrl+C to stop.");
    await new Promise((resolve) => setTimeout(resolve, 30_000));
  } finally {
    await shutdown();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
```

Run:

```bash
$env:EVENT_HUB_CONNECTION_STRING="Endpoint=sb://...;SharedAccessKeyName=...;SharedAccessKey=..."
$env:EVENT_HUB_NAME="my-event-hub"
$env:STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net"
$env:STORAGE_CONTAINER_NAME="eh-checkpoints"
npx ts-node index.ts
```

## Re-run Command

```bash
hyoka run --prompt-id event-hubs-dp-js-ts-streaming --config azure-mcp-skills/gpt-5.3-codex
```

---

[← Back to Summary](../../../../../../summary.md)
