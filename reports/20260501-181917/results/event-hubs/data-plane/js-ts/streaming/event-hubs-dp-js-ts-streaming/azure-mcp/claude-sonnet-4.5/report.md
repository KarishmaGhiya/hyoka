# Evaluation Report: event-hubs-dp-js-ts-streaming

**Config:** azure-mcp/claude-sonnet-4.5 | **Result:** ❌ FAILED | **Duration:** 208.4s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `event-hubs-dp-js-ts-streaming` |
| Config | azure-mcp/claude-sonnet-4.5 |
| Result | ❌ FAILED |
| Score | 18/10 |
| Duration | 208.4s |
| Timestamp | 2026-05-02T01:21:56Z |
| Files Generated | 4 |
| Event Count | 97 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 113.9s |
| Review | 94.4s |
| **Total** | **208.4s** |

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
| Token Usage | in=164801 out=9969 |
| Turn Count | 4 |

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

The user wants a TypeScript program that demonstrates Azure Event Hubs sending and receiving with proper patterns. Let me create a complete example showing:

1. EventHubProducerClient with connection string
2. Creating and sending a batch with 10 events with custom properties
3. EventHubConsumerClient with BlobCheckpointStore
4. Subscribe with processEvents and processError handlers
5. Checkpoint updates
6. Graceful shutdown

I'll also provide a package.json with the required dependencies and proper TypeScript configuration.

Let me create the files needed for this demonstration.

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Creating Event Hubs demo"}
```

### 🔧 2. create

**Input:**

```json
{"file_text":"{\n  \"name\": \"azure-event-hubs-demo\",\n  \"version\": \"1.0.0\",\n  \"description\": \"Azure Event Hubs TypeScript streaming demo with producers and consumers\",\n  \"main\": \"dist/index.js\",\n  \"scripts\": {\n    \"build\": \"tsc\",\n    \"start\": \"node dist/index.js\",\n    \"dev\": \"ts-node src/index.ts\"\n  },\n  \"keywords\": [\"azure\", \"event-hubs\", \"streaming\", \"typescript\"],\n  \"author\": \"\",\n  \"license\": \"MIT\",\n  \"dependencies\": {\n    \"@azure/event-hubs\": \"^5.11.0\",\n    \"@azure/eventhubs-checkpointstore-blob\": \"^1.0.1\",\n    \"@azure/storage-blob\": \"^12.17.0\"\n  },\n  \"devDependencies\": {\n    \"@types/node\": \"^20.11.0\",\n    \"typescript\": \"^5.3.3\",\n    \"ts-node\": \"^10.9.2\"\n  }\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-azure-mcp-claude-sonnet-4.5-3290191661\\package.json"}
```

### 🔧 3. create

**Input:**

```json
{"file_text":"{\n  \"compilerOptions\": {\n    \"target\": \"ES2020\",\n    \"module\": \"commonjs\",\n    \"lib\": [\"ES2020\"],\n    \"outDir\": \"./dist\",\n    \"rootDir\": \"./src\",\n    \"strict\": true,\n    \"esModuleInterop\": true,\n    \"skipLibCheck\": true,\n    \"forceConsistentCasingInFileNames\": true,\n    \"resolveJsonModule\": true,\n    \"moduleResolution\": \"node\"\n  },\n  \"include\": [\"src/**/*\"],\n  \"exclude\": [\"node_modules\", \"dist\"]\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-azure-mcp-claude-sonnet-4.5-3290191661\\tsconfig.json"}
```

### 🔧 4. create

**Input:**

```json
{"file_text":"import {\n  EventHubProducerClient,\n  EventHubConsumerClient,\n  EventData,\n  Subscription,\n  ReceivedEventData,\n} from \"@azure/event-hubs\";\nimport { BlobCheckpointStore } from \"@azure/eventhubs-checkpointstore-blob\";\nimport { ContainerClient } from \"@azure/storage-blob\";\n\n// Configuration - Replace with your actual connection strings\nconst EVENT_HUB_CONNECTION_STRING = process.env.EVENT_HUB_CONNECTION_STRING || \n  \"Endpoint=sb://YOUR-NAMESPACE.servicebus.windows.net/;SharedAccessKeyName=YOUR-KEY-NAME;SharedAccessKey=YOUR-KEY\";\nconst EVENT_HUB_NAME = process.env.EVENT_HUB_NAME || \"YOUR-EVENT-HUB-NAME\";\nconst CONSUMER_GROUP = process.env.CONSUMER_GROUP || \"$Default\";\n\n// Blob Storage for checkpoint management\nconst STORAGE_CONNECTION_STRING = process.env.STORAGE_CONNECTION_STRING || \n  \"DefaultEndpointsProtocol=https;AccountName=YOUR-ACCOUNT;AccountKey=YOUR-KEY;EndpointSuffix=core.windows.net\";\nconst CONTAINER_NAME = process.env.CONTAINER_NAME || \"eventhub-checkpoints\";\n\n/**\n * Producer: Send events to Event Hub\n */\nasync function sendEvents(): Promise\u003cvoid\u003e {\n  console.log(\"\\n=== PRODUCER: Sending Events ===\");\n  \n  // Create producer client\n  const producer = new EventHubProducerClient(\n    EVENT_HUB_CONNECTION_STRING,\n    EVENT_HUB_NAME\n  );\n\n  try {\n    // Create a batch\n    const batch = await producer.createBatch();\n    console.log(`Created batch with max size: ${batch.maxSizeInBytes} bytes`);\n\n    // Add 10 events with custom properties\n    for (let i = 1; i \u003c= 10; i++) {\n      const eventData: EventData = {\n        body: {\n          id: i,\n          message: `Event message ${i}`,\n          timestamp: new Date().toISOString(),\n          data: {\n            sensor: `sensor-${i % 3}`,\n            temperature: 20 + Math.random() * 10,\n            humidity: 40 + Math.random() * 30,\n          },\n        },\n        properties: {\n          eventType: \"sensor-reading\",\n          priority: i % 2 === 0 ? \"high\" : \"normal\",\n          source: \"demo-app\",\n          version: \"1.0\",\n        },\n        contentType: \"application/json\",\n      };\n\n      const isAdded = batch.tryAdd(eventData);\n      if (!isAdded) {\n        console.warn(`Event ${i} could not be added to batch (batch full)`);\n        break;\n      }\n      console.log(`✓ Added event ${i} to batch`);\n    }\n\n    console.log(`\\nBatch contains ${batch.count} events`);\n    console.log(`Batch size: ${batch.sizeInBytes} bytes`);\n\n    // Send the batch\n    console.log(\"\\nSending batch...\");\n    await producer.sendBatch(batch);\n    console.log(\"✓ Batch sent successfully!\");\n\n  } catch (error) {\n    console.error(\"Error sending events:\", error);\n    throw error;\n  } finally {\n    // Graceful shutdown\n    await producer.close();\n    console.log(\"✓ Producer closed\");\n  }\n}\n\n/**\n * Consumer: Receive events from Event Hub with checkpoint management\n */\nasync function receiveEvents(): Promise\u003cSubscription\u003e {\n  console.log(\"\\n=== CONSUMER: Receiving Events ===\");\n\n  // Create blob container client for checkpoint store\n  const containerClient = new ContainerClient(\n    STORAGE_CONNECTION_STRING,\n    CONTAINER_NAME\n  );\n\n  // Ensure container exists\n  await containerClient.createIfNotExists();\n  console.log(`✓ Checkpoint container ready: ${CONTAINER_NAME}`);\n\n  // Create checkpoint store\n  const checkpointStore = new BlobCheckpointStore(containerClient);\n\n  // Create consumer client\n  const consumer = new EventHubConsumerClient(\n    CONSUMER_GROUP,\n    EVENT_HUB_CONNECTION_STRING,\n    EVENT_HUB_NAME,\n    checkpointStore\n  );\n\n  let eventCount = 0;\n\n  // Subscribe to events\n  const subscription = consumer.subscribe({\n    /**\n     * Process incoming events\n     */\n    processEvents: async (events: ReceivedEventData[], context) =\u003e {\n      if (events.length === 0) {\n        console.log(`No events received in partition ${context.partitionId}`);\n        return;\n      }\n\n      console.log(`\\n--- Received ${events.length} event(s) from partition ${context.partitionId} ---`);\n\n      for (const event of events) {\n        eventCount++;\n        \n        // Print event details\n        console.log(`\\nEvent #${eventCount}:`);\n        console.log(`  Sequence Number: ${event.sequenceNumber}`);\n        console.log(`  Offset: ${event.offset}`);\n        console.log(`  Enqueued Time: ${event.enqueuedTimeUtc}`);\n        \n        // Print event body\n        console.log(`  Body:`, JSON.stringify(event.body, null, 2));\n        \n        // Print custom properties\n        if (event.properties) {\n          console.log(`  Properties:`, event.properties);\n        }\n\n        // Print system properties\n        console.log(`  Content Type: ${event.contentType}`);\n        console.log(`  Partition Key: ${event.partitionKey || \"none\"}`);\n      }\n\n      // Update checkpoint after processing all events\n      try {\n        await context.updateCheckpoint(events[events.length - 1]);\n        console.log(`✓ Checkpoint updated for partition ${context.partitionId}`);\n      } catch (error) {\n        console.error(`Error updating checkpoint:`, error);\n      }\n    },\n\n    /**\n     * Handle errors\n     */\n    processError: async (error, context) =\u003e {\n      console.error(`\\n❌ ERROR in partition ${context.partitionId}:`);\n      console.error(`  Error: ${error.message}`);\n      console.error(`  Full error:`, error);\n    },\n  });\n\n  console.log(\"✓ Subscribed to Event Hub\");\n  console.log(\"  Listening for events... (Press Ctrl+C to stop)\");\n\n  return subscription;\n}\n\n/**\n * Main execution\n */\nasync function main(): Promise\u003cvoid\u003e {\n  console.log(\"=================================\");\n  console.log(\"Azure Event Hubs TypeScript Demo\");\n  console.log(\"=================================\");\n\n  let subscription: Subscription | undefined;\n\n  try {\n    // Step 1: Send events\n    await sendEvents();\n\n    // Wait a bit for events to be available\n    console.log(\"\\nWaiting 3 seconds for events to be available...\");\n    await new Promise(resolve =\u003e setTimeout(resolve, 3000));\n\n    // Step 2: Receive events\n    subscription = await receiveEvents();\n\n    // Keep the consumer running for 30 seconds to receive events\n    console.log(\"\\nConsumer will run for 30 seconds...\");\n    await new Promise(resolve =\u003e setTimeout(resolve, 30000));\n\n  } catch (error) {\n    console.error(\"\\n❌ Fatal error:\", error);\n    process.exit(1);\n  } finally {\n    // Graceful shutdown\n    console.log(\"\\n\\n=== SHUTDOWN ===\");\n    if (subscription) {\n      console.log(\"Closing subscription...\");\n      await subscription.close();\n      console.log(\"✓ Subscription closed\");\n    }\n    console.log(\"\\n✓ Demo completed successfully!\");\n  }\n}\n\n// Handle process termination\nprocess.on(\"SIGINT\", async () =\u003e {\n  console.log(\"\\n\\nReceived SIGINT, shutting down gracefully...\");\n  process.exit(0);\n});\n\nprocess.on(\"SIGTERM\", async () =\u003e {\n  console.log(\"\\n\\nReceived SIGTERM, shutting down gracefully...\");\n  process.exit(0);\n});\n\n// Run the demo\nmain().catch((error) =\u003e {\n  console.error(\"Unhandled error:\", error);\n  process.exit(1);\n});\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-azure-mcp-claude-sonnet-4.5-3290191661\\src\\index.ts"}
```

### 🔧 5. create

**Input:**

```json
{"file_text":"# Azure Event Hubs Configuration\nEVENT_HUB_CONNECTION_STRING=Endpoint=sb://YOUR-NAMESPACE.servicebus.windows.net/;SharedAccessKeyName=YOUR-KEY-NAME;SharedAccessKey=YOUR-KEY\nEVENT_HUB_NAME=YOUR-EVENT-HUB-NAME\nCONSUMER_GROUP=$Default\n\n# Azure Blob Storage for Checkpoints\nSTORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=YOUR-ACCOUNT;AccountKey=YOUR-KEY;EndpointSuffix=core.windows.net\nCONTAINER_NAME=eventhub-checkpoints\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-azure-mcp-claude-sonnet-4.5-3290191661\\.env.example"}
```

### 🔧 6. create

**Input:**

```json
{"file_text":"# Azure Event Hubs TypeScript Demo\n\nComplete demonstration of sending and receiving events with Azure Event Hubs using TypeScript.\n\n## Features\n\n✅ **EventHubProducerClient** - Send events with connection string  \n✅ **Batch Creation** - Create batches with `createBatch()` and add 10 events  \n✅ **Custom Properties** - Events include custom properties and metadata  \n✅ **EventHubConsumerClient** - Receive events with checkpoint management  \n✅ **BlobCheckpointStore** - Persist checkpoints to Azure Blob Storage  \n✅ **Subscribe Pattern** - Process events with `subscribe()` handlers  \n✅ **Checkpoint Updates** - Update checkpoints after processing  \n✅ **Graceful Shutdown** - Proper cleanup with `close()`  \n✅ **Error Handling** - processError handler for robust error management  \n\n## Required Packages\n\n```json\n{\n  \"@azure/event-hubs\": \"^5.11.0\",\n  \"@azure/eventhubs-checkpointstore-blob\": \"^1.0.1\",\n  \"@azure/storage-blob\": \"^12.17.0\"\n}\n```\n\n## Setup\n\n1. **Install dependencies:**\n   ```bash\n   npm install\n   ```\n\n2. **Configure environment variables:**\n   \n   Copy `.env.example` to `.env` and fill in your Azure credentials:\n   ```bash\n   cp .env.example .env\n   ```\n\n   Or set environment variables:\n   ```bash\n   # Windows PowerShell\n   $env:EVENT_HUB_CONNECTION_STRING=\"Endpoint=sb://...\"\n   $env:EVENT_HUB_NAME=\"my-event-hub\"\n   $env:STORAGE_CONNECTION_STRING=\"DefaultEndpointsProtocol=https;...\"\n   $env:CONTAINER_NAME=\"eventhub-checkpoints\"\n   ```\n\n3. **Build TypeScript:**\n   ```bash\n   npm run build\n   ```\n\n## Usage\n\n### Run the demo:\n```bash\nnpm start\n```\n\n### Run with ts-node (development):\n```bash\nnpm run dev\n```\n\n## How It Works\n\n### 1. Producer (Send Events)\n\n```typescript\nconst producer = new EventHubProducerClient(connectionString, eventHubName);\nconst batch = await producer.createBatch();\n\n// Add events with custom properties\nbatch.tryAdd({\n  body: { id: 1, message: \"Event 1\" },\n  properties: { eventType: \"sensor-reading\", priority: \"high\" }\n});\n\nawait producer.sendBatch(batch);\nawait producer.close();\n```\n\n### 2. Consumer (Receive Events)\n\n```typescript\nconst checkpointStore = new BlobCheckpointStore(containerClient);\nconst consumer = new EventHubConsumerClient(\n  consumerGroup,\n  connectionString,\n  eventHubName,\n  checkpointStore\n);\n\nconst subscription = consumer.subscribe({\n  processEvents: async (events, context) =\u003e {\n    for (const event of events) {\n      console.log(\"Received:\", event.body);\n    }\n    // Update checkpoint\n    await context.updateCheckpoint(events[events.length - 1]);\n  },\n  processError: async (error, context) =\u003e {\n    console.error(\"Error:\", error);\n  }\n});\n\n// Later: cleanup\nawait subscription.close();\n```\n\n## Key Concepts\n\n### Event Data Structure\n```typescript\n{\n  body: any,                    // Event payload\n  properties: {                 // Custom properties\n    eventType: string,\n    priority: string,\n    source: string\n  },\n  contentType: string,          // MIME type\n  correlationId?: string,       // For message correlation\n  messageId?: string            // Unique message identifier\n}\n```\n\n### Checkpoint Management\n\nCheckpoints track the last successfully processed event per partition. Benefits:\n- **Resume from last position** after restart\n- **At-least-once delivery** guarantee\n- **Parallel processing** across partitions\n- **Fault tolerance** in distributed systems\n\n### Graceful Shutdown\n\nAlways close resources properly:\n```typescript\nawait producer.close();      // Close producer\nawait subscription.close();  // Close consumer subscription\n```\n\n## Azure Resources Required\n\n1. **Event Hubs Namespace** - Container for Event Hubs\n2. **Event Hub** - Specific event stream\n3. **Storage Account** - For checkpoint persistence\n4. **Blob Container** - Store checkpoint data\n\n## Best Practices\n\n✅ Use environment variables for secrets  \n✅ Always update checkpoints after processing  \n✅ Implement error handlers with retry logic  \n✅ Close connections gracefully on shutdown  \n✅ Use batch operations for better throughput  \n✅ Set appropriate partition keys for ordering  \n✅ Monitor consumer lag and throughput  \n✅ Use consumer groups for parallel processing  \n\n## Error Handling\n\nThe demo includes comprehensive error handling:\n- Producer errors during batch creation/sending\n- Consumer errors during event processing\n- Checkpoint update failures\n- Connection and network issues\n\n## Troubleshooting\n\n### \"Connection refused\" or timeout\n- Verify Event Hub connection string\n- Check firewall rules and network access\n- Ensure Event Hub exists and is active\n\n### \"Container not found\"\n- Storage connection string is correct\n- Container name matches configuration\n- Storage account is accessible\n\n### No events received\n- Wait longer (events may be delayed)\n- Check consumer group name\n- Verify producer sent events successfully\n\n## Production Considerations\n\n- **Scaling**: Use multiple consumer instances with same consumer group\n- **Partitioning**: Use partition keys for ordered processing\n- **Monitoring**: Track metrics (throughput, lag, errors)\n- **Security**: Use Managed Identity instead of connection strings\n- **Retry Logic**: Implement exponential backoff\n- **Batching**: Optimize batch sizes for your workload\n\n## License\n\nMIT\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-azure-mcp-claude-sonnet-4.5-3290191661\\README.md"}
```

### 🔧 7. create

**Input:**

```json
{"file_text":"# Dependencies\nnode_modules/\npackage-lock.json\nyarn.lock\n\n# Build output\ndist/\n*.js\n*.js.map\n\n# Environment variables\n.env\n.env.local\n\n# IDE\n.vscode/\n.idea/\n*.swp\n*.swo\n\n# Logs\nlogs/\n*.log\nnpm-debug.log*\n\n# OS\n.DS_Store\nThumbs.db\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-azure-mcp-claude-sonnet-4.5-3290191661\\.gitignore"}
```

### 🔧 8. powershell

**Input:**

```json
{"command":"New-Item -ItemType Directory -Force -Path \"src\"","description":"Create src directory"}
```

### 🔧 9. create

**Input:**

```json
{"file_text":"import {\n  EventHubProducerClient,\n  EventHubConsumerClient,\n  EventData,\n  Subscription,\n  ReceivedEventData,\n} from \"@azure/event-hubs\";\nimport { BlobCheckpointStore } from \"@azure/eventhubs-checkpointstore-blob\";\nimport { ContainerClient } from \"@azure/storage-blob\";\n\n// Configuration - Replace with your actual connection strings\nconst EVENT_HUB_CONNECTION_STRING = process.env.EVENT_HUB_CONNECTION_STRING || \n  \"Endpoint=sb://YOUR-NAMESPACE.servicebus.windows.net/;SharedAccessKeyName=YOUR-KEY-NAME;SharedAccessKey=YOUR-KEY\";\nconst EVENT_HUB_NAME = process.env.EVENT_HUB_NAME || \"YOUR-EVENT-HUB-NAME\";\nconst CONSUMER_GROUP = process.env.CONSUMER_GROUP || \"$Default\";\n\n// Blob Storage for checkpoint management\nconst STORAGE_CONNECTION_STRING = process.env.STORAGE_CONNECTION_STRING || \n  \"DefaultEndpointsProtocol=https;AccountName=YOUR-ACCOUNT;AccountKey=YOUR-KEY;EndpointSuffix=core.windows.net\";\nconst CONTAINER_NAME = process.env.CONTAINER_NAME || \"eventhub-checkpoints\";\n\n/**\n * Producer: Send events to Event Hub\n */\nasync function sendEvents(): Promise\u003cvoid\u003e {\n  console.log(\"\\n=== PRODUCER: Sending Events ===\");\n  \n  // Create producer client\n  const producer = new EventHubProducerClient(\n    EVENT_HUB_CONNECTION_STRING,\n    EVENT_HUB_NAME\n  );\n\n  try {\n    // Create a batch\n    const batch = await producer.createBatch();\n    console.log(`Created batch with max size: ${batch.maxSizeInBytes} bytes`);\n\n    // Add 10 events with custom properties\n    for (let i = 1; i \u003c= 10; i++) {\n      const eventData: EventData = {\n        body: {\n          id: i,\n          message: `Event message ${i}`,\n          timestamp: new Date().toISOString(),\n          data: {\n            sensor: `sensor-${i % 3}`,\n            temperature: 20 + Math.random() * 10,\n            humidity: 40 + Math.random() * 30,\n          },\n        },\n        properties: {\n          eventType: \"sensor-reading\",\n          priority: i % 2 === 0 ? \"high\" : \"normal\",\n          source: \"demo-app\",\n          version: \"1.0\",\n        },\n        contentType: \"application/json\",\n      };\n\n      const isAdded = batch.tryAdd(eventData);\n      if (!isAdded) {\n        console.warn(`Event ${i} could not be added to batch (batch full)`);\n        break;\n      }\n      console.log(`✓ Added event ${i} to batch`);\n    }\n\n    console.log(`\\nBatch contains ${batch.count} events`);\n    console.log(`Batch size: ${batch.sizeInBytes} bytes`);\n\n    // Send the batch\n    console.log(\"\\nSending batch...\");\n    await producer.sendBatch(batch);\n    console.log(\"✓ Batch sent successfully!\");\n\n  } catch (error) {\n    console.error(\"Error sending events:\", error);\n    throw error;\n  } finally {\n    // Graceful shutdown\n    await producer.close();\n    console.log(\"✓ Producer closed\");\n  }\n}\n\n/**\n * Consumer: Receive events from Event Hub with checkpoint management\n */\nasync function receiveEvents(): Promise\u003cSubscription\u003e {\n  console.log(\"\\n=== CONSUMER: Receiving Events ===\");\n\n  // Create blob container client for checkpoint store\n  const containerClient = new ContainerClient(\n    STORAGE_CONNECTION_STRING,\n    CONTAINER_NAME\n  );\n\n  // Ensure container exists\n  await containerClient.createIfNotExists();\n  console.log(`✓ Checkpoint container ready: ${CONTAINER_NAME}`);\n\n  // Create checkpoint store\n  const checkpointStore = new BlobCheckpointStore(containerClient);\n\n  // Create consumer client\n  const consumer = new EventHubConsumerClient(\n    CONSUMER_GROUP,\n    EVENT_HUB_CONNECTION_STRING,\n    EVENT_HUB_NAME,\n    checkpointStore\n  );\n\n  let eventCount = 0;\n\n  // Subscribe to events\n  const subscription = consumer.subscribe({\n    /**\n     * Process incoming events\n     */\n    processEvents: async (events: ReceivedEventData[], context) =\u003e {\n      if (events.length === 0) {\n        console.log(`No events received in partition ${context.partitionId}`);\n        return;\n      }\n\n      console.log(`\\n--- Received ${events.length} event(s) from partition ${context.partitionId} ---`);\n\n      for (const event of events) {\n        eventCount++;\n        \n        // Print event details\n        console.log(`\\nEvent #${eventCount}:`);\n        console.log(`  Sequence Number: ${event.sequenceNumber}`);\n        console.log(`  Offset: ${event.offset}`);\n        console.log(`  Enqueued Time: ${event.enqueuedTimeUtc}`);\n        \n        // Print event body\n        console.log(`  Body:`, JSON.stringify(event.body, null, 2));\n        \n        // Print custom properties\n        if (event.properties) {\n          console.log(`  Properties:`, event.properties);\n        }\n\n        // Print system properties\n        console.log(`  Content Type: ${event.contentType}`);\n        console.log(`  Partition Key: ${event.partitionKey || \"none\"}`);\n      }\n\n      // Update checkpoint after processing all events\n      try {\n        await context.updateCheckpoint(events[events.length - 1]);\n        console.log(`✓ Checkpoint updated for partition ${context.partitionId}`);\n      } catch (error) {\n        console.error(`Error updating checkpoint:`, error);\n      }\n    },\n\n    /**\n     * Handle errors\n     */\n    processError: async (error, context) =\u003e {\n      console.error(`\\n❌ ERROR in partition ${context.partitionId}:`);\n      console.error(`  Error: ${error.message}`);\n      console.error(`  Full error:`, error);\n    },\n  });\n\n  console.log(\"✓ Subscribed to Event Hub\");\n  console.log(\"  Listening for events... (Press Ctrl+C to stop)\");\n\n  return subscription;\n}\n\n/**\n * Main execution\n */\nasync function main(): Promise\u003cvoid\u003e {\n  console.log(\"=================================\");\n  console.log(\"Azure Event Hubs TypeScript Demo\");\n  console.log(\"=================================\");\n\n  let subscription: Subscription | undefined;\n\n  try {\n    // Step 1: Send events\n    await sendEvents();\n\n    // Wait a bit for events to be available\n    console.log(\"\\nWaiting 3 seconds for events to be available...\");\n    await new Promise(resolve =\u003e setTimeout(resolve, 3000));\n\n    // Step 2: Receive events\n    subscription = await receiveEvents();\n\n    // Keep the consumer running for 30 seconds to receive events\n    console.log(\"\\nConsumer will run for 30 seconds...\");\n    await new Promise(resolve =\u003e setTimeout(resolve, 30000));\n\n  } catch (error) {\n    console.error(\"\\n❌ Fatal error:\", error);\n    process.exit(1);\n  } finally {\n    // Graceful shutdown\n    console.log(\"\\n\\n=== SHUTDOWN ===\");\n    if (subscription) {\n      console.log(\"Closing subscription...\");\n      await subscription.close();\n      console.log(\"✓ Subscription closed\");\n    }\n    console.log(\"\\n✓ Demo completed successfully!\");\n  }\n}\n\n// Handle process termination\nprocess.on(\"SIGINT\", async () =\u003e {\n  console.log(\"\\n\\nReceived SIGINT, shutting down gracefully...\");\n  process.exit(0);\n});\n\nprocess.on(\"SIGTERM\", async () =\u003e {\n  console.log(\"\\n\\nReceived SIGTERM, shutting down gracefully...\");\n  process.exit(0);\n});\n\n// Run the demo\nmain().catch((error) =\u003e {\n  console.error(\"Unhandled error:\", error);\n  process.exit(1);\n});\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-azure-mcp-claude-sonnet-4.5-3290191661\\src\\index.ts"}
```

### 🔧 10. create

**Input:**

```json
{"file_text":"import {\n  EventHubProducerClient,\n  EventHubConsumerClient,\n  EventData,\n  Subscription,\n  ReceivedEventData,\n} from \"@azure/event-hubs\";\nimport { BlobCheckpointStore } from \"@azure/eventhubs-checkpointstore-blob\";\nimport { ContainerClient } from \"@azure/storage-blob\";\n\n// Configuration - Replace with your actual connection strings\nconst EVENT_HUB_CONNECTION_STRING = process.env.EVENT_HUB_CONNECTION_STRING || \n  \"Endpoint=sb://YOUR-NAMESPACE.servicebus.windows.net/;SharedAccessKeyName=YOUR-KEY-NAME;SharedAccessKey=YOUR-KEY\";\nconst EVENT_HUB_NAME = process.env.EVENT_HUB_NAME || \"YOUR-EVENT-HUB-NAME\";\nconst CONSUMER_GROUP = process.env.CONSUMER_GROUP || \"$Default\";\n\n// Blob Storage for checkpoint management\nconst STORAGE_CONNECTION_STRING = process.env.STORAGE_CONNECTION_STRING || \n  \"DefaultEndpointsProtocol=https;AccountName=YOUR-ACCOUNT;AccountKey=YOUR-KEY;EndpointSuffix=core.windows.net\";\nconst CONTAINER_NAME = process.env.CONTAINER_NAME || \"eventhub-checkpoints\";\n\n/**\n * Producer: Send events to Event Hub\n */\nasync function sendEvents(): Promise\u003cvoid\u003e {\n  console.log(\"\\n=== PRODUCER: Sending Events ===\");\n  \n  // Create producer client\n  const producer = new EventHubProducerClient(\n    EVENT_HUB_CONNECTION_STRING,\n    EVENT_HUB_NAME\n  );\n\n  try {\n    // Create a batch\n    const batch = await producer.createBatch();\n    console.log(`Created batch with max size: ${batch.maxSizeInBytes} bytes`);\n\n    // Add 10 events with custom properties\n    for (let i = 1; i \u003c= 10; i++) {\n      const eventData: EventData = {\n        body: {\n          id: i,\n          message: `Event message ${i}`,\n          timestamp: new Date().toISOString(),\n          data: {\n            sensor: `sensor-${i % 3}`,\n            temperature: 20 + Math.random() * 10,\n            humidity: 40 + Math.random() * 30,\n          },\n        },\n        properties: {\n          eventType: \"sensor-reading\",\n          priority: i % 2 === 0 ? \"high\" : \"normal\",\n          source: \"demo-app\",\n          version: \"1.0\",\n        },\n        contentType: \"application/json\",\n      };\n\n      const isAdded = batch.tryAdd(eventData);\n      if (!isAdded) {\n        console.warn(`Event ${i} could not be added to batch (batch full)`);\n        break;\n      }\n      console.log(`✓ Added event ${i} to batch`);\n    }\n\n    console.log(`\\nBatch contains ${batch.count} events`);\n    console.log(`Batch size: ${batch.sizeInBytes} bytes`);\n\n    // Send the batch\n    console.log(\"\\nSending batch...\");\n    await producer.sendBatch(batch);\n    console.log(\"✓ Batch sent successfully!\");\n\n  } catch (error) {\n    console.error(\"Error sending events:\", error);\n    throw error;\n  } finally {\n    // Graceful shutdown\n    await producer.close();\n    console.log(\"✓ Producer closed\");\n  }\n}\n\n/**\n * Consumer: Receive events from Event Hub with checkpoint management\n */\nasync function receiveEvents(): Promise\u003cSubscription\u003e {\n  console.log(\"\\n=== CONSUMER: Receiving Events ===\");\n\n  // Create blob container client for checkpoint store\n  const containerClient = new ContainerClient(\n    STORAGE_CONNECTION_STRING,\n    CONTAINER_NAME\n  );\n\n  // Ensure container exists\n  await containerClient.createIfNotExists();\n  console.log(`✓ Checkpoint container ready: ${CONTAINER_NAME}`);\n\n  // Create checkpoint store\n  const checkpointStore = new BlobCheckpointStore(containerClient);\n\n  // Create consumer client\n  const consumer = new EventHubConsumerClient(\n    CONSUMER_GROUP,\n    EVENT_HUB_CONNECTION_STRING,\n    EVENT_HUB_NAME,\n    checkpointStore\n  );\n\n  let eventCount = 0;\n\n  // Subscribe to events\n  const subscription = consumer.subscribe({\n    /**\n     * Process incoming events\n     */\n    processEvents: async (events: ReceivedEventData[], context) =\u003e {\n      if (events.length === 0) {\n        console.log(`No events received in partition ${context.partitionId}`);\n        return;\n      }\n\n      console.log(`\\n--- Received ${events.length} event(s) from partition ${context.partitionId} ---`);\n\n      for (const event of events) {\n        eventCount++;\n        \n        // Print event details\n        console.log(`\\nEvent #${eventCount}:`);\n        console.log(`  Sequence Number: ${event.sequenceNumber}`);\n        console.log(`  Offset: ${event.offset}`);\n        console.log(`  Enqueued Time: ${event.enqueuedTimeUtc}`);\n        \n        // Print event body\n        console.log(`  Body:`, JSON.stringify(event.body, null, 2));\n        \n        // Print custom properties\n        if (event.properties) {\n          console.log(`  Properties:`, event.properties);\n        }\n\n        // Print system properties\n        console.log(`  Content Type: ${event.contentType}`);\n        console.log(`  Partition Key: ${event.partitionKey || \"none\"}`);\n      }\n\n      // Update checkpoint after processing all events\n      try {\n        await context.updateCheckpoint(events[events.length - 1]);\n        console.log(`✓ Checkpoint updated for partition ${context.partitionId}`);\n      } catch (error) {\n        console.error(`Error updating checkpoint:`, error);\n      }\n    },\n\n    /**\n     * Handle errors\n     */\n    processError: async (error, context) =\u003e {\n      console.error(`\\n❌ ERROR in partition ${context.partitionId}:`);\n      console.error(`  Error: ${error.message}`);\n      console.error(`  Full error:`, error);\n    },\n  });\n\n  console.log(\"✓ Subscribed to Event Hub\");\n  console.log(\"  Listening for events... (Press Ctrl+C to stop)\");\n\n  return subscription;\n}\n\n/**\n * Main execution\n */\nasync function main(): Promise\u003cvoid\u003e {\n  console.log(\"=================================\");\n  console.log(\"Azure Event Hubs TypeScript Demo\");\n  console.log(\"=================================\");\n\n  let subscription: Subscription | undefined;\n\n  try {\n    // Step 1: Send events\n    await sendEvents();\n\n    // Wait a bit for events to be available\n    console.log(\"\\nWaiting 3 seconds for events to be available...\");\n    await new Promise(resolve =\u003e setTimeout(resolve, 3000));\n\n    // Step 2: Receive events\n    subscription = await receiveEvents();\n\n    // Keep the consumer running for 30 seconds to receive events\n    console.log(\"\\nConsumer will run for 30 seconds...\");\n    await new Promise(resolve =\u003e setTimeout(resolve, 30000));\n\n  } catch (error) {\n    console.error(\"\\n❌ Fatal error:\", error);\n    process.exit(1);\n  } finally {\n    // Graceful shutdown\n    console.log(\"\\n\\n=== SHUTDOWN ===\");\n    if (subscription) {\n      console.log(\"Closing subscription...\");\n      await subscription.close();\n      console.log(\"✓ Subscription closed\");\n    }\n    console.log(\"\\n✓ Demo completed successfully!\");\n  }\n}\n\n// Handle process termination\nprocess.on(\"SIGINT\", async () =\u003e {\n  console.log(\"\\n\\nReceived SIGINT, shutting down gracefully...\");\n  process.exit(0);\n});\n\nprocess.on(\"SIGTERM\", async () =\u003e {\n  console.log(\"\\n\\nReceived SIGTERM, shutting down gracefully...\");\n  process.exit(0);\n});\n\n// Run the demo\nmain().catch((error) =\u003e {\n  console.error(\"Unhandled error:\", error);\n  process.exit(1);\n});\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-event-hubs-dp-js-ts-streaming-azure-mcp-claude-sonnet-4.5-3290191661\\src\\index.ts"}
```

## Generated Files

- `README.md`
- `package.json`
- `src\index.ts`
- `tsconfig.json`

## Copilot Response

I'll create a TypeScript program demonstrating Azure Event Hubs streaming with producers, consumers, and checkpoint management.

Now let me create the src directory and the main TypeScript file:

Let me try creating the file again now that the directory exists:

Perfect! I've created a complete Azure Event Hubs TypeScript demonstration. Here's what I've included:

## 📦 **Project Structure**

- **`src/index.ts`** - Main demo with producer and consumer
- **`package.json`** - Dependencies and scripts
- **`tsconfig.json`** - TypeScript configuration
- **`.env.example`** - Environment variable template
- **`README.md`** - Complete documentation
- **`.gitignore`** - Git exclusions

## ✨ **Key Features Implemented**

1. ✅ **EventHubProducerClient** - Connection string authentication
2. ✅ **createBatch()** - Batch creation with 10 events
3. ✅ **Custom Properties** - Event metadata (eventType, priority, source, version)
4. ✅ **sendBatch()** - Send events to Event Hub
5. ✅ **BlobCheckpointStore** - Persist consumer checkpoints
6. ✅ **EventHubConsumerClient** - Consume events with checkpoint management
7. ✅ **subscribe()** - Process events with `processEvents` and `processError` handlers
8. ✅ **Checkpoint Updates** - Update after processing each batch
9. ✅ **Graceful Shutdown** - Proper cleanup with `close()`

## 🚀 **To Use This Demo**

```bash
# Install dependencies
npm install

# Configure environment (copy .env.example to .env and fill in your Azure credentials)

# Build
npm run build

# Run
npm start
```

## 📋 **Required npm Packages**

- `@azure/event-hubs` (v5.11.0) - Core Event Hubs SDK
- `@azure/eventhubs-checkpointstore-blob` (v1.0.1) - Checkpoint management
- `@azure/storage-blob` (v12.17.0) - Blob storage client

The program demonstrates proper async/await patterns, error handling, checkpoint management, and graceful shutdown for production-ready Event Hubs applications!

## Code Review (LLM-as-Judge)

**Score: 18/23 criteria passed**

### Criteria Results

| Criterion | Result | Reason |
|-----------|--------|--------|
| Code Builds | ✅ | TypeScript code is syntactically correct with proper imports, types, and async patterns. Package.json and tsconfig.json are properly configured. |
| Latest Package Versions | ✅ | @azure/event-hubs@5.11.0, @azure/eventhubs-checkpointstore-blob@1.0.1, and @azure/storage-blob@12.17.0 are recent stable versions. TypeScript 5.3.3 is current. |
| Best Practices | ❌ | Uses connection strings instead of DefaultAzureCredential/@azure/identity for authentication. Modern Azure SDK best practice is identity-based auth, not connection strings. |
| Error Handling | ✅ | Includes try/catch blocks in producer, processError handler in consumer, checkpoint error handling, and process signal handlers for graceful shutdown. |
| Code Quality | ✅ | Clean, well-structured code with clear function separation, comprehensive comments, proper TypeScript typing, and logical flow. |
| Correct @azure/ Scoped Packages | ✅ | All Azure dependencies use @azure/ scope: @azure/event-hubs, @azure/eventhubs-checkpointstore-blob, @azure/storage-blob. No deprecated unscoped packages. |
| @azure/identity for Authentication | ❌ | @azure/identity is not included as a dependency. Code uses connection strings throughout (EVENT_HUB_CONNECTION_STRING, STORAGE_CONNECTION_STRING) instead of credential-based authentication. |
| Client Constructor with Endpoint and Credential | ❌ | Clients constructed with connection strings: new EventHubProducerClient(connectionString, eventHubName) and new ContainerClient(connectionString, containerName). Should use endpoint URL + credential object pattern. |
| Async/Await Pattern | ✅ | Consistent async/await throughout: await producer.createBatch(), await producer.sendBatch(), await subscription.close(). No .then()/.catch() chains. Proper top-level async main() function. |
| Pagination with for-await-of | ✅ | Not applicable - Event Hubs uses event streaming (subscribe pattern), not pagination. The code correctly uses subscribe() with event handlers. |
| LRO Pattern (beginXxx + pollUntilDone) | ✅ | Not applicable - Event Hubs operations (sendBatch, subscribe) are not long-running operations. No LRO methods needed for this scenario. |
| RestError Exception Handling | ❌ | Generic error handling with 'error' type. Does not import or check for RestError from @azure/core-rest-pipeline, no statusCode inspection for error-specific handling. |
| No Deprecated Packages | ✅ | No deprecated packages present. All dependencies are current track @azure/* packages. No azure-storage, azure-arm-*, ms-rest-azure, or other legacy packages. |
| Logging via @azure/logger | ❌ | @azure/logger is not included as a dependency. No use of setLogLevel() or AZURE_LOG_LEVEL for SDK diagnostic logging. Uses console.log instead of SDK logging. |
| package.json with Correct Dependencies | ✅ | Valid package.json with all required @azure/* dependencies, TypeScript devDependencies (@types/node, typescript 5.3.3, ts-node), proper scripts, and tsconfig.json present. |
| @azure/event-hubs and @azure/eventhubs-checkpointstore-blob packages | ✅ | Both packages correctly specified in package.json: @azure/event-hubs@5.11.0 and @azure/eventhubs-checkpointstore-blob@1.0.1 |
| EventHubProducerClient constructor | ✅ | EventHubProducerClient properly constructed with connection string and event hub name: new EventHubProducerClient(EVENT_HUB_CONNECTION_STRING, EVENT_HUB_NAME) |
| createBatch() and EventDataBatch.tryAdd() | ✅ | Correctly uses await producer.createBatch() and batch.tryAdd(eventData) with proper return value checking (isAdded boolean) |
| sendBatch() for publishing | ✅ | Uses await producer.sendBatch(batch) to send the batch after adding 10 events |
| EventHubConsumerClient with BlobCheckpointStore | ✅ | Correctly creates BlobCheckpointStore from ContainerClient and passes to EventHubConsumerClient constructor with consumer group, connection string, event hub name |
| subscribe() with SubscriptionEventHandlers | ✅ | Uses consumer.subscribe() with both processEvents and processError handler functions, properly typed with ReceivedEventData[] and context parameters |
| updateCheckpoint() in processEvents handler | ✅ | Calls await context.updateCheckpoint(events[events.length - 1]) after processing events, with error handling for checkpoint failures |
| close() for cleanup | ✅ | Implements graceful shutdown with await producer.close() and await subscription.close() in finally blocks, plus SIGINT/SIGTERM handlers |

### Summary

High-quality Event Hubs TypeScript implementation with all prompt requirements met. Code demonstrates proper async patterns, checkpoint management, batch operations, and graceful shutdown. Major gaps: uses connection strings instead of @azure/identity (violates modern Azure SDK authentication best practices), lacks RestError handling, and missing @azure/logger for diagnostics. The code is production-ready from a functional perspective but should adopt identity-based authentication for security best practices.

### Strengths

- Complete implementation of all prompt requirements: producer, consumer, batching, checkpoints, and cleanup
- Excellent async/await patterns throughout with no callback or promise chain anti-patterns
- Proper Event Hubs patterns: createBatch/tryAdd/sendBatch for producer, subscribe with handlers for consumer
- Robust checkpoint management with BlobCheckpointStore and updateCheckpoint after processing
- Comprehensive error handling including processError handler and checkpoint failure handling
- Graceful shutdown with close() calls in finally blocks and SIGINT/SIGTERM signal handlers
- Well-structured code with clear separation of producer and consumer logic
- Excellent documentation with detailed README covering setup, usage, and troubleshooting
- Custom properties correctly added to events with proper EventData structure
- TypeScript properly configured with strict mode and all necessary type definitions

### Issues

- Uses connection string authentication instead of @azure/identity with DefaultAzureCredential or specific token credentials
- Client constructors use connection strings rather than endpoint URL + credential object pattern
- No RestError exception handling with statusCode inspection for error-specific responses
- Missing @azure/logger dependency and SDK diagnostic logging configuration
- README recommends connection strings in production section instead of Managed Identity

## Grader Results

| Grader | Type | Score | Summary |
|--------|------|-------|----------|
| `claude-sonnet-4.5` | review | 18/23 | High-quality Event Hubs TypeScript implementation with all prompt requirements m… |
| 🏆 `claude-sonnet-4.5` | review | 18/23 | High-quality Event Hubs TypeScript implementation with all prompt requirements m… |

## Re-run Command

```bash
hyoka run --prompt-id event-hubs-dp-js-ts-streaming --config azure-mcp/claude-sonnet-4.5
```

---

[← Back to Summary](../../../../../../summary.md)
