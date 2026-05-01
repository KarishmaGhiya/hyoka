# Evaluation Report: event-hubs-dp-js-ts-streaming

**Config:** azure-mcp/claude-sonnet-4.5 | **Result:** ❌ FAILED | **Duration:** 86.7s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `event-hubs-dp-js-ts-streaming` |
| Config | azure-mcp/claude-sonnet-4.5 |
| Result | ❌ FAILED |
| Duration | 86.7s |
| Timestamp | 2026-04-30T23:24:13Z |
| Files Generated | 0 |
| Event Count | 65 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 86.6s |
| **Total** | **86.7s** |

## Configuration

- **name:** azure-mcp/claude-sonnet-4.5
- **model:** claude-sonnet-4.5

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-sonnet-4.5 |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=80730 out=6855 |
| Turn Count | 2 |

## Error

```
0 files generated despite 5 file-write tool attempts
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

The user wants a TypeScript program that demonstrates Azure Event Hubs functionality with:
1. EventHubProducerClient with connection string
2. Create batch and add 10 events with custom properties
3. Send the batch
4. EventHubConsumerClient with BlobCheckpointStore
5. Subscribe to events with handlers
6. Print events and update checkpoints
7. Graceful shutdown

This is a straightforward request to create a complete example. I should:
1. Create a TypeScript file with the complete implementation
2. Show the required npm packages
3. Include proper error handling and async/await patterns
4. Add comments to explain the code

Let me create a comprehensive example that shows both producer and consumer patterns.

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Creating Event Hubs demo"}
```

### 🔧 2. create

**Input:**

```json
{"file_text":"import {\n  EventHubProducerClient,\n  EventHubConsumerClient,\n  EventData,\n  ReceivedEventData,\n  Subscription,\n} from \"@azure/event-hubs\";\nimport { ContainerClient } from \"@azure/storage-blob\";\nimport { BlobCheckpointStore } from \"@azure/eventhubs-checkpointstore-blob\";\n\n// Configuration - Replace with your actual values\nconst EVENT_HUB_CONNECTION_STRING = process.env.EVENT_HUB_CONNECTION_STRING || \"\";\nconst EVENT_HUB_NAME = process.env.EVENT_HUB_NAME || \"\";\nconst STORAGE_CONNECTION_STRING = process.env.STORAGE_CONNECTION_STRING || \"\";\nconst STORAGE_CONTAINER_NAME = process.env.STORAGE_CONTAINER_NAME || \"eventhub-checkpoints\";\nconst CONSUMER_GROUP = process.env.CONSUMER_GROUP || \"$Default\";\n\n// Global subscription reference for cleanup\nlet subscription: Subscription | null = null;\n\n/**\n * Producer: Creates a batch and sends 10 events with custom properties\n */\nasync function produceEvents(): Promise\u003cvoid\u003e {\n  console.log(\"\\n=== PRODUCER: Starting to send events ===\");\n\n  // Create producer client\n  const producer = new EventHubProducerClient(\n    EVENT_HUB_CONNECTION_STRING,\n    EVENT_HUB_NAME\n  );\n\n  try {\n    // Create a batch - this ensures events don't exceed size limits\n    const batch = await producer.createBatch();\n    console.log(`Created batch with max size: ${batch.maxSizeInBytes} bytes`);\n\n    // Add 10 events with custom properties\n    for (let i = 1; i \u003c= 10; i++) {\n      const eventData: EventData = {\n        body: {\n          message: `Event message ${i}`,\n          timestamp: new Date().toISOString(),\n          sequenceNumber: i,\n        },\n        properties: {\n          eventType: \"demo\",\n          priority: i % 2 === 0 ? \"high\" : \"normal\",\n          source: \"typescript-demo\",\n        },\n      };\n\n      const isAdded = batch.tryAdd(eventData);\n      if (!isAdded) {\n        throw new Error(`Event ${i} could not be added to batch - batch is full`);\n      }\n      console.log(`Added event ${i} to batch`);\n    }\n\n    // Send the batch\n    console.log(`\\nSending batch with ${batch.count} events...`);\n    await producer.sendBatch(batch);\n    console.log(\"✓ Batch sent successfully!\");\n  } catch (error) {\n    console.error(\"Error in producer:\", error);\n    throw error;\n  } finally {\n    // Clean up\n    await producer.close();\n    console.log(\"Producer client closed\");\n  }\n}\n\n/**\n * Consumer: Subscribes to events using BlobCheckpointStore for state management\n */\nasync function consumeEvents(): Promise\u003cvoid\u003e {\n  console.log(\"\\n=== CONSUMER: Starting to receive events ===\");\n\n  // Create container client for checkpoint store\n  const containerClient = new ContainerClient(\n    STORAGE_CONNECTION_STRING,\n    STORAGE_CONTAINER_NAME\n  );\n\n  // Create container if it doesn't exist\n  await containerClient.createIfNotExists();\n  console.log(`Checkpoint container '${STORAGE_CONTAINER_NAME}' ready`);\n\n  // Create checkpoint store\n  const checkpointStore = new BlobCheckpointStore(containerClient);\n\n  // Create consumer client\n  const consumer = new EventHubConsumerClient(\n    CONSUMER_GROUP,\n    EVENT_HUB_CONNECTION_STRING,\n    EVENT_HUB_NAME,\n    checkpointStore\n  );\n\n  console.log(`Subscribing to consumer group: ${CONSUMER_GROUP}`);\n  console.log(\"Waiting for events... (Press Ctrl+C to exit)\\n\");\n\n  // Subscribe to events\n  subscription = consumer.subscribe({\n    /**\n     * Process incoming events\n     */\n    processEvents: async (\n      events: ReceivedEventData[],\n      context\n    ): Promise\u003cvoid\u003e =\u003e {\n      if (events.length === 0) {\n        console.log(`No events received from partition: ${context.partitionId}`);\n        return;\n      }\n\n      console.log(\n        `\\n--- Received ${events.length} event(s) from partition: ${context.partitionId} ---`\n      );\n\n      for (const event of events) {\n        console.log(\"\\nEvent Details:\");\n        console.log(\"  Body:\", JSON.stringify(event.body, null, 2));\n        console.log(\"  Properties:\", event.properties);\n        console.log(\"  System Properties:\");\n        console.log(\"    - Sequence Number:\", event.sequenceNumber);\n        console.log(\"    - Offset:\", event.offset);\n        console.log(\"    - Enqueued Time:\", event.enqueuedTimeUtc);\n        console.log(\"    - Partition Key:\", event.partitionKey || \"none\");\n\n        // Update checkpoint after processing each event\n        // In production, you might checkpoint after a batch or time interval\n        await context.updateCheckpoint(event);\n        console.log(\"  ✓ Checkpoint updated\");\n      }\n    },\n\n    /**\n     * Handle errors during event processing\n     */\n    processError: async (error, context): Promise\u003cvoid\u003e =\u003e {\n      console.error(\"\\n!!! ERROR in event processing !!!\");\n      console.error(\"  Partition ID:\", context.partitionId);\n      console.error(\"  Error:\", error.message);\n      console.error(\"  Full Error:\", error);\n    },\n  });\n\n  console.log(\"Subscription active - listening for events...\");\n}\n\n/**\n * Graceful shutdown handler\n */\nasync function shutdown(): Promise\u003cvoid\u003e {\n  console.log(\"\\n\\n=== SHUTTING DOWN ===\");\n\n  if (subscription) {\n    console.log(\"Closing subscription...\");\n    try {\n      await subscription.close();\n      console.log(\"✓ Subscription closed\");\n    } catch (error) {\n      console.error(\"Error closing subscription:\", error);\n    }\n  }\n\n  console.log(\"Shutdown complete\");\n  process.exit(0);\n}\n\n/**\n * Main execution flow\n */\nasync function main(): Promise\u003cvoid\u003e {\n  // Validate configuration\n  if (!EVENT_HUB_CONNECTION_STRING || !EVENT_HUB_NAME) {\n    console.error(\"ERROR: Missing Event Hub configuration!\");\n    console.error(\"Please set the following environment variables:\");\n    console.error(\"  - EVENT_HUB_CONNECTION_STRING\");\n    console.error(\"  - EVENT_HUB_NAME\");\n    console.error(\"  - STORAGE_CONNECTION_STRING\");\n    console.error(\"  - STORAGE_CONTAINER_NAME (optional, default: eventhub-checkpoints)\");\n    console.error(\"  - CONSUMER_GROUP (optional, default: $Default)\");\n    process.exit(1);\n  }\n\n  if (!STORAGE_CONNECTION_STRING) {\n    console.error(\"ERROR: Missing Storage Account configuration!\");\n    console.error(\"Please set STORAGE_CONNECTION_STRING environment variable\");\n    process.exit(1);\n  }\n\n  // Setup graceful shutdown handlers\n  process.on(\"SIGINT\", shutdown);\n  process.on(\"SIGTERM\", shutdown);\n\n  try {\n    // Step 1: Send events\n    await produceEvents();\n\n    // Wait a moment for events to be available\n    console.log(\"\\nWaiting 2 seconds before consuming...\");\n    await new Promise((resolve) =\u003e setTimeout(resolve, 2000));\n\n    // Step 2: Consume events\n    await consumeEvents();\n\n    // Keep the process alive to receive events\n    // In production, this would run indefinitely or until shutdown signal\n  } catch (error) {\n    console.error(\"\\n!!! FATAL ERROR !!!\");\n    console.error(error);\n    await shutdown();\n    process.exit(1);\n  }\n}\n\n// Run the program\nmain().catch(async (error) =\u003e {\n  console.error(\"Unhandled error in main:\", error);\n  await shutdown();\n  process.exit(1);\n});\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-azure-mcp-claude-sonnet-4.5-170316269\\event-hubs-demo.ts"}
```

### 🔧 3. create

**Input:**

```json
{"file_text":"{\n  \"name\": \"azure-event-hubs-demo\",\n  \"version\": \"1.0.0\",\n  \"description\": \"TypeScript demo for Azure Event Hubs producer and consumer\",\n  \"main\": \"event-hubs-demo.ts\",\n  \"scripts\": {\n    \"start\": \"ts-node event-hubs-demo.ts\",\n    \"build\": \"tsc\",\n    \"start:prod\": \"node dist/event-hubs-demo.js\"\n  },\n  \"keywords\": [\n    \"azure\",\n    \"event-hubs\",\n    \"streaming\",\n    \"typescript\"\n  ],\n  \"author\": \"\",\n  \"license\": \"MIT\",\n  \"dependencies\": {\n    \"@azure/event-hubs\": \"^5.12.0\",\n    \"@azure/eventhubs-checkpointstore-blob\": \"^1.1.0\",\n    \"@azure/storage-blob\": \"^12.18.0\"\n  },\n  \"devDependencies\": {\n    \"@types/node\": \"^20.11.0\",\n    \"typescript\": \"^5.3.3\",\n    \"ts-node\": \"^10.9.2\"\n  }\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-azure-mcp-claude-sonnet-4.5-170316269\\package.json"}
```

### 🔧 4. create

**Input:**

```json
{"file_text":"{\n  \"compilerOptions\": {\n    \"target\": \"ES2020\",\n    \"module\": \"commonjs\",\n    \"lib\": [\"ES2020\"],\n    \"outDir\": \"./dist\",\n    \"rootDir\": \"./\",\n    \"strict\": true,\n    \"esModuleInterop\": true,\n    \"skipLibCheck\": true,\n    \"forceConsistentCasingInFileNames\": true,\n    \"resolveJsonModule\": true,\n    \"moduleResolution\": \"node\"\n  },\n  \"include\": [\"*.ts\"],\n  \"exclude\": [\"node_modules\", \"dist\"]\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-azure-mcp-claude-sonnet-4.5-170316269\\tsconfig.json"}
```

### 🔧 5. create

**Input:**

```json
{"file_text":"# Azure Event Hubs TypeScript Demo\n\nA comprehensive TypeScript demonstration of Azure Event Hubs producer and consumer patterns with checkpoint management.\n\n## Features\n\n✅ **Producer Pattern**\n- EventHubProducerClient with connection string\n- Batch creation with `createBatch()`\n- 10 events with custom properties\n- Batch sending with `sendBatch()`\n\n✅ **Consumer Pattern**\n- EventHubConsumerClient with BlobCheckpointStore\n- Subscribe with `processEvents` and `processError` handlers\n- Event body printing and metadata display\n- Checkpoint updates after processing\n- Graceful shutdown with `close()`\n\n## Required Packages\n\n```json\n{\n  \"@azure/event-hubs\": \"^5.12.0\",\n  \"@azure/eventhubs-checkpointstore-blob\": \"^1.1.0\",\n  \"@azure/storage-blob\": \"^12.18.0\"\n}\n```\n\n## Prerequisites\n\n1. **Azure Event Hub**: Create an Event Hub namespace and Event Hub\n2. **Azure Storage Account**: For checkpoint store (blob container)\n3. **Node.js**: Version 16 or higher\n4. **TypeScript**: For development\n\n## Installation\n\n```bash\n# Install dependencies\nnpm install\n\n# Or with yarn\nyarn install\n```\n\n## Configuration\n\nSet the following environment variables:\n\n```bash\n# Required\nexport EVENT_HUB_CONNECTION_STRING=\"Endpoint=sb://...;SharedAccessKeyName=...;SharedAccessKey=...\"\nexport EVENT_HUB_NAME=\"your-eventhub-name\"\nexport STORAGE_CONNECTION_STRING=\"DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net\"\n\n# Optional\nexport STORAGE_CONTAINER_NAME=\"eventhub-checkpoints\"  # default: eventhub-checkpoints\nexport CONSUMER_GROUP=\"$Default\"                       # default: $Default\n```\n\n### Windows (PowerShell)\n\n```powershell\n$env:EVENT_HUB_CONNECTION_STRING=\"Endpoint=sb://...;SharedAccessKeyName=...;SharedAccessKey=...\"\n$env:EVENT_HUB_NAME=\"your-eventhub-name\"\n$env:STORAGE_CONNECTION_STRING=\"DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net\"\n```\n\n### Finding Connection Strings\n\n**Event Hub Connection String:**\n1. Go to Azure Portal → Event Hubs Namespace\n2. Select \"Shared access policies\" → \"RootManageSharedAccessKey\"\n3. Copy \"Connection string–primary key\"\n\n**Storage Connection String:**\n1. Go to Azure Portal → Storage Account\n2. Select \"Access keys\"\n3. Copy \"Connection string\" from key1 or key2\n\n## Running the Demo\n\n```bash\n# Run with ts-node (development)\nnpm start\n\n# Or compile and run\nnpm run build\nnpm run start:prod\n```\n\n## How It Works\n\n### 1. Producer (Send Events)\n```typescript\nconst producer = new EventHubProducerClient(connectionString, eventHubName);\nconst batch = await producer.createBatch();\n\n// Add events with custom properties\nbatch.tryAdd({\n  body: { message: \"Hello\", timestamp: new Date() },\n  properties: { eventType: \"demo\", priority: \"high\" }\n});\n\nawait producer.sendBatch(batch);\n```\n\n### 2. Consumer (Receive Events)\n```typescript\nconst checkpointStore = new BlobCheckpointStore(containerClient);\nconst consumer = new EventHubConsumerClient(\n  consumerGroup,\n  connectionString,\n  eventHubName,\n  checkpointStore\n);\n\nconsumer.subscribe({\n  processEvents: async (events, context) =\u003e {\n    for (const event of events) {\n      console.log(event.body);\n      await context.updateCheckpoint(event);\n    }\n  },\n  processError: async (error, context) =\u003e {\n    console.error(\"Error:\", error);\n  }\n});\n```\n\n### 3. Graceful Shutdown\n- Handles SIGINT (Ctrl+C) and SIGTERM\n- Closes subscription properly\n- Ensures all resources are cleaned up\n\n## Output Example\n\n```\n=== PRODUCER: Starting to send events ===\nCreated batch with max size: 1048576 bytes\nAdded event 1 to batch\nAdded event 2 to batch\n...\n✓ Batch sent successfully!\n\n=== CONSUMER: Starting to receive events ===\nCheckpoint container 'eventhub-checkpoints' ready\nSubscribing to consumer group: $Default\nWaiting for events...\n\n--- Received 10 event(s) from partition: 0 ---\n\nEvent Details:\n  Body: {\n    \"message\": \"Event message 1\",\n    \"timestamp\": \"2026-04-30T23:24:20.123Z\",\n    \"sequenceNumber\": 1\n  }\n  Properties: { eventType: 'demo', priority: 'normal', source: 'typescript-demo' }\n  System Properties:\n    - Sequence Number: 12345\n    - Offset: 67890\n    - Enqueued Time: 2026-04-30T23:24:20.456Z\n  ✓ Checkpoint updated\n...\n```\n\n## Best Practices Demonstrated\n\n1. **Error Handling**: Try-catch blocks and processError handler\n2. **Resource Cleanup**: Proper close() calls in finally blocks\n3. **Checkpointing**: UpdateCheckpoint after processing events\n4. **Batch Operations**: Using createBatch() for efficient sending\n5. **Graceful Shutdown**: Signal handlers for clean termination\n6. **Type Safety**: Full TypeScript type definitions\n7. **Configuration**: Environment variables for secrets\n8. **Async/Await**: Modern async patterns throughout\n\n## Troubleshooting\n\n**\"Missing Event Hub configuration\"**\n- Ensure all environment variables are set correctly\n\n**\"Unauthorized access\"**\n- Verify connection strings have correct permissions\n- Event Hub needs Send/Listen permissions\n- Storage Account needs Read/Write/List permissions\n\n**\"Container not found\"**\n- The code creates the container automatically\n- Ensure storage connection string is valid\n\n**Events not appearing**\n- Check Event Hub is receiving events in Azure Portal\n- Verify consumer group name matches\n- Events may be in different partitions\n\n## Learn More\n\n- [Azure Event Hubs Documentation](https://docs.microsoft.com/azure/event-hubs/)\n- [Event Hubs Node.js SDK](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/eventhub/event-hubs)\n- [Checkpoint Store Documentation](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/eventhub/eventhubs-checkpointstore-blob)\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-azure-mcp-claude-sonnet-4.5-170316269\\README.md"}
```

### 🔧 6. create

**Input:**

```json
{"file_text":"# Azure Event Hub Configuration\nEVENT_HUB_CONNECTION_STRING=Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=your-key\nEVENT_HUB_NAME=your-eventhub-name\n\n# Azure Storage Account (for checkpoints)\nSTORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=your-storage-account;AccountKey=your-key;EndpointSuffix=core.windows.net\n\n# Optional Configuration\nSTORAGE_CONTAINER_NAME=eventhub-checkpoints\nCONSUMER_GROUP=$Default\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-azure-mcp-claude-sonnet-4.5-170316269\\.env.example"}
```

## Copilot Response

I'll create a comprehensive TypeScript program demonstrating Azure Event Hubs producer and consumer patterns with proper error handling and graceful shutdown.

I encountered permission errors when trying to create files in that directory. Let me provide you with the complete code that you can save manually:

## **Main Program: event-hubs-demo.ts**

```typescript
import {
  EventHubProducerClient,
  EventHubConsumerClient,
  EventData,
  ReceivedEventData,
  Subscription,
} from "@azure/event-hubs";
import { ContainerClient } from "@azure/storage-blob";
import { BlobCheckpointStore } from "@azure/eventhubs-checkpointstore-blob";

// Configuration - Replace with your actual values
const EVENT_HUB_CONNECTION_STRING = process.env.EVENT_HUB_CONNECTION_STRING || "";
const EVENT_HUB_NAME = process.env.EVENT_HUB_NAME || "";
const STORAGE_CONNECTION_STRING = process.env.STORAGE_CONNECTION_STRING || "";
const STORAGE_CONTAINER_NAME = process.env.STORAGE_CONTAINER_NAME || "eventhub-checkpoints";
const CONSUMER_GROUP = process.env.CONSUMER_GROUP || "$Default";

let subscription: Subscription | null = null;

async function produceEvents(): Promise<void> {
  console.log("\n=== PRODUCER: Starting to send events ===");

  const producer = new EventHubProducerClient(
    EVENT_HUB_CONNECTION_STRING,
    EVENT_HUB_NAME
  );

  try {
    const batch = await producer.createBatch();
    console.log(`Created batch with max size: ${batch.maxSizeInBytes} bytes`);

    // Add 10 events with custom properties
    for (let i = 1; i <= 10; i++) {
      const eventData: EventData = {
        body: {
          message: `Event message ${i}`,
          timestamp: new Date().toISOString(),
          sequenceNumber: i,
        },
        properties: {
          eventType: "demo",
          priority: i % 2 === 0 ? "high" : "normal",
          source: "typescript-demo",
        },
      };

      const isAdded = batch.tryAdd(eventData);
      if (!isAdded) {
        throw new Error(`Event ${i} could not be added to batch`);
      }
      console.log(`Added event ${i} to batch`);
    }

    console.log(`\nSending batch with ${batch.count} events...`);
    await producer.sendBatch(batch);
    console.log("✓ Batch sent successfully!");
  } finally {
    await producer.close();
    console.log("Producer client closed");
  }
}

async function consumeEvents(): Promise<void> {
  console.log("\n=== CONSUMER: Starting to receive events ===");

  const containerClient = new ContainerClient(
    STORAGE_CONNECTION_STRING,
    STORAGE_CONTAINER_NAME
  );

  await containerClient.createIfNotExists();
  console.log(`Checkpoint container '${STORAGE_CONTAINER_NAME}' ready`);

  const checkpointStore = new BlobCheckpointStore(containerClient);
  const consumer = new EventHubConsumerClient(
    CONSUMER_GROUP,
    EVENT_HUB_CONNECTION_STRING,
    EVENT_HUB_NAME,
    checkpointStore
  );

  console.log(`Subscribing to consumer group: ${CONSUMER_GROUP}`);
  console.log("Waiting for events... (Press Ctrl+C to exit)\n");

  subscription = consumer.subscribe({
    processEvents: async (
      events: ReceivedEventData[],
      context
    ): Promise<void> => {
      if (events.length === 0) return;

      console.log(
        `\n--- Received ${events.length} event(s) from partition: ${context.partitionId} ---`
      );

      for (const event of events) {
        console.log("\nEvent Details:");
        console.log("  Body:", JSON.stringify(event.body, null, 2));
        console.log("  Properties:", event.properties);
        console.log("  System Properties:");
        console.log("    - Sequence Number:", event.sequenceNumber);
        console.log("    - Offset:", event.offset);
        console.log("    - Enqueued Time:", event.enqueuedTimeUtc);

        await context.updateCheckpoint(event);
        console.log("  ✓ Checkpoint updated");
      }
    },

    processError: async (error, context): Promise<void> => {
      console.error("\n!!! ERROR in event processing !!!");
      console.error("  Partition ID:", context.partitionId);
      console.error("  Error:", error.message);
    },
  });

  console.log("Subscription active - listening for events...");
}

async function shutdown(): Promise<void> {
  console.log("\n\n=== SHUTTING DOWN ===");

  if (subscription) {
    await subscription.close();
    console.log("✓ Subscription closed");
  }

  process.exit(0);
}

async function main(): Promise<void> {
  if (!EVENT_HUB_CONNECTION_STRING || !EVENT_HUB_NAME || !STORAGE_CONNECTION_STRING) {
    console.error("ERROR: Missing configuration!");
    console.error("Set: EVENT_HUB_CONNECTION_STRING, EVENT_HUB_NAME, STORAGE_CONNECTION_STRING");
    process.exit(1);
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await produceEvents();
  console.log("\nWaiting 2 seconds before consuming...");
  await new Promise((resolve) => setTimeout(resolve, 2000));
  await consumeEvents();
}

main().catch(async (error) => {
  console.error("Error:", error);
  await shutdown();
});
```

## **package.json**

```json
{
  "name": "azure-event-hubs-demo",
  "version": "1.0.0",
  "description": "TypeScript demo for Azure Event Hubs",
  "scripts": {
    "start": "ts-node event-hubs-demo.ts",
    "build": "tsc"
  },
  "dependencies": {
    "@azure/event-hubs": "^5.12.0",
    "@azure/eventhubs-checkpointstore-blob": "^1.1.0",
    "@azure/storage-blob": "^12.18.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "typescript": "^5.3.3",
    "ts-node": "^10.9.2"
  }
}
```

## **Quick Start**

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set environment variables:**
   ```bash
   $env:EVENT_HUB_CONNECTION_STRING="Endpoint=sb://..."
   $env:EVENT_HUB_NAME="your-eventhub"
   $env:STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https..."
   ```

3. **Run:**
   ```bash
   npm start
   ```

The program demonstrates all requested features: producer with batch creation, 10 events with custom properties, consumer with checkpoint store, event processing handlers, and graceful shutdown with proper async/await patterns!

## Re-run Command

```bash
hyoka run --prompt-id event-hubs-dp-js-ts-streaming --config azure-mcp/claude-sonnet-4.5
```

---

[← Back to Summary](../../../../../../summary.md)
