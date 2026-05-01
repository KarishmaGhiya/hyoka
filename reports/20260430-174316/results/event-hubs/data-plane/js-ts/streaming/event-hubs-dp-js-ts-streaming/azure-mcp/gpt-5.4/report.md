# Evaluation Report: event-hubs-dp-js-ts-streaming

**Config:** azure-mcp/gpt-5.4 | **Result:** ❌ FAILED | **Duration:** 242.7s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `event-hubs-dp-js-ts-streaming` |
| Config | azure-mcp/gpt-5.4 |
| Result | ❌ FAILED |
| Score | 17/10 |
| Duration | 242.7s |
| Timestamp | 2026-05-01T01:09:32Z |
| Files Generated | 4 |
| Event Count | 175 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 108.2s |
| Review | 134.3s |
| **Total** | **242.7s** |

## Configuration

- **name:** azure-mcp/gpt-5.4
- **model:** gpt-5.4

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | gpt-5.4 |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=264882 out=5884 |
| Turn Count | 8 |

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
{"intent":"Exploring workspace"}
```

### 🔧 2. glob

**Input:**

```json
{"paths":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-azure-mcp-gpt-5.4-2723056004","pattern":"**/*"}
```

### 🔧 3. report_intent

**Input:**

```json
{"intent":"Researching APIs"}
```

### 🔧 4. web_fetch

**Input:**

```json
{"max_length":12000,"url":"https://learn.microsoft.com/en-us/javascript/api/overview/azure/event-hubs-readme?view=azure-node-latest"}
```

### 🔧 5. web_fetch

**Input:**

```json
{"max_length":12000,"url":"https://learn.microsoft.com/en-us/javascript/api/overview/azure/eventhubs-checkpointstore-blob-readme?view=azure-node-latest"}
```

### 🔧 6. report_intent

**Input:**

```json
{"intent":"Confirming API"}
```

### 🔧 7. web_fetch

**Input:**

```json
{"max_length":12000,"url":"https://learn.microsoft.com/en-us/javascript/api/@azure/eventhubs-checkpointstore-blob/blobcheckpointstore?view=azure-node-latest"}
```

### 🔧 8. web_fetch

**Input:**

```json
{"max_length":8000,"url":"https://www.npmjs.com/package/@azure/eventhubs-checkpointstore-blob"}
```

### 🔧 9. report_intent

**Input:**

```json
{"intent":"Creating sample"}
```

### 🔧 10. sql

**Input:**

```json
{"database":"session","description":"Create sample todo","query":"INSERT INTO todos (id, title, description, status) VALUES ('event-hubs-sample', 'Create Event Hubs TS sample', 'Add a TypeScript example that sends a batch to Event Hubs and receives with BlobCheckpointStore, including package metadata and graceful shutdown.', 'in_progress');"}
```

### 🔧 11. apply_patch

**Input:**

```json
"*** Begin Patch\n*** Add File: package.json\n+{\n+  \"name\": \"azure-event-hubs-typescript-sample\",\n+  \"version\": \"1.0.0\",\n+  \"private\": true,\n+  \"description\": \"TypeScript sample for sending and receiving Azure Event Hubs events with Blob checkpointing.\",\n+  \"scripts\": {\n+    \"build\": \"tsc -p .\",\n+    \"start\": \"node dist/index.js\"\n+  },\n+  \"dependencies\": {\n+    \"@azure/event-hubs\": \"^6.0.4\",\n+    \"@azure/eventhubs-checkpointstore-blob\": \"^2.0.0\",\n+    \"@azure/storage-blob\": \"^12.28.0\"\n+  },\n+  \"devDependencies\": {\n+    \"@types/node\": \"^22.15.17\",\n+    \"typescript\": \"^5.8.3\"\n+  }\n+}\n*** Add File: tsconfig.json\n+{\n+  \"compilerOptions\": {\n+    \"target\": \"ES2022\",\n+    \"module\": \"NodeNext\",\n+    \"moduleResolution\": \"NodeNext\",\n+    \"outDir\": \"dist\",\n+    \"rootDir\": \"src\",\n+    \"strict\": true,\n+    \"esModuleInterop\": true,\n+    \"allowSyntheticDefaultImports\": true,\n+    \"skipLibCheck\": true,\n+    \"types\": [\n+      \"node\"\n+    ]\n+  },\n+  \"include\": [\n+    \"src/**/*.ts\"\n+  ]\n+}\n*** Add File: src\\index.ts\n+import {\n+  EventHubConsumerClient,\n+  EventHubProducerClient,\n+  earliestEventPosition,\n+} from \"@azure/event-hubs\";\n+import { BlobCheckpointStore } from \"@azure/eventhubs-checkpointstore-blob\";\n+import { ContainerClient } from \"@azure/storage-blob\";\n+\n+const receiveWindowInMs = 30_000;\n+\n+function getRequiredEnv(name: string): string {\n+  const value = process.env[name];\n+\n+  if (!value) {\n+    throw new Error(`Missing required environment variable: ${name}`);\n+  }\n+\n+  return value;\n+}\n+\n+function hasEntityPath(connectionString: string): boolean {\n+  return /(?:^|;)EntityPath=/.test(connectionString);\n+}\n+\n+function createProducerClient(\n+  eventHubsConnectionString: string,\n+  eventHubName: string,\n+): EventHubProducerClient {\n+  return hasEntityPath(eventHubsConnectionString)\n+    ? new EventHubProducerClient(eventHubsConnectionString)\n+    : new EventHubProducerClient(eventHubsConnectionString, eventHubName);\n+}\n+\n+function createConsumerClient(\n+  consumerGroup: string,\n+  eventHubsConnectionString: string,\n+  eventHubName: string,\n+  checkpointStore: BlobCheckpointStore,\n+): EventHubConsumerClient {\n+  return hasEntityPath(eventHubsConnectionString)\n+    ? new EventHubConsumerClient(consumerGroup, eventHubsConnectionString, checkpointStore)\n+    : new EventHubConsumerClient(\n+        consumerGroup,\n+        eventHubsConnectionString,\n+        eventHubName,\n+        checkpointStore,\n+      );\n+}\n+\n+function formatBody(body: unknown): string {\n+  if (Buffer.isBuffer(body)) {\n+    return body.toString(\"utf8\");\n+  }\n+\n+  if (typeof body === \"string\") {\n+    return body;\n+  }\n+\n+  return JSON.stringify(body);\n+}\n+\n+async function sendEvents(producerClient: EventHubProducerClient): Promise\u003cvoid\u003e {\n+  const batch = await producerClient.createBatch();\n+\n+  for (let index = 1; index \u003c= 10; index += 1) {\n+    const event = {\n+      body: {\n+        sequence: index,\n+        sentAt: new Date().toISOString(),\n+        message: `Demo event ${index}`,\n+      },\n+      properties: {\n+        source: \"typescript-sample\",\n+        priority: index % 2 === 0 ? \"high\" : \"normal\",\n+        batchId: \"sample-batch-001\",\n+      },\n+    };\n+\n+    if (!batch.tryAdd(event)) {\n+      throw new Error(`Unable to add event ${index} to the batch.`);\n+    }\n+  }\n+\n+  await producerClient.sendBatch(batch);\n+  console.log(\"Sent 10 events.\");\n+}\n+\n+async function main(): Promise\u003cvoid\u003e {\n+  const eventHubsConnectionString = getRequiredEnv(\"EVENT_HUBS_CONNECTION_STRING\");\n+  const eventHubName = process.env.EVENT_HUB_NAME ?? \"\";\n+  const storageConnectionString = getRequiredEnv(\"STORAGE_CONNECTION_STRING\");\n+  const storageContainerName = getRequiredEnv(\"STORAGE_CONTAINER_NAME\");\n+  const consumerGroup = process.env.EVENT_HUB_CONSUMER_GROUP ?? \"$Default\";\n+\n+  if (!hasEntityPath(eventHubsConnectionString) \u0026\u0026 eventHubName.length === 0) {\n+    throw new Error(\n+      \"Set EVENT_HUB_NAME when EVENT_HUBS_CONNECTION_STRING does not include EntityPath.\",\n+    );\n+  }\n+\n+  const producerClient = createProducerClient(eventHubsConnectionString, eventHubName);\n+\n+  await sendEvents(producerClient);\n+\n+  const containerClient = new ContainerClient(storageConnectionString, storageContainerName);\n+  await containerClient.createIfNotExists();\n+\n+  const checkpointStore = new BlobCheckpointStore(containerClient);\n+  const consumerClient = createConsumerClient(\n+    consumerGroup,\n+    eventHubsConnectionString,\n+    eventHubName,\n+    checkpointStore,\n+  );\n+\n+  let isShuttingDown = false;\n+  let resolveStop!: () =\u003e void;\n+\n+  const stopPromise = new Promise\u003cvoid\u003e((resolve) =\u003e {\n+    resolveStop = resolve;\n+  });\n+\n+  const subscription = consumerClient.subscribe(\n+    {\n+      processEvents: async (events, context) =\u003e {\n+        if (events.length === 0) {\n+          return;\n+        }\n+\n+        for (const event of events) {\n+          console.log(\n+            `[partition ${context.partitionId}] body=${formatBody(event.body)} properties=${JSON.stringify(\n+              event.properties ?? {},\n+            )}`,\n+          );\n+        }\n+\n+        const latestEvent = events[events.length - 1];\n+        await context.updateCheckpoint(latestEvent);\n+        console.log(\n+          `[partition ${context.partitionId}] Checkpoint updated at sequence ${latestEvent.sequenceNumber}.`,\n+        );\n+      },\n+      processError: async (error, context) =\u003e {\n+        console.error(`[partition ${context.partitionId ?? \"unknown\"}] ${error.message}`);\n+      },\n+    },\n+    {\n+      startPosition: earliestEventPosition,\n+      maxWaitTimeInSeconds: 5,\n+    },\n+  );\n+\n+  const shutdown = async (reason: string): Promise\u003cvoid\u003e =\u003e {\n+    if (isShuttingDown) {\n+      return;\n+    }\n+\n+    isShuttingDown = true;\n+    console.log(`Shutting down (${reason})...`);\n+\n+    const closeResults = await Promise.allSettled([\n+      subscription.close(),\n+      consumerClient.close(),\n+      producerClient.close(),\n+    ]);\n+\n+    for (const result of closeResults) {\n+      if (result.status === \"rejected\") {\n+        console.error(result.reason);\n+      }\n+    }\n+\n+    resolveStop();\n+  };\n+\n+  process.once(\"SIGINT\", () =\u003e {\n+    void shutdown(\"SIGINT\");\n+  });\n+  process.once(\"SIGTERM\", () =\u003e {\n+    void shutdown(\"SIGTERM\");\n+  });\n+\n+  const timer = setTimeout(() =\u003e {\n+    void shutdown(`receive window of ${receiveWindowInMs}ms elapsed`);\n+  }, receiveWindowInMs);\n+\n+  await stopPromise;\n+  clearTimeout(timer);\n+}\n+\n+void main().catch(async (error: unknown) =\u003e {\n+  console.error(\"Sample failed:\", error);\n+  process.exitCode = 1;\n+});\n*** End Patch\n"
```

### 🔧 12. report_intent

**Input:**

```json
{"intent":"Validating sample"}
```

### 🔧 13. view

**Input:**

```json
{"path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-azure-mcp-gpt-5.4-2723056004\\src\\index.ts","view_range":[1,260]}
```

### 🔧 14. powershell

**Input:**

```json
{"command":"npm install \u0026\u0026 npm run build","description":"Install packages and build sample","initial_wait":180,"mode":"sync","shellId":"event-hubs-sample-build"}
```

### 🔧 15. report_intent

**Input:**

```json
{"intent":"Finishing task"}
```

### 🔧 16. sql

**Input:**

```json
{"database":"session","description":"Complete sample todo","query":"UPDATE todos SET status = 'done', updated_at = CURRENT_TIMESTAMP WHERE id = 'event-hubs-sample';"}
```

## Generated Files

- `package-lock.json`
- `package.json`
- `src\index.ts`
- `tsconfig.json`

## Copilot Response

I’m pulling the current SDK shape first so the example matches the real constructors and handlers.

The checkpoint store package still expects a Blob container client, so I’m confirming whether there’s a shortcut constructor before I write the sample.

I’ve got the SDK shape. I’m creating a runnable TS sample with a tiny Node/TypeScript setup so the imports, async flow, and shutdown logic are all wired together.

The sample is in place. I’m doing one pass on the generated files and compiling it so I can catch any SDK or TypeScript mismatches.

Added a runnable TypeScript sample in `src\index.ts` plus `package.json` and `tsconfig.json`. It creates an `EventHubProducerClient` from a connection string, builds a batch with 10 events and custom properties, sends it with `sendBatch()`, then creates an `EventHubConsumerClient` with `BlobCheckpointStore`, subscribes with `processEvents`/`processError`, prints event bodies, updates checkpoints, and shuts down cleanly with `close()`.

```bash
npm install @azure/event-hubs @azure/eventhubs-checkpointstore-blob @azure/storage-blob
```

Use these environment variables before running:

- `EVENT_HUBS_CONNECTION_STRING`
- `EVENT_HUB_NAME` *(only if the connection string does not already include `EntityPath`)*
- `STORAGE_CONNECTION_STRING`
- `STORAGE_CONTAINER_NAME`
- `EVENT_HUB_CONSUMER_GROUP` *(optional, defaults to `$Default`)*

Then run:

```bash
npm run build
npm start
```

`@azure/storage-blob` is included because `BlobCheckpointStore` is constructed from a Blob `ContainerClient`.

## Code Review (LLM-as-Judge)

**Score: 17/26 criteria passed**

### Criteria Results

| Criterion | Result | Reason |
|-----------|--------|--------|
| Code Builds | ✅ | 2/2 reviewers passed |
| Latest Package Versions | ❌ | 1/2 reviewers passed |
| Best Practices | ❌ | 1/2 reviewers passed |
| Error Handling | ❌ | 0/2 reviewers passed |
| Code Quality | ✅ | 2/2 reviewers passed |
| Correct @azure/ Scoped Packages | ✅ | 2/2 reviewers passed |
| @azure/identity for Authentication | ❌ | 0/2 reviewers passed |
| Client Constructor with Endpoint and Credential | ❌ | 0/2 reviewers passed |
| Async/Await Pattern | ✅ | 2/2 reviewers passed |
| Pagination with for-await-of | ❌ | 1/2 reviewers passed |
| LRO Pattern (beginXxx + pollUntilDone) | ❌ | 1/2 reviewers passed |
| RestError Exception Handling | ❌ | 0/2 reviewers passed |
| No Deprecated Packages | ✅ | 2/2 reviewers passed |
| Logging via @azure/logger | ❌ | 0/2 reviewers passed |
| package.json with Correct Dependencies | ✅ | 2/2 reviewers passed |
| @azure/event-hubs and @azure/eventhubs-checkpointstore-blob packages | ✅ | 1/1 reviewers passed |
| EventHubProducerClient constructor | ✅ | 2/2 reviewers passed |
| createBatch() and EventDataBatch.tryAdd() | ✅ | 2/2 reviewers passed |
| sendBatch() for publishing | ✅ | 2/2 reviewers passed |
| EventHubConsumerClient with BlobCheckpointStore | ✅ | 2/2 reviewers passed |
| subscribe() with SubscriptionEventHandlers | ✅ | 1/1 reviewers passed |
| updateCheckpoint() in processEvents handler | ✅ | 1/1 reviewers passed |
| close() for cleanup | ✅ | 2/2 reviewers passed |
| @azure/event-hubs and @azure/eventhubs-checkpointstore-blob npm packages | ✅ | 1/1 reviewers passed |
| subscribe() with SubscriptionEventHandlers (processEvents, processError) | ✅ | 1/1 reviewers passed |
| updateCheckpoint() in the processEvents handler | ✅ | 1/1 reviewers passed |

### Summary

Average consensus from 2 reviewers: 17/26 criteria passed

### Strengths

- All 8 prompt-specific functional requirements are fully met
- Excellent code structure with well-named helper functions and clean separation of concerns
- Robust graceful shutdown with SIGINT/SIGTERM, Promise.allSettled, and idempotent guard
- Proper async/await patterns throughout with no callback or .then() anti-patterns
- Smart handling of EntityPath in connection strings
- Receive window timeout ensures the sample terminates cleanly
- Events include meaningful custom properties (source, priority, batchId)
- Implements all core Event Hubs send/receive and checkpointing logic.
- Clean async/await usage and modular code.
- Graceful shutdown and resource cleanup.
- All required Azure SDK packages are present and correctly used.

### Issues

- Uses connection strings instead of @azure/identity with DefaultAzureCredential or specific Entra credentials
- No RestError import or statusCode-based error handling in processError or top-level catch
- No @azure/logger usage — relies entirely on console.log/console.error
- Client constructors use connection string pattern instead of endpoint URL + credential pattern
- Does not use @azure/identity or DefaultAzureCredential.
- Uses connection string constructors instead of endpoint + credential.
- No RestError-specific error handling.
- Does not use @azure/logger for diagnostics.
- SDK versions are not the latest.
- Pagination and LRO patterns not demonstrated (not strictly required for this sample).

## Grader Results

| Grader | Type | Score | Summary |
|--------|------|-------|----------|
| `claude-opus-4.6` | review | 16/23 | The code is well-structured and fully implements all Event Hubs-specific prompt … |
| `gpt-4.1` | review | 15/23 | The code is clean, idiomatic, and demonstrates core Event Hubs send/receive with… |
| 🏆 `consensus` | review | 17/26 | Average consensus from 2 reviewers: 17/26 criteria passed |

## Re-run Command

```bash
hyoka run --prompt-id event-hubs-dp-js-ts-streaming --config azure-mcp/gpt-5.4
```

---

[← Back to Summary](../../../../../../summary.md)
