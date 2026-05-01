# Evaluation Report: event-hubs-dp-js-ts-streaming

**Config:** azure-mcp-skills/claude-sonnet-4.5 | **Result:** ❌ FAILED | **Duration:** 94.5s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `event-hubs-dp-js-ts-streaming` |
| Config | azure-mcp-skills/claude-sonnet-4.5 |
| Result | ❌ FAILED |
| Duration | 94.5s |
| Timestamp | 2026-04-30T23:26:30Z |
| Files Generated | 0 |
| Event Count | 78 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 94.4s |
| **Total** | **94.5s** |

## Configuration

- **name:** azure-mcp-skills/claude-sonnet-4.5
- **model:** claude-sonnet-4.5

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-sonnet-4.5 |
| Skills Loaded | customize-cloud-agent |
| MCP Servers | azure |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=124391 out=7563 |
| Turn Count | 3 |

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

The user wants me to write a TypeScript program that demonstrates Azure Event Hubs functionality with both sending and receiving events. This includes:
1. Producer client with connection string
2. Batch creation with 10 events with custom properties
3. Sending the batch
4. Consumer client with blob checkpoint store
5. Event subscription with handlers
6. Checkpoint updates
7. Graceful shutdown

I should create a complete, working example with proper async/await patterns and show the required npm packages.

This is a straightforward task - I'll create a TypeScript file with all the required functionality.

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Creating Event Hubs demo"}
```

### 🔧 2. create

**Input:**

```json
{"file_text":"import { \n  EventHubProducerClient, \n  EventHubConsumerClient, \n  ReceivedEventData,\n  Subscription \n} from \"@azure/event-hubs\";\nimport { ContainerClient } from \"@azure/storage-blob\";\nimport { BlobCheckpointStore } from \"@azure/eventhubs-checkpointstore-blob\";\n\n/**\n * Azure Event Hubs Demo - Producer and Consumer with Checkpointing\n * \n * Required npm packages:\n * npm install @azure/event-hubs @azure/eventhubs-checkpointstore-blob @azure/storage-blob\n */\n\n// Configuration - Replace with your actual connection strings\nconst EVENT_HUB_CONNECTION_STRING = process.env.EVENT_HUB_CONNECTION_STRING || \"Endpoint=sb://YOUR_NAMESPACE.servicebus.windows.net/;SharedAccessKeyName=YOUR_KEY_NAME;SharedAccessKey=YOUR_KEY\";\nconst EVENT_HUB_NAME = process.env.EVENT_HUB_NAME || \"YOUR_EVENT_HUB_NAME\";\nconst CONSUMER_GROUP = process.env.CONSUMER_GROUP || \"$Default\";\nconst STORAGE_CONNECTION_STRING = process.env.STORAGE_CONNECTION_STRING || \"DefaultEndpointsProtocol=https;AccountName=YOUR_ACCOUNT;AccountKey=YOUR_KEY;EndpointSuffix=core.windows.net\";\nconst STORAGE_CONTAINER_NAME = process.env.STORAGE_CONTAINER_NAME || \"eventhub-checkpoints\";\n\n/**\n * Producer: Send events to Event Hub\n */\nasync function sendEvents(): Promise\u003cvoid\u003e {\n  console.log(\"=== Starting Event Producer ===\\n\");\n  \n  // 1. Create EventHubProducerClient using connection string\n  const producer = new EventHubProducerClient(\n    EVENT_HUB_CONNECTION_STRING,\n    EVENT_HUB_NAME\n  );\n\n  try {\n    // 2. Create a batch with createBatch()\n    const batch = await producer.createBatch();\n    console.log(\"Created batch for events\");\n\n    // 3. Add 10 events with custom properties\n    for (let i = 1; i \u003c= 10; i++) {\n      const eventData = {\n        body: {\n          message: `Event message ${i}`,\n          timestamp: new Date().toISOString(),\n          sequenceNumber: i\n        },\n        properties: {\n          eventType: \"demo-event\",\n          priority: i % 3 === 0 ? \"high\" : \"normal\",\n          sender: \"typescript-producer\",\n          version: \"1.0\"\n        }\n      };\n\n      const wasAdded = batch.tryAdd(eventData);\n      \n      if (!wasAdded) {\n        console.log(`Event ${i} could not be added to batch (batch full)`);\n        break;\n      }\n      \n      console.log(`Added event ${i} to batch`);\n    }\n\n    // 4. Send the batch using sendBatch()\n    console.log(`\\nSending batch with ${batch.count} events...`);\n    await producer.sendBatch(batch);\n    console.log(`✓ Successfully sent ${batch.count} events to Event Hub\\n`);\n\n  } catch (error) {\n    console.error(\"Error sending events:\", error);\n    throw error;\n  } finally {\n    // 7. Implement graceful shutdown with close()\n    await producer.close();\n    console.log(\"Producer connection closed\\n\");\n  }\n}\n\n/**\n * Consumer: Receive events from Event Hub with checkpoint storage\n */\nasync function receiveEvents(): Promise\u003cvoid\u003e {\n  console.log(\"=== Starting Event Consumer ===\\n\");\n\n  // 5. Create an EventHubConsumerClient with a BlobCheckpointStore\n  const containerClient = new ContainerClient(\n    STORAGE_CONNECTION_STRING,\n    STORAGE_CONTAINER_NAME\n  );\n\n  // Ensure the container exists\n  await containerClient.createIfNotExists();\n  console.log(`Checkpoint store container ready: ${STORAGE_CONTAINER_NAME}`);\n\n  const checkpointStore = new BlobCheckpointStore(containerClient);\n  \n  const consumer = new EventHubConsumerClient(\n    CONSUMER_GROUP,\n    EVENT_HUB_CONNECTION_STRING,\n    EVENT_HUB_NAME,\n    checkpointStore\n  );\n\n  let eventCount = 0;\n  let subscription: Subscription | null = null;\n\n  try {\n    // 6. Subscribe to events using subscribe() with processEvents and processError handlers\n    subscription = consumer.subscribe({\n      processEvents: async (events: ReceivedEventData[], context) =\u003e {\n        // Handle received events\n        for (const event of events) {\n          eventCount++;\n          \n          // 7. Print received event bodies\n          console.log(`\\n--- Received Event #${eventCount} ---`);\n          console.log(`Partition ID: ${context.partitionId}`);\n          console.log(`Sequence Number: ${event.sequenceNumber}`);\n          console.log(`Offset: ${event.offset}`);\n          console.log(`Event Body:`, JSON.stringify(event.body, null, 2));\n          \n          if (event.properties) {\n            console.log(`Custom Properties:`, event.properties);\n          }\n          \n          console.log(`Enqueued Time: ${event.enqueuedTimeUtc}`);\n\n          // 8. Update checkpoints after processing\n          try {\n            await context.updateCheckpoint(event);\n            console.log(`✓ Checkpoint updated for partition ${context.partitionId}`);\n          } catch (checkpointError) {\n            console.error(\"Error updating checkpoint:\", checkpointError);\n          }\n        }\n\n        if (events.length === 0) {\n          console.log(\"No events received in this batch\");\n        }\n      },\n\n      processError: async (error, context) =\u003e {\n        // Handle errors\n        console.error(`\\n!!! Error on partition ${context.partitionId}:`, error);\n      },\n\n      // Start reading from the beginning of the partition\n      startPosition: { earliest: true }\n    });\n\n    console.log(\"\\n✓ Subscribed to Event Hub. Waiting for events...\");\n    console.log(\"(Press Ctrl+C to stop)\\n\");\n\n    // Keep the consumer running for 30 seconds to receive events\n    // In production, this would run continuously until shutdown signal\n    await new Promise((resolve) =\u003e setTimeout(resolve, 30000));\n\n    console.log(`\\n=== Received ${eventCount} total events ===\\n`);\n\n  } catch (error) {\n    console.error(\"Error receiving events:\", error);\n    throw error;\n  } finally {\n    // 9. Implement graceful shutdown with close()\n    if (subscription) {\n      await subscription.close();\n      console.log(\"Subscription closed\");\n    }\n    \n    await consumer.close();\n    console.log(\"Consumer connection closed\\n\");\n  }\n}\n\n/**\n * Main execution function\n */\nasync function main(): Promise\u003cvoid\u003e {\n  console.log(\"╔═══════════════════════════════════════════════════════╗\");\n  console.log(\"║   Azure Event Hubs TypeScript Demo                   ║\");\n  console.log(\"║   Producer \u0026 Consumer with Checkpoint Storage        ║\");\n  console.log(\"╚═══════════════════════════════════════════════════════╝\\n\");\n\n  try {\n    // First, send events\n    await sendEvents();\n\n    // Wait a moment for events to be available\n    console.log(\"Waiting 2 seconds before starting consumer...\\n\");\n    await new Promise(resolve =\u003e setTimeout(resolve, 2000));\n\n    // Then, receive events\n    await receiveEvents();\n\n    console.log(\"✓ Demo completed successfully!\");\n\n  } catch (error) {\n    console.error(\"\\n✗ Demo failed with error:\", error);\n    process.exit(1);\n  }\n}\n\n// Handle graceful shutdown on SIGINT (Ctrl+C)\nprocess.on(\"SIGINT\", async () =\u003e {\n  console.log(\"\\n\\nReceived shutdown signal. Cleaning up...\");\n  process.exit(0);\n});\n\n// Execute the demo\nif (require.main === module) {\n  main().catch((error) =\u003e {\n    console.error(\"Unhandled error:\", error);\n    process.exit(1);\n  });\n}\n\nexport { sendEvents, receiveEvents };\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-azure-mcp-skills-claude-sonnet-4.5-3477435027\\event-hubs-demo.ts"}
```

### 🔧 3. create

**Input:**

```json
{"file_text":"{\n  \"name\": \"azure-event-hubs-demo\",\n  \"version\": \"1.0.0\",\n  \"description\": \"Azure Event Hubs TypeScript demonstration with producer and consumer\",\n  \"main\": \"event-hubs-demo.ts\",\n  \"scripts\": {\n    \"start\": \"ts-node event-hubs-demo.ts\",\n    \"build\": \"tsc\",\n    \"dev\": \"ts-node-dev --respawn event-hubs-demo.ts\"\n  },\n  \"keywords\": [\n    \"azure\",\n    \"event-hubs\",\n    \"typescript\",\n    \"streaming\",\n    \"checkpoint\"\n  ],\n  \"author\": \"\",\n  \"license\": \"MIT\",\n  \"dependencies\": {\n    \"@azure/event-hubs\": \"^5.11.0\",\n    \"@azure/eventhubs-checkpointstore-blob\": \"^1.1.0\",\n    \"@azure/storage-blob\": \"^12.17.0\"\n  },\n  \"devDependencies\": {\n    \"@types/node\": \"^20.10.0\",\n    \"ts-node\": \"^10.9.2\",\n    \"ts-node-dev\": \"^2.0.0\",\n    \"typescript\": \"^5.3.0\"\n  }\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-azure-mcp-skills-claude-sonnet-4.5-3477435027\\package.json"}
```

### 🔧 4. create

**Input:**

```json
{"file_text":"{\n  \"compilerOptions\": {\n    \"target\": \"ES2020\",\n    \"module\": \"commonjs\",\n    \"lib\": [\"ES2020\"],\n    \"outDir\": \"./dist\",\n    \"rootDir\": \"./\",\n    \"strict\": true,\n    \"esModuleInterop\": true,\n    \"skipLibCheck\": true,\n    \"forceConsistentCasingInFileNames\": true,\n    \"resolveJsonModule\": true,\n    \"moduleResolution\": \"node\",\n    \"allowSyntheticDefaultImports\": true\n  },\n  \"include\": [\"*.ts\"],\n  \"exclude\": [\"node_modules\", \"dist\"]\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-azure-mcp-skills-claude-sonnet-4.5-3477435027\\tsconfig.json"}
```

### 🔧 5. create

**Input:**

```json
{"file_text":"# Azure Event Hubs Configuration\nEVENT_HUB_CONNECTION_STRING=Endpoint=sb://YOUR_NAMESPACE.servicebus.windows.net/;SharedAccessKeyName=YOUR_KEY_NAME;SharedAccessKey=YOUR_KEY\nEVENT_HUB_NAME=YOUR_EVENT_HUB_NAME\nCONSUMER_GROUP=$Default\n\n# Azure Storage Account (for checkpoint store)\nSTORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=YOUR_ACCOUNT;AccountKey=YOUR_KEY;EndpointSuffix=core.windows.net\nSTORAGE_CONTAINER_NAME=eventhub-checkpoints\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-azure-mcp-skills-claude-sonnet-4.5-3477435027\\.env.example"}
```

### 🔧 6. create

**Input:**

```json
{"file_text":"# Azure Event Hubs TypeScript Demo\n\nA comprehensive demonstration of Azure Event Hubs producer and consumer patterns with checkpoint storage using TypeScript.\n\n## Features\n\n✅ **EventHubProducerClient** - Send events with connection string authentication  \n✅ **Batch Processing** - Create and send batches with `createBatch()` and `sendBatch()`  \n✅ **Custom Properties** - Add custom properties to events  \n✅ **EventHubConsumerClient** - Receive events with consumer groups  \n✅ **BlobCheckpointStore** - Persistent checkpoint storage in Azure Blob Storage  \n✅ **Event Subscription** - Subscribe with `processEvents` and `processError` handlers  \n✅ **Checkpoint Updates** - Update checkpoints after processing events  \n✅ **Graceful Shutdown** - Proper cleanup with `close()` methods  \n✅ **Async/Await** - Modern async patterns throughout  \n\n## Required NPM Packages\n\n```bash\nnpm install @azure/event-hubs @azure/eventhubs-checkpointstore-blob @azure/storage-blob\n```\n\n## Development Dependencies\n\n```bash\nnpm install --save-dev typescript ts-node @types/node\n```\n\n## Configuration\n\n1. Copy `.env.example` to `.env`:\n   ```bash\n   cp .env.example .env\n   ```\n\n2. Update the following environment variables in `.env`:\n   - `EVENT_HUB_CONNECTION_STRING` - Your Event Hubs namespace connection string\n   - `EVENT_HUB_NAME` - The name of your Event Hub\n   - `CONSUMER_GROUP` - Consumer group name (default: `$Default`)\n   - `STORAGE_CONNECTION_STRING` - Azure Storage account connection string for checkpoints\n   - `STORAGE_CONTAINER_NAME` - Container name for checkpoint storage\n\n## Installation\n\n```bash\nnpm install\n```\n\n## Usage\n\n### Run the demo:\n```bash\nnpm start\n```\n\n### Run in development mode with auto-reload:\n```bash\nnpm run dev\n```\n\n### Build TypeScript:\n```bash\nnpm run build\n```\n\n## How It Works\n\n### 1. Producer (Sending Events)\n- Creates an `EventHubProducerClient` with connection string\n- Creates a batch using `createBatch()`\n- Adds 10 events with custom properties to the batch\n- Sends the batch using `sendBatch()`\n- Closes the producer connection\n\n### 2. Consumer (Receiving Events)\n- Creates a `BlobCheckpointStore` for persistent checkpointing\n- Creates an `EventHubConsumerClient` with the checkpoint store\n- Subscribes to events using `subscribe()` with:\n  - `processEvents`: Handler for incoming events\n  - `processError`: Handler for errors\n- Prints received event bodies and metadata\n- Updates checkpoints after processing each event\n- Closes the consumer connection gracefully\n\n## Event Structure\n\nEach event includes:\n- **Body**: JSON object with message, timestamp, and sequence number\n- **Custom Properties**: eventType, priority, sender, version\n- **System Properties**: sequenceNumber, offset, enqueuedTimeUtc, partitionKey\n\n## Checkpoint Storage\n\nCheckpoints are stored in Azure Blob Storage to track:\n- Which events have been processed\n- Resume point after restart\n- Partition ownership in consumer groups\n\n## Graceful Shutdown\n\nThe demo implements proper cleanup:\n- Closes subscriptions before shutting down\n- Closes consumer and producer clients\n- Handles SIGINT (Ctrl+C) for graceful termination\n\n## Production Considerations\n\nFor production use, consider:\n- Use Azure Key Vault for connection string storage\n- Implement retry policies for transient failures\n- Add structured logging (Application Insights)\n- Set up monitoring and alerts\n- Handle backpressure and batching strategies\n- Configure partition distribution strategies\n- Implement dead-letter queue handling\n\n## Troubleshooting\n\n**Events not received:**\n- Verify Event Hub connection string and name\n- Check consumer group exists\n- Ensure storage account permissions for checkpoints\n- Verify network connectivity\n\n**Checkpoint errors:**\n- Verify storage account connection string\n- Ensure container exists or can be created\n- Check storage account permissions\n\n## Resources\n\n- [Azure Event Hubs Documentation](https://docs.microsoft.com/azure/event-hubs/)\n- [@azure/event-hubs npm package](https://www.npmjs.com/package/@azure/event-hubs)\n- [@azure/eventhubs-checkpointstore-blob](https://www.npmjs.com/package/@azure/eventhubs-checkpointstore-blob)\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-azure-mcp-skills-claude-sonnet-4.5-3477435027\\README.md"}
```

### 🔧 7. powershell

**Input:**

```json
{"command":"Get-Location; Get-ChildItem | Select-Object Name, Mode","description":"Check current directory"}
```

## Copilot Response

I'll create a comprehensive TypeScript program demonstrating Azure Event Hubs producer and consumer patterns with checkpoint storage.

I encountered permission issues creating files. Let me check the current directory and try a different approach:

It appears I don't have permission to create files in this environment. Let me provide you with the complete TypeScript program and configuration files as text that you can create manually:

## **event-hubs-demo.ts**

```typescript
import { 
  EventHubProducerClient, 
  EventHubConsumerClient, 
  ReceivedEventData,
  Subscription 
} from "@azure/event-hubs";
import { ContainerClient } from "@azure/storage-blob";
import { BlobCheckpointStore } from "@azure/eventhubs-checkpointstore-blob";

/**
 * Azure Event Hubs Demo - Producer and Consumer with Checkpointing
 * 
 * Required npm packages:
 * npm install @azure/event-hubs @azure/eventhubs-checkpointstore-blob @azure/storage-blob
 */

// Configuration - Replace with your actual connection strings
const EVENT_HUB_CONNECTION_STRING = process.env.EVENT_HUB_CONNECTION_STRING || "Endpoint=sb://YOUR_NAMESPACE.servicebus.windows.net/;SharedAccessKeyName=YOUR_KEY_NAME;SharedAccessKey=YOUR_KEY";
const EVENT_HUB_NAME = process.env.EVENT_HUB_NAME || "YOUR_EVENT_HUB_NAME";
const CONSUMER_GROUP = process.env.CONSUMER_GROUP || "$Default";
const STORAGE_CONNECTION_STRING = process.env.STORAGE_CONNECTION_STRING || "DefaultEndpointsProtocol=https;AccountName=YOUR_ACCOUNT;AccountKey=YOUR_KEY;EndpointSuffix=core.windows.net";
const STORAGE_CONTAINER_NAME = process.env.STORAGE_CONTAINER_NAME || "eventhub-checkpoints";

/**
 * Producer: Send events to Event Hub
 */
async function sendEvents(): Promise<void> {
  console.log("=== Starting Event Producer ===\n");
  
  // 1. Create EventHubProducerClient using connection string
  const producer = new EventHubProducerClient(
    EVENT_HUB_CONNECTION_STRING,
    EVENT_HUB_NAME
  );

  try {
    // 2. Create a batch with createBatch()
    const batch = await producer.createBatch();
    console.log("Created batch for events");

    // 3. Add 10 events with custom properties
    for (let i = 1; i <= 10; i++) {
      const eventData = {
        body: {
          message: `Event message ${i}`,
          timestamp: new Date().toISOString(),
          sequenceNumber: i
        },
        properties: {
          eventType: "demo-event",
          priority: i % 3 === 0 ? "high" : "normal",
          sender: "typescript-producer",
          version: "1.0"
        }
      };

      const wasAdded = batch.tryAdd(eventData);
      
      if (!wasAdded) {
        console.log(`Event ${i} could not be added to batch (batch full)`);
        break;
      }
      
      console.log(`Added event ${i} to batch`);
    }

    // 4. Send the batch using sendBatch()
    console.log(`\nSending batch with ${batch.count} events...`);
    await producer.sendBatch(batch);
    console.log(`✓ Successfully sent ${batch.count} events to Event Hub\n`);

  } catch (error) {
    console.error("Error sending events:", error);
    throw error;
  } finally {
    // 7. Implement graceful shutdown with close()
    await producer.close();
    console.log("Producer connection closed\n");
  }
}

/**
 * Consumer: Receive events from Event Hub with checkpoint storage
 */
async function receiveEvents(): Promise<void> {
  console.log("=== Starting Event Consumer ===\n");

  // 5. Create an EventHubConsumerClient with a BlobCheckpointStore
  const containerClient = new ContainerClient(
    STORAGE_CONNECTION_STRING,
    STORAGE_CONTAINER_NAME
  );

  // Ensure the container exists
  await containerClient.createIfNotExists();
  console.log(`Checkpoint store container ready: ${STORAGE_CONTAINER_NAME}`);

  const checkpointStore = new BlobCheckpointStore(containerClient);
  
  const consumer = new EventHubConsumerClient(
    CONSUMER_GROUP,
    EVENT_HUB_CONNECTION_STRING,
    EVENT_HUB_NAME,
    checkpointStore
  );

  let eventCount = 0;
  let subscription: Subscription | null = null;

  try {
    // 6. Subscribe to events using subscribe() with processEvents and processError handlers
    subscription = consumer.subscribe({
      processEvents: async (events: ReceivedEventData[], context) => {
        // Handle received events
        for (const event of events) {
          eventCount++;
          
          // 7. Print received event bodies
          console.log(`\n--- Received Event #${eventCount} ---`);
          console.log(`Partition ID: ${context.partitionId}`);
          console.log(`Sequence Number: ${event.sequenceNumber}`);
          console.log(`Offset: ${event.offset}`);
          console.log(`Event Body:`, JSON.stringify(event.body, null, 2));
          
          if (event.properties) {
            console.log(`Custom Properties:`, event.properties);
          }
          
          console.log(`Enqueued Time: ${event.enqueuedTimeUtc}`);

          // 8. Update checkpoints after processing
          try {
            await context.updateCheckpoint(event);
            console.log(`✓ Checkpoint updated for partition ${context.partitionId}`);
          } catch (checkpointError) {
            console.error("Error updating checkpoint:", checkpointError);
          }
        }

        if (events.length === 0) {
          console.log("No events received in this batch");
        }
      },

      processError: async (error, context) => {
        // Handle errors
        console.error(`\n!!! Error on partition ${context.partitionId}:`, error);
      },

      // Start reading from the beginning of the partition
      startPosition: { earliest: true }
    });

    console.log("\n✓ Subscribed to Event Hub. Waiting for events...");
    console.log("(Press Ctrl+C to stop)\n");

    // Keep the consumer running for 30 seconds to receive events
    // In production, this would run continuously until shutdown signal
    await new Promise((resolve) => setTimeout(resolve, 30000));

    console.log(`\n=== Received ${eventCount} total events ===\n`);

  } catch (error) {
    console.error("Error receiving events:", error);
    throw error;
  } finally {
    // 9. Implement graceful shutdown with close()
    if (subscription) {
      await subscription.close();
      console.log("Subscription closed");
    }
    
    await consumer.close();
    console.log("Consumer connection closed\n");
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  console.log("╔═══════════════════════════════════════════════════════╗");
  console.log("║   Azure Event Hubs TypeScript Demo                   ║");
  console.log("║   Producer & Consumer with Checkpoint Storage        ║");
  console.log("╚═══════════════════════════════════════════════════════╝\n");

  try {
    // First, send events
    await sendEvents();

    // Wait a moment for events to be available
    console.log("Waiting 2 seconds before starting consumer...\n");
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Then, receive events
    await receiveEvents();

    console.log("✓ Demo completed successfully!");

  } catch (error) {
    console.error("\n✗ Demo failed with error:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown on SIGINT (Ctrl+C)
process.on("SIGINT", async () => {
  console.log("\n\nReceived shutdown signal. Cleaning up...");
  process.exit(0);
});

// Execute the demo
if (require.main === module) {
  main().catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
}

export { sendEvents, receiveEvents };
```

## **package.json**

```json
{
  "name": "azure-event-hubs-demo",
  "version": "1.0.0",
  "description": "Azure Event Hubs TypeScript demonstration with producer and consumer",
  "main": "event-hubs-demo.ts",
  "scripts": {
    "start": "ts-node event-hubs-demo.ts",
    "build": "tsc",
    "dev": "ts-node-dev --respawn event-hubs-demo.ts"
  },
  "keywords": ["azure", "event-hubs", "typescript", "streaming", "checkpoint"],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "@azure/event-hubs": "^5.11.0",
    "@azure/eventhubs-checkpointstore-blob": "^1.1.0",
    "@azure/storage-blob": "^12.17.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "ts-node": "^10.9.2",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.3.0"
  }
}
```

## **tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true
  },
  "include": ["*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

## **Setup and Usage**

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables** (or edit the constants in the code):
   - `EVENT_HUB_CONNECTION_STRING`
   - `EVENT_HUB_NAME`
   - `STORAGE_CONNECTION_STRING`
   - `STORAGE_CONTAINER_NAME`

3. **Run the demo:**
   ```bash
   npm start
   ```

## **Key Features Demonstrated:**

✅ **EventHubProducerClient** with connection string authentication  
✅ **createBatch()** for efficient batch creation  
✅ **10 events with custom properties** (eventType, priority, sender, version)  
✅ **sendBatch()** for batch transmission  
✅ **BlobCheckpointStore** for persistent checkpointing  
✅ **EventHubConsumerClient** with checkpoint store  
✅ **subscribe()** with processEvents and processError handlers  
✅ **Checkpoint updates** after processing each event  
✅ **Graceful shutdown** with close() methods  
✅ **Proper async/await** patterns throughout

The program demonstrates a complete Event Hubs workflow: producing events, consuming them with checkpoint tracking, and proper resource cleanup.

## Re-run Command

```bash
hyoka run --prompt-id event-hubs-dp-js-ts-streaming --config azure-mcp-skills/claude-sonnet-4.5
```

---

[← Back to Summary](../../../../../../summary.md)
