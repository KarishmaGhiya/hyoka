# Evaluation Report: event-hubs-dp-js-ts-streaming

**Config:** baseline-skills/claude-opus-4.6 | **Result:** ❌ FAILED | **Duration:** 56.0s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `event-hubs-dp-js-ts-streaming` |
| Config | baseline-skills/claude-opus-4.6 |
| Result | ❌ FAILED |
| Duration | 56.0s |
| Timestamp | 2026-04-30T23:23:55Z |
| Files Generated | 0 |
| Event Count | 123 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 55.9s |
| **Total** | **56.0s** |

## Configuration

- **model:** claude-opus-4.6
- **name:** baseline-skills/claude-opus-4.6

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-opus-4.6 |
| Skills Loaded | customize-cloud-agent |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=137982 out=2971 |
| Turn Count | 8 |

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

The user wants a TypeScript program demonstrating Azure Event Hubs send/receive with checkpointing.

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Creating Event Hubs demo"}
```

### 🔧 2. view

**Input:**

```json
{"path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-baseline-skills-claude-opus-4.6-2425003491"}
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
{"command":"Get-ChildItem","description":"List current directory"}
```

### 🔧 6. powershell

**Input:**

```json
{"command":"ls","description":"List files"}
```

### 🔧 7. powershell

**Input:**

```json
{"command":"Write-Output \"hello\"","description":"Test powershell"}
```

### 🔧 8. create

**Input:**

```json
{"file_text":"{\n  \"name\": \"event-hubs-streaming-demo\",\n  \"version\": \"1.0.0\",\n  \"description\": \"Azure Event Hubs send/receive demo with blob checkpoint store\",\n  \"main\": \"dist/index.js\",\n  \"scripts\": {\n    \"build\": \"tsc\",\n    \"start\": \"tsc \u0026\u0026 node dist/index.js\"\n  },\n  \"dependencies\": {\n    \"@azure/event-hubs\": \"^5.12.0\",\n    \"@azure/eventhubs-checkpointstore-blob\": \"^1.1.0\",\n    \"@azure/storage-blob\": \"^12.18.0\"\n  },\n  \"devDependencies\": {\n    \"typescript\": \"^5.4.0\",\n    \"@types/node\": \"^20.11.0\"\n  }\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-baseline-skills-claude-opus-4.6-2425003491\\package.json"}
```

### 🔧 9. create

**Input:**

```json
{"file_text":"{\n  \"compilerOptions\": {\n    \"target\": \"ES2020\",\n    \"module\": \"commonjs\",\n    \"lib\": [\"ES2020\"],\n    \"outDir\": \"./dist\",\n    \"rootDir\": \"./src\",\n    \"strict\": true,\n    \"esModuleInterop\": true,\n    \"skipLibCheck\": true,\n    \"forceConsistentCasingInFileNames\": true,\n    \"resolveJsonModule\": true,\n    \"declaration\": true\n  },\n  \"include\": [\"src/**/*\"]\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-baseline-skills-claude-opus-4.6-2425003491\\tsconfig.json"}
```

## Copilot Response

It seems the environment is blocking tool operations. Let me provide the complete solution directly.

---

## Azure Event Hubs TypeScript Streaming Demo

### Required npm packages

```bash
npm install @azure/event-hubs @azure/eventhubs-checkpointstore-blob @azure/storage-blob
npm install -D typescript @types/node
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

### `src/index.ts`

```typescript
import {
  EventHubProducerClient,
  EventHubConsumerClient,
  earliestEventPosition,
  ReceivedEvent,
  PartitionContext,
} from "@azure/event-hubs";
import { ContainerClient } from "@azure/storage-blob";
import { BlobCheckpointStore } from "@azure/eventhubs-checkpointstore-blob";

// ----- Configuration (set via environment variables) -----
const EVENT_HUB_CONNECTION_STRING =
  process.env.EVENT_HUB_CONNECTION_STRING || "<your-event-hub-connection-string>";
const EVENT_HUB_NAME =
  process.env.EVENT_HUB_NAME || "<your-event-hub-name>";
const CONSUMER_GROUP =
  process.env.CONSUMER_GROUP || EventHubConsumerClient.defaultConsumerGroupName;
const STORAGE_CONNECTION_STRING =
  process.env.STORAGE_CONNECTION_STRING || "<your-storage-connection-string>";
const STORAGE_CONTAINER_NAME =
  process.env.STORAGE_CONTAINER_NAME || "event-hub-checkpoints";

// =========================================================
// 1. SEND EVENTS
// =========================================================
async function sendEvents(): Promise<void> {
  // Step 1: Create an EventHubProducerClient using a connection string
  const producer = new EventHubProducerClient(
    EVENT_HUB_CONNECTION_STRING,
    EVENT_HUB_NAME
  );

  try {
    // Step 2: Create a batch and add 10 events with custom properties
    const batch = await producer.createBatch();

    for (let i = 0; i < 10; i++) {
      const event = {
        body: { message: `Event #${i}`, timestamp: new Date().toISOString() },
        properties: {
          source: "demo-app",
          priority: i < 3 ? "high" : "normal",
          sequenceIndex: i,
        },
      };

      if (!batch.tryAdd(event)) {
        throw new Error(`Event #${i} is too large for the batch.`);
      }
    }

    // Step 3: Send the batch
    await producer.sendBatch(batch);
    console.log(`✓ Sent batch of ${batch.count} events (${batch.sizeInBytes} bytes)`);
  } finally {
    await producer.close();
    console.log("✓ Producer closed");
  }
}

// =========================================================
// 2. RECEIVE EVENTS
// =========================================================
async function receiveEvents(): Promise<void> {
  // Step 4: Create a BlobCheckpointStore backed by Azure Blob Storage
  const containerClient = new ContainerClient(
    STORAGE_CONNECTION_STRING,
    STORAGE_CONTAINER_NAME
  );
  // Ensure the checkpoint container exists
  await containerClient.createIfNotExists();

  const checkpointStore = new BlobCheckpointStore(containerClient);

  // Create an EventHubConsumerClient with the checkpoint store
  const consumer = new EventHubConsumerClient(
    CONSUMER_GROUP,
    EVENT_HUB_CONNECTION_STRING,
    EVENT_HUB_NAME,
    checkpointStore
  );

  // Step 5: Subscribe to events with processEvents and processError handlers
  const subscription = consumer.subscribe(
    {
      processEvents: async (
        events: ReceivedEvent[],
        context: PartitionContext
      ) => {
        if (events.length === 0) return;

        // Step 6: Print received event bodies
        for (const event of events) {
          console.log(
            `  Partition ${context.partitionId} | Offset ${event.offset} | ` +
              `Body: ${JSON.stringify(event.body)} | ` +
              `Props: ${JSON.stringify(event.properties)}`
          );
        }

        // Update the checkpoint to the last event in this batch
        const lastEvent = events[events.length - 1];
        await context.updateCheckpoint(lastEvent);
        console.log(
          `  ✓ Checkpoint updated – partition ${context.partitionId}, ` +
            `offset ${lastEvent.offset}`
        );
      },

      processError: async (
        err: Error,
        context: PartitionContext
      ) => {
        console.error(
          `✗ Error on partition ${context.partitionId}: ${err.message}`
        );
      },
    },
    { startPosition: earliestEventPosition }
  );

  // Step 7: Graceful shutdown – close on SIGINT / SIGTERM
  const shutdown = async (): Promise<void> => {
    console.log("\nShutting down…");
    await subscription.close();
    await consumer.close();
    console.log("✓ Consumer closed");
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  console.log("Listening for events (Ctrl+C to stop)…\n");
}

// =========================================================
// 3. MAIN
// =========================================================
async function main(): Promise<void> {
  const mode = process.argv[2] ?? "both";

  if (mode === "send" || mode === "both") {
    await sendEvents();
  }
  if (mode === "receive" || mode === "both") {
    await receiveEvents();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
```

### Running

```bash
# Set environment variables
export EVENT_HUB_CONNECTION_STRING="Endpoint=sb://..."
export EVENT_HUB_NAME="my-hub"
export STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;..."
export STORAGE_CONTAINER_NAME="event-hub-checkpoints"

# Build & run
npx tsc && node dist/index.js          # send + receive
node dist/index.js send                 # send only
node dist/index.js receive              # receive only
```

### Key points

- **`@azure/event-hubs`** — producer/consumer clients for Event Hubs
- **`@azure/eventhubs-checkpointstore-blob`** — persists consumer offsets in Azure Blob Storage so processing resumes where it left off
- **`@azure/storage-blob`** — peer dependency for the checkpoint store's `ContainerClient`
- `createBatch()` + `tryAdd()` ensures events never exceed the max batch size
- `updateCheckpoint()` after processing prevents re-delivery on restart
- SIGINT/SIGTERM handlers call `close()` on both the subscription and the consumer for graceful shutdown

## Re-run Command

```bash
hyoka run --prompt-id event-hubs-dp-js-ts-streaming --config baseline-skills/claude-opus-4.6
```

---

[← Back to Summary](../../../../../../summary.md)
