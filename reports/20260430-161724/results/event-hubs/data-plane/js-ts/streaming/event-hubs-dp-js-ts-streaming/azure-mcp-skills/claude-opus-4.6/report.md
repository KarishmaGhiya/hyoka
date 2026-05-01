# Evaluation Report: event-hubs-dp-js-ts-streaming

**Config:** azure-mcp-skills/claude-opus-4.6 | **Result:** ❌ FAILED | **Duration:** 63.1s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `event-hubs-dp-js-ts-streaming` |
| Config | azure-mcp-skills/claude-opus-4.6 |
| Result | ❌ FAILED |
| Duration | 63.1s |
| Timestamp | 2026-04-30T23:19:23Z |
| Files Generated | 0 |
| Event Count | 139 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 62.9s |
| **Total** | **63.1s** |

## Configuration

- **name:** azure-mcp-skills/claude-opus-4.6
- **model:** claude-opus-4.6

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-opus-4.6 |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=318773 out=2940 |
| Turn Count | 9 |

## Error

```
0 files generated despite 2 file-write tool attempts
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

## Copilot Reasoning

The user wants a TypeScript program demonstrating Azure Event Hubs send/receive. Let me create a complete project with the necessary files.

The tools are failing with permission errors. Let me try once more with a simple approach.

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Creating Event Hubs demo"}
```

### 🔧 2. view

**Input:**

```json
{"path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-azure-mcp-skills-claude-opus-4.6-4082007999"}
```

### 🔧 3. powershell

**Input:**

```json
{"command":"Get-ChildItem -Force | Select-Object Name, Mode","description":"List directory contents"}
```

### 🔧 4. glob

**Input:**

```json
{"pattern":"*"}
```

### 🔧 5. powershell

**Input:**

```json
{"command":"Get-ChildItem -Force | Select-Object Name","description":"List current directory"}
```

### 🔧 6. powershell

**Input:**

```json
{"command":"dir","description":"List directory"}
```

### 🔧 7. powershell

**Input:**

```json
{"command":"Write-Output \"hello\"","description":"Test powershell"}
```

### 🔧 8. powershell

**Input:**

```json
{"command":"ls","description":"List files","initial_wait":30}
```

### 🔧 9. create

**Input:**

```json
{"file_text":"{\n  \"name\": \"eventhubs-streaming-demo\",\n  \"version\": \"1.0.0\",\n  \"description\": \"Azure Event Hubs send/receive demo with checkpoint store\",\n  \"scripts\": {\n    \"build\": \"tsc\",\n    \"start:send\": \"tsc \u0026\u0026 node dist/send.js\",\n    \"start:receive\": \"tsc \u0026\u0026 node dist/receive.js\"\n  },\n  \"dependencies\": {\n    \"@azure/event-hubs\": \"^5.13.0\",\n    \"@azure/eventhubs-checkpointstore-blob\": \"^1.1.0\",\n    \"@azure/storage-blob\": \"^12.26.0\"\n  },\n  \"devDependencies\": {\n    \"typescript\": \"^5.4.0\",\n    \"@types/node\": \"^20.0.0\"\n  }\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-azure-mcp-skills-claude-opus-4.6-4082007999\\package.json"}
```

### 🔧 10. create

**Input:**

```json
{"file_text":"{\n  \"compilerOptions\": {\n    \"target\": \"ES2020\",\n    \"module\": \"commonjs\",\n    \"outDir\": \"dist\",\n    \"rootDir\": \"src\",\n    \"strict\": true,\n    \"esModuleInterop\": true,\n    \"skipLibCheck\": true,\n    \"forceConsistentCasingInFileNames\": true,\n    \"resolveJsonModule\": true,\n    \"declaration\": true\n  },\n  \"include\": [\"src/**/*\"]\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-azure-mcp-skills-claude-opus-4.6-4082007999\\tsconfig.json"}
```

## Copilot Response

Let me create the project files directly.

I'm hitting permission issues with the tools. Let me provide the complete solution inline.

---

## Azure Event Hubs Streaming Demo (TypeScript)

### Required npm packages

```bash
npm install @azure/event-hubs @azure/eventhubs-checkpointstore-blob @azure/storage-blob
npm install -D typescript @types/node
```

### `package.json`

```json
{
  "name": "eventhubs-streaming-demo",
  "version": "1.0.0",
  "scripts": {
    "build": "tsc",
    "start:send": "tsc && node dist/send.js",
    "start:receive": "tsc && node dist/receive.js"
  },
  "dependencies": {
    "@azure/event-hubs": "^5.13.0",
    "@azure/eventhubs-checkpointstore-blob": "^1.1.0",
    "@azure/storage-blob": "^12.26.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0"
  }
}
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

### `src/send.ts` — Producer: create batch & send events

```typescript
import { EventHubProducerClient, EventData } from "@azure/event-hubs";

const connectionString = process.env.EVENTHUB_CONNECTION_STRING!;
const eventHubName = process.env.EVENTHUB_NAME!;

async function main(): Promise<void> {
  const producer = new EventHubProducerClient(connectionString, eventHubName);

  try {
    const batch = await producer.createBatch();

    for (let i = 0; i < 10; i++) {
      const event: EventData = {
        body: { message: `Event #${i}`, timestamp: new Date().toISOString() },
        properties: {
          source: "demo-producer",
          priority: i < 3 ? "high" : "normal",
          sequenceIndex: i,
        },
      };

      if (!batch.tryAdd(event)) {
        throw new Error(`Event #${i} is too large for the batch`);
      }
    }

    await producer.sendBatch(batch);
    console.log(`Successfully sent batch of ${batch.count} events`);
  } finally {
    await producer.close();
    console.log("Producer closed");
  }
}

main().catch((err) => {
  console.error("Error sending events:", err);
  process.exit(1);
});
```

### `src/receive.ts` — Consumer: subscribe with checkpoint store

```typescript
import { EventHubConsumerClient, ReceivedEventData } from "@azure/event-hubs";
import { ContainerClient } from "@azure/storage-blob";
import { BlobCheckpointStore } from "@azure/eventhubs-checkpointstore-blob";

const ehConnectionString = process.env.EVENTHUB_CONNECTION_STRING!;
const eventHubName = process.env.EVENTHUB_NAME!;
const storageConnectionString = process.env.STORAGE_CONNECTION_STRING!;
const containerName = process.env.CHECKPOINT_CONTAINER ?? "event-hub-checkpoints";
const consumerGroup = process.env.CONSUMER_GROUP ?? "$Default";

async function main(): Promise<void> {
  // Blob container backs the checkpoint store for tracking read progress
  const containerClient = new ContainerClient(
    storageConnectionString,
    containerName
  );
  await containerClient.createIfNotExists();

  const checkpointStore = new BlobCheckpointStore(containerClient);

  const consumer = new EventHubConsumerClient(
    consumerGroup,
    ehConnectionString,
    eventHubName,
    checkpointStore
  );

  const subscription = consumer.subscribe({
    processEvents: async (events: ReceivedEventData[], context) => {
      if (events.length === 0) return;

      for (const event of events) {
        console.log(
          `[Partition ${context.partitionId}] Received:`,
          JSON.stringify(event.body),
          "| Properties:",
          JSON.stringify(event.properties)
        );
      }

      // Update checkpoint to the last event in this batch
      await context.updateCheckpoint(events[events.length - 1]);
      console.log(
        `[Partition ${context.partitionId}] Checkpoint updated (${events.length} events)`
      );
    },

    processError: async (err, context) => {
      console.error(
        `[Partition ${context.partitionId ?? "N/A"}] Error:`,
        err.message
      );
    },
  });

  // Graceful shutdown on SIGINT / SIGTERM
  const shutdown = async (): Promise<void> => {
    console.log("\nShutting down...");
    await subscription.close();
    await consumer.close();
    console.log("Consumer closed");
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  console.log("Listening for events (Ctrl+C to stop)...");
}

main().catch((err) => {
  console.error("Error receiving events:", err);
  process.exit(1);
});
```

### Environment variables needed

```bash
export EVENTHUB_CONNECTION_STRING="Endpoint=sb://<namespace>.servicebus.windows.net/;SharedAccessKeyName=...;SharedAccessKey=..."
export EVENTHUB_NAME="my-event-hub"
export STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=...;AccountKey=..."
export CHECKPOINT_CONTAINER="event-hub-checkpoints"   # optional, defaults shown
export CONSUMER_GROUP="\$Default"                      # optional
```

### Run

```bash
npm install && npm run build
npm run start:send      # sends 10 events
npm run start:receive   # listens and checkpoints
```

**Key patterns demonstrated:**
- `createBatch()` + `tryAdd()` respects the Event Hubs size limit per batch
- `BlobCheckpointStore` persists consumer progress so restarts resume where they left off
- `subscribe()` handlers use `async/await` and update checkpoints after each batch
- `subscription.close()` → `consumer.close()` ensures a clean shutdown

## Re-run Command

```bash
hyoka run --prompt-id event-hubs-dp-js-ts-streaming --config azure-mcp-skills/claude-opus-4.6
```

---

[← Back to Summary](../../../../../../summary.md)
