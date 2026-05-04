# Evaluation Report: event-hubs-dp-js-ts-streaming

**Config:** baseline-skills/claude-sonnet-4.5 | **Result:** ✅ PASSED | **Duration:** 116.0s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `event-hubs-dp-js-ts-streaming` |
| Config | baseline-skills/claude-sonnet-4.5 |
| Result | ✅ PASSED |
| Duration | 116.0s |
| Timestamp | 2026-05-01T23:09:21Z |
| Files Generated | 4 |
| Event Count | 73 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 64.1s |
| Review | 51.8s |
| **Total** | **116.0s** |

## Configuration

- **model:** claude-sonnet-4.5
- **name:** baseline-skills/claude-sonnet-4.5

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-sonnet-4.5 |
| Skill Directories | C:\code\hyoka\skills\generator\js-ts-azure-patterns |
| Skills Loaded | customize-cloud-agent |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=55133 out=4588 |
| Turn Count | 3 |

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

The user is asking me to write a TypeScript program that demonstrates Azure Event Hubs functionality. This is a perfect use case for the Azure SDK skills I have available.

Before writing any code, I should:
1. Invoke the relevant skill to get SDK-specific patterns and guidance
2. Read the skill's reference files (acceptance-criteria.md, examples.md)
3. Then write the TypeScript program following the patterns

Let me start by invoking the Azure SDK skill.

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Consulting Azure SDK skill"}
```

### 🔧 2. skill

**Input:**

```json
{"skill":"azure-sdk"}
```

### 🔧 3. report_intent

**Input:**

```json
{"intent":"Creating Event Hubs demo"}
```

### 🔧 4. create

**Input:**

```json
{"file_text":"import { \n  EventHubProducerClient, \n  EventHubConsumerClient, \n  SubscriptionEventHandlers,\n  Subscription\n} from \"@azure/event-hubs\";\nimport { BlobCheckpointStore } from \"@azure/eventhubs-checkpointstore-blob\";\nimport { ContainerClient } from \"@azure/storage-blob\";\n\n// Configuration - replace with your actual values\nconst eventHubConnectionString = process.env.EVENT_HUB_CONNECTION_STRING || \"\";\nconst eventHubName = process.env.EVENT_HUB_NAME || \"\";\nconst storageConnectionString = process.env.STORAGE_CONNECTION_STRING || \"\";\nconst containerName = process.env.STORAGE_CONTAINER_NAME || \"eventhubs-checkpoints\";\nconst consumerGroup = process.env.CONSUMER_GROUP || \"$Default\";\n\nasync function sendEvents(): Promise\u003cvoid\u003e {\n  console.log(\"=== Sending Events ===\");\n  \n  // 1. Create an EventHubProducerClient using a connection string\n  const producer = new EventHubProducerClient(\n    eventHubConnectionString,\n    eventHubName\n  );\n\n  try {\n    // 2. Create a batch with createBatch() and add 10 events with custom properties\n    const batch = await producer.createBatch();\n    \n    for (let i = 1; i \u003c= 10; i++) {\n      const eventData = {\n        body: `Event message ${i}`,\n        properties: {\n          eventNumber: i,\n          timestamp: new Date().toISOString(),\n          source: \"demo-app\",\n          priority: i % 3 === 0 ? \"high\" : \"normal\"\n        }\n      };\n\n      const wasAdded = batch.tryAdd(eventData);\n      \n      if (!wasAdded) {\n        console.log(`Event ${i} could not be added to the batch (batch full)`);\n        break;\n      }\n      \n      console.log(`Added event ${i} to batch`);\n    }\n\n    // 3. Send the batch using sendBatch()\n    console.log(`\\nSending batch of ${batch.count} events...`);\n    await producer.sendBatch(batch);\n    console.log(`Successfully sent ${batch.count} events\\n`);\n    \n  } catch (error) {\n    console.error(\"Error sending events:\", error);\n    throw error;\n  } finally {\n    // 7. Implement graceful shutdown with close()\n    await producer.close();\n    console.log(\"Producer closed\");\n  }\n}\n\nasync function receiveEvents(): Promise\u003cvoid\u003e {\n  console.log(\"\\n=== Receiving Events ===\");\n  \n  // 4. Create an EventHubConsumerClient with a BlobCheckpointStore\n  const containerClient = new ContainerClient(\n    storageConnectionString,\n    containerName\n  );\n  \n  // Create the container if it doesn't exist\n  await containerClient.createIfNotExists();\n  \n  const checkpointStore = new BlobCheckpointStore(containerClient);\n  \n  const consumer = new EventHubConsumerClient(\n    consumerGroup,\n    eventHubConnectionString,\n    eventHubName,\n    checkpointStore\n  );\n\n  let subscription: Subscription | undefined;\n  let receivedCount = 0;\n  const maxEventsToReceive = 10;\n\n  try {\n    // 5. Subscribe to events using subscribe() with processEvents and processError handlers\n    const handlers: SubscriptionEventHandlers = {\n      // 6. Print received event bodies and update checkpoints\n      processEvents: async (events, context) =\u003e {\n        if (events.length === 0) {\n          console.log(\"No events received in this batch\");\n          return;\n        }\n\n        console.log(`\\nReceived ${events.length} events from partition: ${context.partitionId}`);\n        \n        for (const event of events) {\n          receivedCount++;\n          \n          // Print received event bodies\n          console.log(`\\n--- Event ${receivedCount} ---`);\n          console.log(`Body: ${event.body}`);\n          console.log(`Properties:`, event.properties);\n          console.log(`Sequence Number: ${event.sequenceNumber}`);\n          console.log(`Offset: ${event.offset}`);\n          console.log(`Enqueued Time: ${event.enqueuedTimeUtc}`);\n          \n          // Update checkpoint after processing each event\n          await context.updateCheckpoint(event);\n          console.log(`Checkpoint updated for partition ${context.partitionId}`);\n        }\n\n        // Stop after receiving the target number of events\n        if (receivedCount \u003e= maxEventsToReceive) {\n          console.log(`\\nReceived ${receivedCount} events, stopping subscription...`);\n          await subscription?.close();\n        }\n      },\n\n      processError: async (error, context) =\u003e {\n        console.error(`Error in partition ${context.partitionId}:`, error);\n      }\n    };\n\n    // Subscribe to all partitions\n    subscription = consumer.subscribe(handlers, {\n      startPosition: { enqueuedOn: new Date() } // Start from now\n    });\n\n    console.log(\"Subscription started. Waiting for events...\");\n    console.log(\"(Will process up to 10 events)\\n\");\n\n    // Wait for events to be processed (with timeout)\n    const maxWaitTime = 60000; // 60 seconds\n    const startTime = Date.now();\n    \n    while (!subscription.isClosed \u0026\u0026 (Date.now() - startTime) \u003c maxWaitTime) {\n      await new Promise(resolve =\u003e setTimeout(resolve, 1000));\n      \n      if (receivedCount \u003e= maxEventsToReceive) {\n        break;\n      }\n    }\n\n    if (receivedCount === 0) {\n      console.log(\"\\nNo events received within the timeout period.\");\n      console.log(\"This is normal if no events were sent recently.\");\n    }\n\n  } catch (error) {\n    console.error(\"Error receiving events:\", error);\n    throw error;\n  } finally {\n    // 7. Implement graceful shutdown with close()\n    if (subscription \u0026\u0026 !subscription.isClosed) {\n      await subscription.close();\n      console.log(\"\\nSubscription closed\");\n    }\n    \n    await consumer.close();\n    console.log(\"Consumer closed\");\n  }\n}\n\nasync function main(): Promise\u003cvoid\u003e {\n  console.log(\"Azure Event Hubs Demo - TypeScript\\n\");\n  \n  // Validate environment variables\n  if (!eventHubConnectionString || !eventHubName || !storageConnectionString) {\n    console.error(\"ERROR: Missing required environment variables:\");\n    console.error(\"- EVENT_HUB_CONNECTION_STRING\");\n    console.error(\"- EVENT_HUB_NAME\");\n    console.error(\"- STORAGE_CONNECTION_STRING\");\n    console.error(\"- STORAGE_CONTAINER_NAME (optional, defaults to 'eventhubs-checkpoints')\");\n    console.error(\"- CONSUMER_GROUP (optional, defaults to '$Default')\");\n    process.exit(1);\n  }\n\n  try {\n    // Send events first\n    await sendEvents();\n    \n    // Wait a moment for events to be available\n    console.log(\"\\nWaiting 5 seconds before starting consumer...\");\n    await new Promise(resolve =\u003e setTimeout(resolve, 5000));\n    \n    // Then receive events\n    await receiveEvents();\n    \n    console.log(\"\\n=== Demo completed successfully ===\");\n  } catch (error) {\n    console.error(\"\\nDemo failed with error:\", error);\n    process.exit(1);\n  }\n}\n\n// Run the demo\nmain().catch((error) =\u003e {\n  console.error(\"Unhandled error:\", error);\n  process.exit(1);\n});\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-baseline-skills-claude-sonnet-4.5-2045460673\\event-hubs-demo.ts"}
```

### 🔧 5. create

**Input:**

```json
{"file_text":"{\n  \"name\": \"event-hubs-demo\",\n  \"version\": \"1.0.0\",\n  \"description\": \"Azure Event Hubs TypeScript demo with producer and consumer\",\n  \"main\": \"event-hubs-demo.ts\",\n  \"scripts\": {\n    \"build\": \"tsc\",\n    \"start\": \"node dist/event-hubs-demo.js\",\n    \"dev\": \"ts-node event-hubs-demo.ts\"\n  },\n  \"dependencies\": {\n    \"@azure/event-hubs\": \"^5.12.0\",\n    \"@azure/eventhubs-checkpointstore-blob\": \"^1.1.0\",\n    \"@azure/storage-blob\": \"^12.24.0\"\n  },\n  \"devDependencies\": {\n    \"@types/node\": \"^20.14.0\",\n    \"typescript\": \"^5.5.0\",\n    \"ts-node\": \"^10.9.2\"\n  }\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-baseline-skills-claude-sonnet-4.5-2045460673\\package.json"}
```

### 🔧 6. create

**Input:**

```json
{"file_text":"{\n  \"compilerOptions\": {\n    \"target\": \"ES2020\",\n    \"module\": \"commonjs\",\n    \"lib\": [\"ES2020\"],\n    \"outDir\": \"./dist\",\n    \"rootDir\": \"./\",\n    \"strict\": true,\n    \"esModuleInterop\": true,\n    \"skipLibCheck\": true,\n    \"forceConsistentCasingInFileNames\": true,\n    \"moduleResolution\": \"node\",\n    \"resolveJsonModule\": true\n  },\n  \"include\": [\"*.ts\"],\n  \"exclude\": [\"node_modules\", \"dist\"]\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-baseline-skills-claude-sonnet-4.5-2045460673\\tsconfig.json"}
```

### 🔧 7. create

**Input:**

```json
{"file_text":"# Azure Event Hubs Configuration\nEVENT_HUB_CONNECTION_STRING=Endpoint=sb://YOUR_NAMESPACE.servicebus.windows.net/;SharedAccessKeyName=YOUR_KEY_NAME;SharedAccessKey=YOUR_KEY\nEVENT_HUB_NAME=your-eventhub-name\n\n# Azure Storage Account Configuration (for checkpointing)\nSTORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=YOUR_STORAGE_ACCOUNT;AccountKey=YOUR_KEY;EndpointSuffix=core.windows.net\nSTORAGE_CONTAINER_NAME=eventhubs-checkpoints\n\n# Consumer Group (optional)\nCONSUMER_GROUP=$Default\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-baseline-skills-claude-sonnet-4.5-2045460673\\.env.example"}
```

### 🔧 8. create

**Input:**

```json
{"file_text":"# Azure Event Hubs TypeScript Demo\n\nThis demo shows how to send and receive events with Azure Event Hubs using TypeScript.\n\n## Features\n\n1. **EventHubProducerClient** - Send events to Event Hubs\n2. **Batch Processing** - Create and send batches of events with custom properties\n3. **EventHubConsumerClient** - Receive events from Event Hubs\n4. **Checkpoint Store** - Use BlobCheckpointStore for reliable event processing\n5. **Event Handlers** - Process events and handle errors\n6. **Graceful Shutdown** - Properly close connections\n\n## Prerequisites\n\n- Node.js 14+ and npm\n- Azure subscription\n- Azure Event Hubs namespace and Event Hub\n- Azure Storage Account (for checkpointing)\n\n## Required npm Packages\n\n```bash\nnpm install\n```\n\nThis installs:\n- `@azure/event-hubs` - Azure Event Hubs client library\n- `@azure/eventhubs-checkpointstore-blob` - Blob storage checkpoint store\n- `@azure/storage-blob` - Azure Blob Storage client\n\n## Setup\n\n1. Copy `.env.example` to `.env`:\n   ```bash\n   cp .env.example .env\n   ```\n\n2. Fill in your Azure credentials in `.env`:\n   - `EVENT_HUB_CONNECTION_STRING` - Your Event Hubs connection string\n   - `EVENT_HUB_NAME` - Name of your Event Hub\n   - `STORAGE_CONNECTION_STRING` - Storage account connection string\n   - `STORAGE_CONTAINER_NAME` - Container for checkpoints (default: eventhubs-checkpoints)\n   - `CONSUMER_GROUP` - Consumer group name (default: $Default)\n\n## Running the Demo\n\n### Using ts-node (development):\n```bash\nnpm run dev\n```\n\n### Using compiled JavaScript:\n```bash\nnpm run build\nnpm start\n```\n\n## What the Demo Does\n\n1. **Sends 10 events** with custom properties:\n   - Event number\n   - Timestamp\n   - Source application\n   - Priority level\n\n2. **Creates a consumer** with blob checkpoint store\n\n3. **Subscribes to events** with handlers for:\n   - Processing events (prints body, properties, metadata)\n   - Error handling\n   - Checkpoint updates\n\n4. **Gracefully shuts down** all connections\n\n## Key Concepts\n\n### Producer Pattern\n```typescript\nconst producer = new EventHubProducerClient(connectionString, eventHubName);\nconst batch = await producer.createBatch();\nbatch.tryAdd(eventData);\nawait producer.sendBatch(batch);\nawait producer.close();\n```\n\n### Consumer Pattern with Checkpointing\n```typescript\nconst checkpointStore = new BlobCheckpointStore(containerClient);\nconst consumer = new EventHubConsumerClient(\n  consumerGroup, \n  connectionString, \n  eventHubName, \n  checkpointStore\n);\n\nconst subscription = consumer.subscribe({\n  processEvents: async (events, context) =\u003e {\n    for (const event of events) {\n      // Process event\n      await context.updateCheckpoint(event);\n    }\n  },\n  processError: async (error, context) =\u003e {\n    console.error(error);\n  }\n});\n\nawait subscription.close();\nawait consumer.close();\n```\n\n## Output Example\n\n```\n=== Sending Events ===\nAdded event 1 to batch\nAdded event 2 to batch\n...\nSuccessfully sent 10 events\n\n=== Receiving Events ===\nSubscription started. Waiting for events...\n\nReceived 1 events from partition: 0\n\n--- Event 1 ---\nBody: Event message 1\nProperties: { eventNumber: 1, timestamp: '2026-05-01T...' }\nCheckpoint updated for partition 0\n...\n```\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-baseline-skills-claude-sonnet-4.5-2045460673\\README.md"}
```

## Generated Files

- `README.md`
- `event-hubs-demo.ts`
- `package.json`
- `tsconfig.json`

## Copilot Response

I'll help you create a TypeScript program for Azure Event Hubs. Let me first consult the Azure SDK skill to ensure I follow the latest patterns and best practices.

I'll create a comprehensive TypeScript program demonstrating Azure Event Hubs with proper patterns and best practices.

Perfect! I've created a complete TypeScript program demonstrating Azure Event Hubs. Here's what I've included:

## 📦 Files Created

1. **event-hubs-demo.ts** - Main program with all requested features
2. **package.json** - Dependencies and scripts
3. **tsconfig.json** - TypeScript configuration
4. **.env.example** - Configuration template
5. **README.md** - Complete documentation

## ✨ Key Features Implemented

✅ **EventHubProducerClient** with connection string  
✅ **Batch creation** with `createBatch()` and 10 events with custom properties  
✅ **Batch sending** with `sendBatch()`  
✅ **EventHubConsumerClient** with BlobCheckpointStore  
✅ **Event subscription** with processEvents and processError handlers  
✅ **Event body printing** and checkpoint updates  
✅ **Graceful shutdown** with `close()` on all clients  

## 🚀 Quick Start

```bash
npm install
cp .env.example .env
# Edit .env with your Azure credentials
npm run dev
```

## 💡 Highlights

- **Proper async/await patterns** throughout
- **Error handling** with try/catch and error handlers
- **Custom properties** on each event (number, timestamp, source, priority)
- **Checkpoint updates** after processing each event
- **Automatic container creation** for checkpoint store
- **Configurable timeout** and event limits
- **Environment variable validation**

The program sends 10 events with custom properties, then receives and processes them with full checkpoint management!

## Re-run Command

```bash
hyoka run --prompt-id event-hubs-dp-js-ts-streaming --config baseline-skills/claude-sonnet-4.5
```

---

[← Back to Summary](../../../../../../summary.md)
