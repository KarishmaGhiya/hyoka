# Evaluation Report: event-hubs-dp-js-ts-streaming

**Config:** azure-mcp-skills/gpt-5.4 | **Result:** ❌ FAILED | **Duration:** 269.9s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `event-hubs-dp-js-ts-streaming` |
| Config | azure-mcp-skills/gpt-5.4 |
| Result | ❌ FAILED |
| Score | 17/10 |
| Duration | 269.9s |
| Timestamp | 2026-05-01T01:10:46Z |
| Files Generated | 4 |
| Event Count | 219 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 126.3s |
| Review | 143.4s |
| **Total** | **269.9s** |

## Configuration

- **name:** azure-mcp-skills/gpt-5.4
- **model:** gpt-5.4

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | gpt-5.4 |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=302546 out=5768 |
| Turn Count | 9 |

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

### 🔧 2. azure-get_azure_bestpractices (via azure)

**Input:**

```json
{"intent":"Generate TypeScript Azure Event Hubs sample","learn":true}
```

### 🔧 3. glob

**Input:**

```json
{"paths":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-azure-mcp-skills-gpt-5.4-3398434620","pattern":"**/*"}
```

### 🔧 4. report_intent

**Input:**

```json
{"intent":"Researching Azure sample"}
```

### 🔧 5. azure-get_azure_bestpractices (via azure)

**Input:**

```json
{"command":"get_azure_bestpractices_get","intent":"Generate TypeScript Azure Event Hubs sample","parameters":{"action":"code-generation","resource":"general"}}
```

### 🔧 6. azure-documentation (via azure)

**Input:**

```json
{"intent":"Find Azure Event Hubs JS checkpoint store docs","learn":true}
```

### 🔧 7. report_intent

**Input:**

```json
{"intent":"Gathering sample patterns"}
```

### 🔧 8. azure-documentation (via azure)

**Input:**

```json
{"command":"microsoft_code_sample_search","intent":"Search Event Hubs TypeScript sample docs","parameters":{"language":"typescript","query":"Azure Event Hubs TypeScript EventHubProducerClient EventHubConsumerClient BlobCheckpointStore subscribe processEvents processError createBatch sendBatch"}}
```

### 🔧 9. azure-documentation (via azure)

**Input:**

```json
{"command":"microsoft_docs_search","intent":"Search Event Hubs consumer checkpoint docs","parameters":{"query":"Azure Event Hubs JavaScript BlobCheckpointStore subscribe processEvents checkpoint store"}}
```

### 🔧 10. report_intent

**Input:**

```json
{"intent":"Resolving package versions"}
```

### 🔧 11. powershell

**Input:**

```json
{"command":"npm view @azure/event-hubs version \u0026\u0026 npm view @azure/eventhubs-checkpointstore-blob version \u0026\u0026 npm view @azure/storage-blob version \u0026\u0026 npm view typescript version \u0026\u0026 npm view tsx version \u0026\u0026 npm view @types/node version","description":"Get latest npm package versions","initial_wait":30}
```

### 🔧 12. apply_patch

**Input:**

```json
"*** Begin Patch\n*** Add File: package.json\n+{\n+  \"name\": \"eventhubs-typescript-demo\",\n+  \"version\": \"1.0.0\",\n+  \"private\": true,\n+  \"type\": \"module\",\n+  \"scripts\": {\n+    \"start\": \"tsx eventhubs-demo.ts\",\n+    \"build\": \"tsc -p tsconfig.json\"\n+  },\n+  \"dependencies\": {\n+    \"@azure/event-hubs\": \"^6.0.4\",\n+    \"@azure/eventhubs-checkpointstore-blob\": \"^2.0.0\",\n+    \"@azure/storage-blob\": \"^12.31.0\"\n+  },\n+  \"devDependencies\": {\n+    \"@types/node\": \"^25.6.0\",\n+    \"tsx\": \"^4.21.0\",\n+    \"typescript\": \"^6.0.3\"\n+  }\n+}\n*** Add File: tsconfig.json\n+{\n+  \"compilerOptions\": {\n+    \"target\": \"ES2022\",\n+    \"module\": \"NodeNext\",\n+    \"moduleResolution\": \"NodeNext\",\n+    \"strict\": true,\n+    \"esModuleInterop\": true,\n+    \"forceConsistentCasingInFileNames\": true,\n+    \"skipLibCheck\": true,\n+    \"outDir\": \"dist\"\n+  },\n+  \"include\": [\n+    \"eventhubs-demo.ts\"\n+  ]\n+}\n*** Add File: eventhubs-demo.ts\n+import {\n+  EventHubConsumerClient,\n+  EventHubProducerClient,\n+  Subscription,\n+  earliestEventPosition,\n+  type ReceivedEventData,\n+} from \"@azure/event-hubs\";\n+import { BlobCheckpointStore } from \"@azure/eventhubs-checkpointstore-blob\";\n+import { ContainerClient } from \"@azure/storage-blob\";\n+\n+type Config = {\n+  eventHubsConnectionString: string;\n+  eventHubName: string;\n+  storageConnectionString: string;\n+  blobContainerName: string;\n+  consumerGroup: string;\n+  eventCount: number;\n+};\n+\n+function getRequiredEnv(name: string): string {\n+  const value = process.env[name];\n+  if (!value) {\n+    throw new Error(`Missing required environment variable: ${name}`);\n+  }\n+\n+  return value;\n+}\n+\n+function loadConfig(): Config {\n+  return {\n+    eventHubsConnectionString: getRequiredEnv(\"EVENT_HUBS_CONNECTION_STRING\"),\n+    eventHubName: getRequiredEnv(\"EVENT_HUB_NAME\"),\n+    storageConnectionString: getRequiredEnv(\"AZURE_STORAGE_CONNECTION_STRING\"),\n+    blobContainerName: process.env.BLOB_CONTAINER_NAME ?? \"eventhub-checkpoints\",\n+    consumerGroup:\n+      process.env.EVENT_HUB_CONSUMER_GROUP ??\n+      EventHubConsumerClient.defaultConsumerGroupName,\n+    eventCount: 10,\n+  };\n+}\n+\n+async function ensureCheckpointContainer(\n+  storageConnectionString: string,\n+  containerName: string,\n+): Promise\u003cContainerClient\u003e {\n+  const containerClient = new ContainerClient(storageConnectionString, containerName);\n+  await containerClient.createIfNotExists();\n+  return containerClient;\n+}\n+\n+function createEvents(eventCount: number): ReceivedEventData[] {\n+  return Array.from({ length: eventCount }, (_, index) =\u003e ({\n+    body: {\n+      id: index + 1,\n+      message: `Hello from Event Hubs event ${index + 1}`,\n+      sentAt: new Date().toISOString(),\n+    },\n+    contentType: \"application/json\",\n+    properties: {\n+      source: \"typescript-sample\",\n+      sequenceLabel: `event-${index + 1}`,\n+      isEven: (index + 1) % 2 === 0,\n+    },\n+  }));\n+}\n+\n+async function sendBatch(\n+  producerClient: EventHubProducerClient,\n+  eventCount: number,\n+): Promise\u003cvoid\u003e {\n+  const batch = await producerClient.createBatch();\n+\n+  for (const event of createEvents(eventCount)) {\n+    if (!batch.tryAdd(event)) {\n+      throw new Error(\"The batch is full before all 10 events could be added.\");\n+    }\n+  }\n+\n+  await producerClient.sendBatch(batch);\n+  console.log(`Sent ${eventCount} events.`);\n+}\n+\n+async function main(): Promise\u003cvoid\u003e {\n+  const config = loadConfig();\n+  const checkpointContainer = await ensureCheckpointContainer(\n+    config.storageConnectionString,\n+    config.blobContainerName,\n+  );\n+  const checkpointStore = new BlobCheckpointStore(checkpointContainer);\n+\n+  const producerClient = new EventHubProducerClient(\n+    config.eventHubsConnectionString,\n+    config.eventHubName,\n+  );\n+  const consumerClient = new EventHubConsumerClient(\n+    config.consumerGroup,\n+    config.eventHubsConnectionString,\n+    config.eventHubName,\n+    checkpointStore,\n+  );\n+\n+  let subscription: Subscription | undefined;\n+  let closingPromise: Promise\u003cvoid\u003e | undefined;\n+  let resolveDone!: () =\u003e void;\n+  const done = new Promise\u003cvoid\u003e((resolve) =\u003e {\n+    resolveDone = resolve;\n+  });\n+  let receivedCount = 0;\n+\n+  const close = async (): Promise\u003cvoid\u003e =\u003e {\n+    if (closingPromise) {\n+      return closingPromise;\n+    }\n+\n+    closingPromise = (async () =\u003e {\n+      console.log(\"Closing Event Hubs clients...\");\n+      await subscription?.close();\n+      await consumerClient.close();\n+      await producerClient.close();\n+      resolveDone();\n+    })();\n+\n+    return closingPromise;\n+  };\n+\n+  const handleSignal = (signal: NodeJS.Signals): void =\u003e {\n+    console.log(`Received ${signal}. Starting graceful shutdown...`);\n+    void close();\n+  };\n+\n+  process.once(\"SIGINT\", () =\u003e handleSignal(\"SIGINT\"));\n+  process.once(\"SIGTERM\", () =\u003e handleSignal(\"SIGTERM\"));\n+\n+  try {\n+    await sendBatch(producerClient, config.eventCount);\n+\n+    subscription = consumerClient.subscribe(\n+      {\n+        processEvents: async (events, context) =\u003e {\n+          if (events.length === 0) {\n+            return;\n+          }\n+\n+          for (const event of events) {\n+            receivedCount += 1;\n+            console.log(\n+              `[partition ${context.partitionId}] body=${JSON.stringify(event.body)} properties=${JSON.stringify(event.properties ?? {})}`,\n+            );\n+          }\n+\n+          const lastEvent = events[events.length - 1];\n+          await context.updateCheckpoint(lastEvent);\n+          console.log(\n+            `[partition ${context.partitionId}] checkpoint updated at sequence ${lastEvent.sequenceNumber}`,\n+          );\n+\n+          if (receivedCount \u003e= config.eventCount) {\n+            await close();\n+          }\n+        },\n+        processError: async (error, context) =\u003e {\n+          console.error(\n+            `Error while receiving from partition ${context.partitionId ?? \"unknown\"}:`,\n+            error,\n+          );\n+          await close();\n+        },\n+      },\n+      {\n+        startPosition: earliestEventPosition,\n+        maxWaitTimeInSeconds: 5,\n+      },\n+    );\n+\n+    console.log(\"Waiting to receive events. Press Ctrl+C to stop.\");\n+    await done;\n+  } catch (error) {\n+    console.error(\"Sample failed:\", error);\n+    process.exitCode = 1;\n+    await close();\n+  }\n+}\n+\n+void main();\n*** End Patch\n"
```

### 🔧 13. report_intent

**Input:**

```json
{"intent":"Building sample"}
```

### 🔧 14. powershell

**Input:**

```json
{"command":"npm install \u0026\u0026 npm run build","description":"Install dependencies and compile sample","initial_wait":180,"shellId":"eventhubs-demo-build"}
```

### 🔧 15. apply_patch

**Input:**

```json
"*** Begin Patch\n*** Update File: eventhubs-demo.ts\n@@\n import {\n+  type EventData,\n   EventHubConsumerClient,\n   EventHubProducerClient,\n   Subscription,\n   earliestEventPosition,\n-  type ReceivedEventData,\n } from \"@azure/event-hubs\";\n@@\n-function createEvents(eventCount: number): ReceivedEventData[] {\n+function createEvents(eventCount: number): EventData[] {\n*** End Patch\n"
```

### 🔧 16. report_intent

**Input:**

```json
{"intent":"Rebuilding sample"}
```

### 🔧 17. powershell

**Input:**

```json
{"command":"npm run build","description":"Compile sample after type fix","initial_wait":120,"shellId":"eventhubs-demo-build"}
```

## Generated Files

- `eventhubs-demo.ts`
- `package-lock.json`
- `package.json`
- `tsconfig.json`

## Copilot Response

I’m pulling the Azure guidance first, then I’ll drop in a runnable TypeScript sample with the producer, consumer, checkpointing, and shutdown flow wired together.

I found the workspace is empty, so I’m creating a self-contained sample rather than patching an existing project. I’m checking the latest official Event Hubs patterns so the code matches current SDK usage.

I’ve got the current SDK shape. I’m pulling package versions now so the sample doesn’t bake in stale dependencies before I write the files.

The sample is in place. I’m installing the minimal packages and compiling it once so the final handoff is a working example, not just a draft.

**Done.** I added a working TypeScript sample in `eventhubs-demo.ts` plus `package.json` and `tsconfig.json`. It sends 10 events in a batch with custom properties, subscribes with `EventHubConsumerClient` + `BlobCheckpointStore`, prints received bodies, updates checkpoints, and shuts down cleanly on completion or `Ctrl+C`.

**Packages**
```bash
npm install @azure/event-hubs @azure/eventhubs-checkpointstore-blob @azure/storage-blob
npm install -D typescript tsx @types/node
```

**Run**
```powershell
$env:EVENT_HUBS_CONNECTION_STRING="..."
$env:EVENT_HUB_NAME="..."
$env:AZURE_STORAGE_CONNECTION_STRING="..."
npm start
```

Optional env vars: `BLOB_CONTAINER_NAME` and `EVENT_HUB_CONSUMER_GROUP`.

**References:**  
https://learn.microsoft.com/javascript/api/overview/azure/event-hubs-readme?view=azure-node-latest#examples  
https://learn.microsoft.com/javascript/api/overview/azure/eventhubs-checkpointstore-blob-readme?view=azure-node-latest#examples

## Code Review (LLM-as-Judge)

**Score: 17/23 criteria passed**

### Criteria Results

| Criterion | Result | Reason |
|-----------|--------|--------|
| Code Builds | ✅ | Both reviewers confirm syntactically correct TypeScript with valid package.json and tsconfig.json. No type errors apparent from inspection. |
| Latest Package Versions | ✅ | Reviewer 1 verified via npm registry: @azure/event-hubs@6.0.4, @azure/eventhubs-checkpointstore-blob@2.0.0, @azure/storage-blob@12.31.0 are all latest stable. Reviewer 2's claim of outdated packages is incorrect per registry data. |
| Best Practices | ❌ | Both reviewers agree: uses connection strings instead of DefaultAzureCredential, no @azure/identity, no @azure/logger for diagnostics. |
| Error Handling | ❌ | Both reviewers agree: only generic Error caught, no RestError-specific handling, processError closes entire client on any error without distinguishing transient errors. |
| Code Quality | ✅ | Both reviewers agree: clean, modular, well-structured TypeScript with proper type annotations, idempotent close() pattern, and graceful shutdown. |
| Correct @azure/ Scoped Packages | ✅ | Both reviewers confirm all dependencies use @azure/ scoped packages with no deprecated unscoped packages. |
| @azure/identity for Authentication | ❌ | Both reviewers agree: no @azure/identity dependency, uses connection strings for both Event Hubs and Storage authentication. |
| Client Constructor with Endpoint and Credential | ❌ | Both reviewers agree: EventHubProducerClient, EventHubConsumerClient, and ContainerClient all use connection strings instead of endpoint + credential. |
| Async/Await Pattern | ✅ | Both reviewers confirm proper async/await throughout, void main() entry point for ESM, no .then()/.catch() chains. |
| Pagination with for-await-of | ✅ | Both reviewers agree: not applicable for Event Hubs send/receive scenario. |
| LRO Pattern (beginXxx + pollUntilDone) | ✅ | Both reviewers agree: not applicable for this Event Hubs scenario. |
| RestError Exception Handling | ❌ | Both reviewers agree: no RestError import or catch, no statusCode inspection for error-specific handling. |
| No Deprecated Packages | ✅ | Both reviewers confirm no deprecated or legacy Azure packages. |
| Logging via @azure/logger | ❌ | Both reviewers agree: no @azure/logger import, no setLogLevel() call, no AZURE_LOG_LEVEL handling. |
| package.json with Correct Dependencies | ✅ | Both reviewers confirm valid package.json with all required @azure/* dependencies, tsconfig.json, @types/node, TypeScript 6.x, and tsx. |
| @azure/event-hubs and @azure/eventhubs-checkpointstore-blob packages | ✅ | Both reviewers confirm both packages are listed in dependencies and properly imported. |
| EventHubProducerClient constructor | ✅ | Both reviewers confirm EventHubProducerClient is constructed with connection string and event hub name. |
| createBatch() and EventDataBatch.tryAdd() | ✅ | Both reviewers confirm createBatch() and tryAdd() are used with proper boolean return value checking. |
| sendBatch() for publishing | ✅ | Both reviewers confirm producerClient.sendBatch(batch) is called after adding events. |
| EventHubConsumerClient with BlobCheckpointStore | ✅ | Both reviewers confirm consumer client is constructed with consumer group, connection string, event hub name, and BlobCheckpointStore. |
| subscribe() with SubscriptionEventHandlers | ✅ | Both reviewers confirm subscribe() is called with processEvents and processError async handlers. |
| updateCheckpoint() in processEvents handler | ✅ | Both reviewers confirm context.updateCheckpoint(lastEvent) is called after processing events. |
| close() for cleanup | ✅ | Both reviewers confirm comprehensive close() with subscription, consumer, and producer cleanup plus SIGINT/SIGTERM signal handlers. |

### Summary

The code is a well-structured Event Hubs TypeScript demo that correctly implements all 8 prompt-specific requirements (producer, consumer, batching, checkpointing, graceful shutdown). Code quality is high with clean async/await patterns, proper TypeScript typing, and an idempotent close() pattern. All Azure SDK packages are the latest stable versions. However, it fails several Azure SDK best-practice criteria: it uses connection strings instead of @azure/identity for authentication, lacks RestError-specific exception handling, and does not use @azure/logger for diagnostic logging.

### Strengths

- All 8 prompt-specific criteria fully met — complete Event Hubs producer/consumer implementation
- Latest stable versions of all Azure SDK packages (verified via npm registry)
- Clean, modular, well-structured TypeScript with proper type annotations
- Idempotent close() pattern prevents double-close issues
- Graceful shutdown via SIGINT/SIGTERM signal handlers
- Proper createBatch/tryAdd pattern with overflow detection
- Config loaded from environment variables with validation
- ESM configured correctly with type: module and NodeNext module resolution

### Issues

- Uses connection strings instead of @azure/identity (DefaultAzureCredential or specific token credentials)
- Clients constructed with connection strings instead of endpoint URL + TokenCredential pattern
- No RestError handling — only catches generic Error
- No @azure/logger usage for SDK diagnostic logging
- processError handler closes the entire client on any error instead of handling transient errors gracefully

## Grader Results

| Grader | Type | Score | Summary |
|--------|------|-------|----------|
| `claude-opus-4.6` | review | 16/23 | The code is a well-structured Event Hubs TypeScript demo that correctly implemen… |
| `gpt-4.1` | review | 16/23 | The code demonstrates core Event Hubs send/receive patterns and meets most promp… |
| 🏆 `consensus` | review | 17/23 | The code is a well-structured Event Hubs TypeScript demo that correctly implemen… |

## Re-run Command

```bash
hyoka run --prompt-id event-hubs-dp-js-ts-streaming --config azure-mcp-skills/gpt-5.4
```

---

[← Back to Summary](../../../../../../summary.md)
