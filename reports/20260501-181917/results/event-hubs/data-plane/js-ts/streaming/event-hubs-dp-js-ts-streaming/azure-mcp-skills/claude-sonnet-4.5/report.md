# Evaluation Report: event-hubs-dp-js-ts-streaming

**Config:** azure-mcp-skills/claude-sonnet-4.5 | **Result:** ❌ FAILED | **Duration:** 193.0s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `event-hubs-dp-js-ts-streaming` |
| Config | azure-mcp-skills/claude-sonnet-4.5 |
| Result | ❌ FAILED |
| Score | 17/10 |
| Duration | 193.0s |
| Timestamp | 2026-05-02T01:21:23Z |
| Files Generated | 4 |
| Event Count | 108 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 119.8s |
| Review | 72.9s |
| **Total** | **193.0s** |

## Configuration

- **name:** azure-mcp-skills/claude-sonnet-4.5
- **model:** claude-sonnet-4.5

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-sonnet-4.5 |
| Skill Directories | C:\code\hyoka\skills\generator\js-ts-azure-patterns, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-identity-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-storage-blob-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-keyvault-secrets-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-keyvault-keys-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-cosmos-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-servicebus-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-eventhub-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-appconfiguration-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-storage-queue-ts |
| Skills Loaded | azure-identity-ts, azure-storage-blob-ts, azure-keyvault-secrets-ts, azure-keyvault-keys-ts, azure-cosmos-ts, azure-servicebus-ts, azure-eventhub-ts, azure-appconfiguration-ts, azure-storage-queue-ts, customize-cloud-agent |
| Skills Invoked | azure-eventhub-ts |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=288507 out=7706 |
| Turn Count | 6 |

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

The user wants me to create a TypeScript program that demonstrates Azure Event Hubs functionality. This is a perfect use case for the azure-eventhub-ts skill, which specializes in Event Hubs SDK operations.

According to the instructions, I should invoke the relevant skill BEFORE writing any code to get SDK-specific patterns, API examples, and acceptance criteria.

Let me invoke the azure-eventhub-ts skill first.

The user wants a TypeScript program demonstrating Azure Event Hubs with:
1. Producer client using connection string
2. Create batch with 10 events with custom properties
3. Send batch
4. Consumer client with BlobCheckpointStore
5. Subscribe with processEvents and processError
6. Print event bodies and update checkpoints
7. Graceful shutdown

I should read the reference files to get more detailed patterns, then create a comprehensive example.

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Creating Event Hubs demo"}
```

### 🔧 2. skill

**Input:**

```json
{"skill":"azure-eventhub-ts"}
```

### 🔧 3. view

**Input:**

```json
{"path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-config-3566581456\\.skills-cache\\microsoft\\skills\\.github\\plugins\\azure-sdk-typescript\\skills\\azure-eventhub-ts\\references\\checkpointing.md"}
```

### 🔧 4. view

**Input:**

```json
{"path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-config-3566581456\\.skills-cache\\microsoft\\skills\\.github\\plugins\\azure-sdk-typescript\\skills\\azure-eventhub-ts\\references\\event-processing.md"}
```

### 🔧 5. create

**Input:**

```json
{"file_text":"import {\n  EventHubProducerClient,\n  EventHubConsumerClient,\n  ReceivedEventData,\n  PartitionContext,\n  Subscription,\n} from \"@azure/event-hubs\";\nimport { ContainerClient } from \"@azure/storage-blob\";\nimport { BlobCheckpointStore } from \"@azure/eventhubs-checkpointstore-blob\";\n\n/**\n * Azure Event Hubs Demo\n * \n * Demonstrates:\n * 1. Sending events with EventHubProducerClient\n * 2. Creating and sending batches with custom properties\n * 3. Receiving events with EventHubConsumerClient\n * 4. Using BlobCheckpointStore for persistent checkpointing\n * 5. Processing events with handlers\n * 6. Graceful shutdown\n */\n\n// Configuration from environment variables\nconst eventHubConnectionString = process.env.EVENTHUB_CONNECTION_STRING || \"\";\nconst eventHubName = process.env.EVENTHUB_NAME || \"my-event-hub\";\nconst storageConnectionString = process.env.STORAGE_CONNECTION_STRING || \"\";\nconst storageContainerName = process.env.STORAGE_CONTAINER_NAME || \"eventhub-checkpoints\";\nconst consumerGroup = \"$Default\"; // Use $Default consumer group\n\n// Global subscription reference for graceful shutdown\nlet subscription: Subscription | null = null;\nlet producerClient: EventHubProducerClient | null = null;\nlet consumerClient: EventHubConsumerClient | null = null;\n\n/**\n * Send events to Event Hub\n */\nasync function sendEvents(): Promise\u003cvoid\u003e {\n  console.log(\"\\n=== SENDING EVENTS ===\\n\");\n\n  // Create producer client using connection string\n  producerClient = new EventHubProducerClient(\n    eventHubConnectionString,\n    eventHubName\n  );\n\n  try {\n    // Create a batch\n    console.log(\"Creating batch...\");\n    const batch = await producerClient.createBatch();\n\n    // Add 10 events with custom properties\n    for (let i = 1; i \u003c= 10; i++) {\n      const eventData = {\n        body: {\n          message: `Event message ${i}`,\n          timestamp: new Date().toISOString(),\n          value: Math.floor(Math.random() * 100),\n        },\n        properties: {\n          eventType: \"telemetry\",\n          deviceId: `device-${i % 3 + 1}`, // Distribute across 3 devices\n          priority: i % 2 === 0 ? \"high\" : \"normal\",\n        },\n        contentType: \"application/json\",\n        correlationId: `correlation-${i}`,\n      };\n\n      // Try adding event to batch\n      const isAdded = batch.tryAdd(eventData);\n      if (!isAdded) {\n        console.log(`Event ${i} could not be added to batch (batch full)`);\n        break;\n      }\n      console.log(`Added event ${i} to batch`);\n    }\n\n    // Send the batch\n    console.log(`\\nSending batch with ${batch.count} events...`);\n    await producerClient.sendBatch(batch);\n    console.log(`Successfully sent ${batch.count} events!\\n`);\n  } catch (error) {\n    console.error(\"Error sending events:\", error);\n    throw error;\n  }\n}\n\n/**\n * Receive events from Event Hub with checkpointing\n */\nasync function receiveEvents(): Promise\u003cvoid\u003e {\n  console.log(\"\\n=== RECEIVING EVENTS ===\\n\");\n\n  // Create container client for checkpoint storage\n  const containerClient = new ContainerClient(\n    storageConnectionString,\n    storageContainerName\n  );\n\n  // Ensure container exists\n  console.log(\"Ensuring checkpoint container exists...\");\n  await containerClient.createIfNotExists();\n  console.log(\"Checkpoint container ready.\\n\");\n\n  // Create BlobCheckpointStore\n  const checkpointStore = new BlobCheckpointStore(containerClient);\n\n  // Create consumer client with checkpoint store\n  consumerClient = new EventHubConsumerClient(\n    consumerGroup,\n    eventHubConnectionString,\n    eventHubName,\n    checkpointStore\n  );\n\n  console.log(\"Starting event consumer...\\n\");\n\n  // Subscribe to events with handlers\n  subscription = consumerClient.subscribe(\n    {\n      // Initialize handler - called when starting to receive from a partition\n      processInitialize: async (context: PartitionContext) =\u003e {\n        console.log(`[INIT] Started receiving from partition ${context.partitionId}`);\n      },\n\n      // Events handler - processes batches of events\n      processEvents: async (\n        events: ReceivedEventData[],\n        context: PartitionContext\n      ) =\u003e {\n        // Handle empty batches\n        if (events.length === 0) {\n          console.log(`[PARTITION ${context.partitionId}] No events received, waiting...`);\n          return;\n        }\n\n        console.log(\n          `\\n[PARTITION ${context.partitionId}] Received ${events.length} event(s)\\n`\n        );\n\n        // Process each event\n        for (const event of events) {\n          // Print event details\n          console.log(`  Event Details:`);\n          console.log(`    Sequence Number: ${event.sequenceNumber}`);\n          console.log(`    Offset: ${event.offset}`);\n          console.log(`    Enqueued Time: ${event.enqueuedTimeUtc?.toISOString()}`);\n          console.log(`    Partition Key: ${event.partitionKey || \"none\"}`);\n          console.log(`    Content Type: ${event.contentType || \"none\"}`);\n          console.log(`    Correlation ID: ${event.correlationId || \"none\"}`);\n\n          // Print custom properties\n          if (event.properties) {\n            console.log(`    Custom Properties:`);\n            for (const [key, value] of Object.entries(event.properties)) {\n              console.log(`      ${key}: ${value}`);\n            }\n          }\n\n          // Print event body\n          console.log(`    Body: ${JSON.stringify(event.body, null, 2)}`);\n          console.log(\"\");\n\n          // Simulate event processing\n          await processEvent(event);\n        }\n\n        // Update checkpoint after successfully processing all events in batch\n        const lastEvent = events[events.length - 1];\n        try {\n          await context.updateCheckpoint(lastEvent);\n          console.log(\n            `[PARTITION ${context.partitionId}] Checkpoint updated at sequence ${lastEvent.sequenceNumber}\\n`\n          );\n        } catch (error) {\n          console.error(\n            `[PARTITION ${context.partitionId}] Failed to update checkpoint:`,\n            error\n          );\n        }\n      },\n\n      // Error handler - handles errors during event processing\n      processError: async (err: Error, context: PartitionContext) =\u003e {\n        console.error(\n          `\\n[ERROR] Partition ${context.partitionId}: ${err.message}\\n`\n        );\n      },\n\n      // Close handler - called when stopping receiving from a partition\n      processClose: async (reason: string, context: PartitionContext) =\u003e {\n        console.log(\n          `[CLOSE] Stopped receiving from partition ${context.partitionId}, reason: ${reason}`\n        );\n      },\n    },\n    {\n      // Start from earliest available event (for demo purposes)\n      startPosition: { offset: \"@earliest\" },\n      // Maximum events per batch\n      maxBatchSize: 10,\n      // Maximum wait time in seconds for a batch\n      maxWaitTimeInSeconds: 30,\n    }\n  );\n\n  console.log(\"Consumer is now listening for events...\");\n  console.log(\"Press Ctrl+C to stop.\\n\");\n}\n\n/**\n * Simulate processing an event\n */\nasync function processEvent(event: ReceivedEventData): Promise\u003cvoid\u003e {\n  // Simulate some processing work\n  await new Promise((resolve) =\u003e setTimeout(resolve, 100));\n  // In a real application, you would process the event here\n  // e.g., save to database, call API, trigger workflow, etc.\n}\n\n/**\n * Graceful shutdown handler\n */\nasync function shutdown(): Promise\u003cvoid\u003e {\n  console.log(\"\\n\\n=== SHUTTING DOWN GRACEFULLY ===\\n\");\n\n  try {\n    // Close subscription first (stops receiving new events)\n    if (subscription) {\n      console.log(\"Closing subscription...\");\n      await subscription.close();\n      console.log(\"Subscription closed.\");\n    }\n\n    // Close consumer client\n    if (consumerClient) {\n      console.log(\"Closing consumer client...\");\n      await consumerClient.close();\n      console.log(\"Consumer client closed.\");\n    }\n\n    // Close producer client\n    if (producerClient) {\n      console.log(\"Closing producer client...\");\n      await producerClient.close();\n      console.log(\"Producer client closed.\");\n    }\n\n    console.log(\"\\nShutdown complete!\");\n  } catch (error) {\n    console.error(\"Error during shutdown:\", error);\n  } finally {\n    process.exit(0);\n  }\n}\n\n/**\n * Main function\n */\nasync function main(): Promise\u003cvoid\u003e {\n  console.log(\"=== Azure Event Hubs Demo ===\");\n\n  // Validate configuration\n  if (!eventHubConnectionString) {\n    throw new Error(\"EVENTHUB_CONNECTION_STRING environment variable is required\");\n  }\n  if (!storageConnectionString) {\n    throw new Error(\"STORAGE_CONNECTION_STRING environment variable is required\");\n  }\n\n  try {\n    // Step 1: Send events\n    await sendEvents();\n\n    // Wait a moment before starting consumer\n    console.log(\"Waiting 2 seconds before starting consumer...\\n\");\n    await new Promise((resolve) =\u003e setTimeout(resolve, 2000));\n\n    // Step 2: Receive events\n    await receiveEvents();\n\n    // Run for 60 seconds then shutdown (for demo purposes)\n    // In production, you would keep this running continuously\n    setTimeout(async () =\u003e {\n      console.log(\"\\n\\nDemo time limit reached (60 seconds).\");\n      await shutdown();\n    }, 60000);\n  } catch (error) {\n    console.error(\"Error in main:\", error);\n    await shutdown();\n  }\n}\n\n// Setup signal handlers for graceful shutdown\nprocess.on(\"SIGINT\", shutdown);\nprocess.on(\"SIGTERM\", shutdown);\n\n// Handle unhandled rejections\nprocess.on(\"unhandledRejection\", (reason, promise) =\u003e {\n  console.error(\"Unhandled Rejection at:\", promise, \"reason:\", reason);\n  shutdown();\n});\n\n// Start the application\nmain().catch((error) =\u003e {\n  console.error(\"Fatal error:\", error);\n  process.exit(1);\n});\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-azure-mcp-skills-claude-sonnet-4.5-1342372000\\event-hubs-demo.ts"}
```

### 🔧 6. create

**Input:**

```json
{"file_text":"{\n  \"name\": \"azure-event-hubs-demo\",\n  \"version\": \"1.0.0\",\n  \"description\": \"Azure Event Hubs TypeScript demo with producer, consumer, and checkpointing\",\n  \"main\": \"event-hubs-demo.ts\",\n  \"scripts\": {\n    \"build\": \"tsc\",\n    \"start\": \"node dist/event-hubs-demo.js\",\n    \"dev\": \"ts-node event-hubs-demo.ts\"\n  },\n  \"keywords\": [\n    \"azure\",\n    \"event-hubs\",\n    \"typescript\",\n    \"checkpointing\",\n    \"streaming\"\n  ],\n  \"author\": \"\",\n  \"license\": \"MIT\",\n  \"dependencies\": {\n    \"@azure/event-hubs\": \"^5.12.0\",\n    \"@azure/eventhubs-checkpointstore-blob\": \"^1.1.0\",\n    \"@azure/storage-blob\": \"^12.24.0\"\n  },\n  \"devDependencies\": {\n    \"@types/node\": \"^20.12.0\",\n    \"typescript\": \"^5.4.0\",\n    \"ts-node\": \"^10.9.2\"\n  }\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-azure-mcp-skills-claude-sonnet-4.5-1342372000\\package.json"}
```

### 🔧 7. create

**Input:**

```json
{"file_text":"{\n  \"compilerOptions\": {\n    \"target\": \"ES2020\",\n    \"module\": \"commonjs\",\n    \"lib\": [\"ES2020\"],\n    \"outDir\": \"./dist\",\n    \"rootDir\": \"./\",\n    \"strict\": true,\n    \"esModuleInterop\": true,\n    \"skipLibCheck\": true,\n    \"forceConsistentCasingInFileNames\": true,\n    \"moduleResolution\": \"node\",\n    \"resolveJsonModule\": true,\n    \"declaration\": true,\n    \"declarationMap\": true,\n    \"sourceMap\": true\n  },\n  \"include\": [\"*.ts\"],\n  \"exclude\": [\"node_modules\", \"dist\"]\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-azure-mcp-skills-claude-sonnet-4.5-1342372000\\tsconfig.json"}
```

### 🔧 8. create

**Input:**

```json
{"file_text":"# Azure Event Hubs TypeScript Demo\n\nA comprehensive TypeScript example demonstrating Azure Event Hubs operations including sending events, receiving events with checkpointing, and graceful shutdown.\n\n## Features\n\n✅ **EventHubProducerClient** - Send events using connection string  \n✅ **Batch Operations** - Create batches and add multiple events  \n✅ **Custom Properties** - Add custom properties to events  \n✅ **EventHubConsumerClient** - Receive events from Event Hub  \n✅ **BlobCheckpointStore** - Persistent checkpointing with Azure Blob Storage  \n✅ **Event Handlers** - Process events with full lifecycle handlers  \n✅ **Graceful Shutdown** - Proper cleanup and resource management  \n\n## Prerequisites\n\n- Node.js 18+ and npm\n- Azure Event Hubs namespace and event hub\n- Azure Storage account and container for checkpoints\n- Connection strings for both services\n\n## Installation\n\n1. Install dependencies:\n\n```bash\nnpm install\n```\n\n## Required Packages\n\n```json\n{\n  \"@azure/event-hubs\": \"^5.12.0\",\n  \"@azure/eventhubs-checkpointstore-blob\": \"^1.1.0\",\n  \"@azure/storage-blob\": \"^12.24.0\"\n}\n```\n\n## Configuration\n\nSet the following environment variables:\n\n```bash\n# Event Hub Configuration\nexport EVENTHUB_CONNECTION_STRING=\"Endpoint=sb://YOUR-NAMESPACE.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=YOUR-KEY\"\nexport EVENTHUB_NAME=\"my-event-hub\"\n\n# Storage Account Configuration (for checkpointing)\nexport STORAGE_CONNECTION_STRING=\"DefaultEndpointsProtocol=https;AccountName=YOUR-ACCOUNT;AccountKey=YOUR-KEY;EndpointSuffix=core.windows.net\"\nexport STORAGE_CONTAINER_NAME=\"eventhub-checkpoints\"\n```\n\n### Get Connection Strings\n\n**Event Hub Connection String:**\n```bash\naz eventhubs namespace authorization-rule keys list \\\n  --resource-group \u003cresource-group\u003e \\\n  --namespace-name \u003cnamespace\u003e \\\n  --name RootManageSharedAccessKey \\\n  --query primaryConnectionString -o tsv\n```\n\n**Storage Connection String:**\n```bash\naz storage account show-connection-string \\\n  --name \u003cstorage-account\u003e \\\n  --resource-group \u003cresource-group\u003e \\\n  --query connectionString -o tsv\n```\n\n## Usage\n\n### Run with ts-node (Development)\n\n```bash\nnpm run dev\n```\n\n### Build and Run (Production)\n\n```bash\nnpm run build\nnpm start\n```\n\n## How It Works\n\n### 1. Sending Events\n\nThe program creates an `EventHubProducerClient` using the connection string:\n\n```typescript\nconst producer = new EventHubProducerClient(\n  eventHubConnectionString,\n  eventHubName\n);\n```\n\nCreates a batch and adds 10 events with custom properties:\n\n```typescript\nconst batch = await producer.createBatch();\n\nfor (let i = 1; i \u003c= 10; i++) {\n  batch.tryAdd({\n    body: { message: `Event ${i}`, value: Math.random() * 100 },\n    properties: {\n      eventType: \"telemetry\",\n      deviceId: `device-${i}`,\n      priority: \"high\"\n    },\n    contentType: \"application/json\",\n    correlationId: `correlation-${i}`\n  });\n}\n\nawait producer.sendBatch(batch);\n```\n\n### 2. Receiving Events with Checkpointing\n\nCreates a `BlobCheckpointStore` for persistent checkpoints:\n\n```typescript\nconst containerClient = new ContainerClient(\n  storageConnectionString,\n  storageContainerName\n);\nawait containerClient.createIfNotExists();\n\nconst checkpointStore = new BlobCheckpointStore(containerClient);\n```\n\nCreates an `EventHubConsumerClient` with the checkpoint store:\n\n```typescript\nconst consumer = new EventHubConsumerClient(\n  \"$Default\",\n  eventHubConnectionString,\n  eventHubName,\n  checkpointStore\n);\n```\n\n### 3. Subscribe with Handlers\n\nSubscribes to events with full lifecycle handlers:\n\n```typescript\nconst subscription = consumer.subscribe({\n  processInitialize: async (context) =\u003e {\n    console.log(`Started receiving from partition ${context.partitionId}`);\n  },\n\n  processEvents: async (events, context) =\u003e {\n    for (const event of events) {\n      console.log(`Body: ${JSON.stringify(event.body)}`);\n      console.log(`Properties: ${JSON.stringify(event.properties)}`);\n    }\n    \n    // Update checkpoint after processing\n    if (events.length \u003e 0) {\n      await context.updateCheckpoint(events[events.length - 1]);\n    }\n  },\n\n  processError: async (err, context) =\u003e {\n    console.error(`Error on partition ${context.partitionId}: ${err.message}`);\n  },\n\n  processClose: async (reason, context) =\u003e {\n    console.log(`Stopped receiving from partition ${context.partitionId}`);\n  }\n}, {\n  startPosition: { offset: \"@earliest\" },\n  maxBatchSize: 10,\n  maxWaitTimeInSeconds: 30\n});\n```\n\n### 4. Graceful Shutdown\n\nHandles SIGINT and SIGTERM signals:\n\n```typescript\nasync function shutdown() {\n  await subscription.close();\n  await consumer.close();\n  await producer.close();\n  process.exit(0);\n}\n\nprocess.on(\"SIGINT\", shutdown);\nprocess.on(\"SIGTERM\", shutdown);\n```\n\n## Key Concepts\n\n### Event Properties\n\nEach event includes:\n- **body** - Event payload (any JSON-serializable data)\n- **properties** - Custom application properties\n- **contentType** - MIME type of the body\n- **correlationId** - For request-response patterns\n- **sequenceNumber** - Unique sequence per partition\n- **offset** - Position in the partition\n- **enqueuedTimeUtc** - When event was enqueued\n- **partitionKey** - Key for partition assignment\n\n### Checkpointing\n\nCheckpointing tracks the last successfully processed event:\n- Enables resumption after restart\n- Prevents reprocessing of events\n- Stored persistently in Azure Blob Storage\n- Updated after successful event processing\n- Critical for production scenarios\n\n### Consumer Groups\n\nConsumer groups enable multiple independent consumers:\n- `$Default` is the built-in consumer group\n- Each consumer group maintains its own checkpoints\n- Multiple consumers in same group load-balance partitions\n\n## Best Practices\n\n1. ✅ **Always use checkpointing** in production\n2. ✅ **Checkpoint after processing**, not before\n3. ✅ **Use batches** for efficient sending\n4. ✅ **Handle empty event batches** (processEvents may receive [])\n5. ✅ **Close clients** on shutdown\n6. ✅ **Add retry logic** for transient failures\n7. ✅ **Monitor consumer lag** in production\n\n## Troubleshooting\n\n### Connection Issues\n\n- Verify Event Hub connection string includes event hub name or pass separately\n- Check firewall rules allow access to Event Hubs (port 5671/5672)\n- Ensure storage container exists and is accessible\n\n### No Events Received\n\n- Check events were sent successfully\n- Verify consumer group name matches\n- Check start position (use `@earliest` to receive all events)\n- Wait for `maxWaitTimeInSeconds` before expecting events\n\n### Checkpoint Errors\n\n- Ensure storage container exists: `az storage container create`\n- Verify storage connection string is valid\n- Check storage account has sufficient permissions\n\n## Output Example\n\n```\n=== Azure Event Hubs Demo ===\n\n=== SENDING EVENTS ===\n\nCreating batch...\nAdded event 1 to batch\nAdded event 2 to batch\n...\nAdded event 10 to batch\n\nSending batch with 10 events...\nSuccessfully sent 10 events!\n\n=== RECEIVING EVENTS ===\n\nEnsuring checkpoint container exists...\nCheckpoint container ready.\n\nStarting event consumer...\nConsumer is now listening for events...\n\n[INIT] Started receiving from partition 0\n\n[PARTITION 0] Received 10 event(s)\n\n  Event Details:\n    Sequence Number: 123\n    Offset: 4567\n    Enqueued Time: 2024-01-15T10:30:00.000Z\n    Custom Properties:\n      eventType: telemetry\n      deviceId: device-1\n      priority: high\n    Body: {\n      \"message\": \"Event message 1\",\n      \"timestamp\": \"2024-01-15T10:30:00.000Z\",\n      \"value\": 42\n    }\n\n[PARTITION 0] Checkpoint updated at sequence 132\n\nPress Ctrl+C to stop.\n```\n\n## Resources\n\n- [Azure Event Hubs Documentation](https://learn.microsoft.com/azure/event-hubs/)\n- [@azure/event-hubs SDK](https://www.npmjs.com/package/@azure/event-hubs)\n- [@azure/eventhubs-checkpointstore-blob SDK](https://www.npmjs.com/package/@azure/eventhubs-checkpointstore-blob)\n- [Event Hubs Quotas and Limits](https://learn.microsoft.com/azure/event-hubs/event-hubs-quotas)\n\n## License\n\nMIT\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-azure-mcp-skills-claude-sonnet-4.5-1342372000\\README.md"}
```

### 🔧 9. create

**Input:**

```json
{"file_text":"# Azure Event Hubs Configuration\nEVENTHUB_CONNECTION_STRING=Endpoint=sb://YOUR-NAMESPACE.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=YOUR-KEY\nEVENTHUB_NAME=my-event-hub\n\n# Azure Storage Configuration (for checkpointing)\nSTORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=YOUR-ACCOUNT;AccountKey=YOUR-KEY;EndpointSuffix=core.windows.net\nSTORAGE_CONTAINER_NAME=eventhub-checkpoints\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-azure-mcp-skills-claude-sonnet-4.5-1342372000\\.env.example"}
```

### 🔧 10. create

**Input:**

```json
{"file_text":"# Dependencies\nnode_modules/\n\n# Build output\ndist/\n*.js\n*.js.map\n*.d.ts\n*.d.ts.map\n\n# Environment variables\n.env\n.env.local\n\n# Logs\n*.log\nnpm-debug.log*\n\n# IDE\n.vscode/\n.idea/\n*.swp\n*.swo\n\n# OS\n.DS_Store\nThumbs.db\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-azure-mcp-skills-claude-sonnet-4.5-1342372000\\.gitignore"}
```

## Generated Files

- `README.md`
- `event-hubs-demo.ts`
- `package.json`
- `tsconfig.json`

## Copilot Response

I'll help you create a TypeScript program demonstrating Azure Event Hubs operations. Let me first invoke the Azure Event Hubs skill to get the latest SDK patterns and best practices.

Now let me read the reference files for more detailed patterns:

Perfect! Now I'll create a comprehensive TypeScript program demonstrating all the requested features:

Now let me create the package.json file and additional documentation:

Perfect! Now let me create a .gitignore file as well:

Excellent! I've created a comprehensive TypeScript program demonstrating Azure Event Hubs operations. Here's what was delivered:

## 📦 Created Files

1. **`event-hubs-demo.ts`** - Main TypeScript program with all requested features
2. **`package.json`** - NPM dependencies and scripts
3. **`tsconfig.json`** - TypeScript configuration
4. **`README.md`** - Comprehensive documentation
5. **`.env.example`** - Environment variable template
6. **`.gitignore`** - Git ignore patterns

## ✨ Key Features Implemented

### 1. **EventHubProducerClient with Connection String**
- Creates producer using connection string authentication
- Properly initializes and closes the client

### 2. **Batch Creation with Custom Properties**
- Uses `createBatch()` to create optimized batches
- Adds 10 events with `tryAdd()` method
- Each event includes:
  - Body with structured data (message, timestamp, value)
  - Custom properties (eventType, deviceId, priority)
  - Content type and correlation ID

### 3. **Send Batch**
- Sends complete batch with `sendBatch()`
- Includes error handling and logging

### 4. **EventHubConsumerClient with BlobCheckpointStore**
- Creates ContainerClient for checkpoint storage
- Initializes BlobCheckpointStore
- Ensures storage container exists
- Passes checkpoint store to consumer client

### 5. **Subscribe with Full Handlers**
- **processInitialize** - Partition startup
- **processEvents** - Event processing with detailed logging
- **processError** - Error handling
- **processClose** - Shutdown handling

### 6. **Print Event Bodies and Update Checkpoints**
- Displays all event properties (body, sequence, offset, etc.)
- Prints custom properties
- Updates checkpoint after successful batch processing

### 7. **Graceful Shutdown**
- Closes subscription first (stops receiving)
- Closes consumer and producer clients
- Handles SIGINT and SIGTERM signals
- Includes cleanup in error cases

## 🚀 Usage

```bash
# Install dependencies
npm install

# Set environment variables
export EVENTHUB_CONNECTION_STRING="..."
export EVENTHUB_NAME="my-event-hub"
export STORAGE_CONNECTION_STRING="..."
export STORAGE_CONTAINER_NAME="eventhub-checkpoints"

# Run (development)
npm run dev

# Or build and run
npm run build
npm start
```

## 📚 Best Practices Applied

✅ Proper async/await patterns throughout  
✅ Connection string authentication (as requested)  
✅ Checkpoint after processing (not before)  
✅ Error handling at every level  
✅ Empty batch handling  
✅ Resource cleanup in all paths  
✅ Type safety with TypeScript  
✅ Comprehensive logging  
✅ Production-ready patterns from SDK skill

The program demonstrates a complete end-to-end workflow: sending events → storing checkpoints → receiving events → processing → updating checkpoints → graceful shutdown!

## Code Review (LLM-as-Judge)

**Score: 17/22 criteria passed**

### Criteria Results

| Criterion | Result | Reason |
|-----------|--------|--------|
| Code Builds | ✅ | Code structure is valid TypeScript with proper imports, types, and async/await patterns. No syntax errors visible. TypeScript configuration is appropriate. |
| Latest Package Versions | ✅ | Package versions (@azure/event-hubs: ^5.12.0, @azure/eventhubs-checkpointstore-blob: ^1.1.0, @azure/storage-blob: ^12.24.0) appear current as of common SDK releases. Caret ranges allow patch updates. |
| Best Practices | ❌ | Uses connection strings instead of DefaultAzureCredential/@azure/identity for authentication. Event Hubs SDK supports identity-based auth with EventHubProducerClient(fullyQualifiedNamespace, eventHubName, credential) but code uses connection string constructor. |
| Error Handling | ✅ | Includes try-catch blocks for sending/receiving operations, error handler in subscribe(), checkpoint error handling, unhandled rejection handler, and graceful shutdown logic. |
| Code Quality | ✅ | Well-structured with clear separation of concerns, comprehensive comments, descriptive variable names, proper TypeScript typing, and detailed logging throughout. |
| Correct @azure/ Scoped Packages | ✅ | All dependencies use @azure/ scoped packages: @azure/event-hubs, @azure/eventhubs-checkpointstore-blob, @azure/storage-blob. No deprecated unscoped packages. |
| @azure/identity for Authentication | ❌ | Does NOT include @azure/identity as a dependency. Uses connection strings throughout (eventHubConnectionString, storageConnectionString) instead of credential-based authentication. No DefaultAzureCredential or token credentials used. |
| Client Constructor with Endpoint and Credential | ❌ | Clients constructed with connection strings: EventHubProducerClient(connectionString, eventHubName) and EventHubConsumerClient(consumerGroup, connectionString, eventHubName, checkpointStore). Should use endpoint+credential pattern: EventHubProducerClient(fullyQualifiedNamespace, eventHubName, credential). |
| Async/Await Pattern | ✅ | Consistently uses async/await throughout. All async operations properly awaited. Main function uses async IIFE pattern with proper error handling. No .then()/.catch() chains. |
| Pagination with for-await-of | ✅ | Not applicable - Event Hubs uses push-based subscribe() pattern, not pagination. Code correctly uses subscribe() with event handlers, which is the proper pattern for Event Hubs. |
| LRO Pattern (beginXxx + pollUntilDone) | ✅ | Not applicable - Event Hubs operations (sendBatch, subscribe) are not long-running operations requiring polling. Code uses appropriate patterns for Event Hubs. |
| RestError Exception Handling | ❌ | Uses generic Error type in error handlers. Does not import or catch RestError from @azure/core-rest-pipeline for statusCode-based error handling. Error handling would benefit from RestError inspection for transient vs permanent errors. |
| No Deprecated Packages | ✅ | No deprecated packages in dependencies. Uses current @azure/* track packages. No azure-storage, azure-arm-*, ms-rest-azure, or other legacy packages. |
| Logging via @azure/logger | ❌ | Does not use @azure/logger for SDK diagnostic logging. Uses console.log/console.error only. Missing setLogLevel() or AZURE_LOG_LEVEL configuration for SDK internal diagnostics. |
| package.json with Correct Dependencies | ✅ | Valid package.json with all required @azure/* dependencies (@azure/event-hubs, @azure/eventhubs-checkpointstore-blob), includes @azure/storage-blob as transitive dependency explicitly. Includes tsconfig.json and @types/node. |
| @azure/event-hubs and @azure/eventhubs-checkpointstore-blob packages | ✅ | Both required packages present in package.json: @azure/event-hubs ^5.12.0 and @azure/eventhubs-checkpointstore-blob ^1.1.0. |
| EventHubProducerClient constructor | ✅ | EventHubProducerClient correctly instantiated: new EventHubProducerClient(eventHubConnectionString, eventHubName). Properly used for sending events. |
| createBatch() and tryAdd() | ✅ | Calls producerClient.createBatch() to create EventDataBatch, then batch.tryAdd() for each event with proper checking of return value to detect full batches. |
| sendBatch() for publishing | ✅ | Uses await producerClient.sendBatch(batch) to send the created batch. Properly awaits the async operation. |
| EventHubConsumerClient with BlobCheckpointStore | ✅ | Creates BlobCheckpointStore from ContainerClient, passes it to EventHubConsumerClient constructor: new EventHubConsumerClient(consumerGroup, connectionString, eventHubName, checkpointStore). |
| subscribe() with SubscriptionEventHandlers | ✅ | Calls consumerClient.subscribe() with handlers object containing processEvents, processError, processInitialize, and processClose. All handlers properly typed and implemented. |
| updateCheckpoint() in processEvents handler | ✅ | Calls await context.updateCheckpoint(lastEvent) after processing events in the processEvents handler. Properly checkpoints after successful processing with error handling. |
| close() for cleanup | ✅ | Implements graceful shutdown with subscription.close(), consumerClient.close(), and producerClient.close() in proper order. Signal handlers (SIGINT/SIGTERM) trigger shutdown. |

### Summary

The generated code is functionally complete and demonstrates all required Event Hubs operations correctly. It includes proper batch creation with tryAdd(), sendBatch(), EventHubConsumerClient with BlobCheckpointStore, subscribe() with full event handlers, updateCheckpoint(), and graceful shutdown. Code quality is high with excellent structure, error handling, and documentation. However, it fails 5 Azure SDK best practice criteria: (1) uses connection strings instead of @azure/identity with DefaultAzureCredential, (2) missing @azure/identity dependency, (3) doesn't use endpoint+credential constructor pattern, (4) lacks RestError-based exception handling, and (5) doesn't use @azure/logger for SDK diagnostics. The prompt specifically requested connection string-based authentication, creating a conflict with modern Azure SDK identity-based auth guidelines.

### Strengths

- Complete implementation of all Event Hubs operations requested in prompt
- Proper batch creation with createBatch() and tryAdd() with overflow checking
- Correct EventHubConsumerClient setup with BlobCheckpointStore for persistent checkpointing
- Full suite of subscription handlers (processEvents, processError, processInitialize, processClose)
- Checkpointing after successful event processing with proper error handling
- Comprehensive graceful shutdown with proper cleanup order
- Excellent code structure with clear separation of concerns and detailed comments
- Strong error handling with try-catch blocks and unhandled rejection handler
- Detailed README with setup instructions, configuration, and troubleshooting
- Valid package.json and tsconfig.json with appropriate dependencies and TypeScript settings
- No deprecated Azure SDK packages used

### Issues

- No @azure/identity dependency - uses connection strings instead of DefaultAzureCredential or token credentials
- Client constructors use connection strings instead of endpoint+credential pattern (EventHubProducerClient(fullyQualifiedNamespace, eventHubName, credential))
- Error handling uses generic Error type instead of RestError with statusCode inspection for retry logic
- No @azure/logger integration for SDK diagnostic logging (setLogLevel, AZURE_LOG_LEVEL)
- Authentication pattern conflicts with Azure SDK best practices requiring identity-based auth over connection strings

## Grader Results

| Grader | Type | Score | Summary |
|--------|------|-------|----------|
| `claude-sonnet-4.5` | review | 17/22 | The generated code is functionally complete and demonstrates all required Event … |
| 🏆 `claude-sonnet-4.5` | review | 17/22 | The generated code is functionally complete and demonstrates all required Event … |

## Re-run Command

```bash
hyoka run --prompt-id event-hubs-dp-js-ts-streaming --config azure-mcp-skills/claude-sonnet-4.5
```

---

[← Back to Summary](../../../../../../summary.md)
