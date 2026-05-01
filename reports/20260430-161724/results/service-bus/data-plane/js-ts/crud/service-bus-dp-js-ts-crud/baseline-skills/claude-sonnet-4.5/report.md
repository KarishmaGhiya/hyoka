# Evaluation Report: service-bus-dp-js-ts-crud

**Config:** baseline-skills/claude-sonnet-4.5 | **Result:** ❌ FAILED | **Duration:** 87.1s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `service-bus-dp-js-ts-crud` |
| Config | baseline-skills/claude-sonnet-4.5 |
| Result | ❌ FAILED |
| Duration | 87.1s |
| Timestamp | 2026-04-30T23:30:35Z |
| Files Generated | 0 |
| Event Count | 76 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 87.0s |
| **Total** | **87.1s** |

## Configuration

- **name:** baseline-skills/claude-sonnet-4.5
- **model:** claude-sonnet-4.5

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-sonnet-4.5 |
| Skills Loaded | customize-cloud-agent |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=69157 out=7597 |
| Turn Count | 3 |

## Error

```
0 files generated despite 5 file-write tool attempts
```

## Prompt Sent

```
Write a TypeScript program
that demonstrates messaging with Azure Service Bus:
1. Create a ServiceBusClient using a connection string
2. Create a sender for a queue and send a single message
3. Send a batch of 5 messages using createMessageBatch() and tryAddMessage()
4. Create a receiver and receive messages using receiveMessages()
5. Complete a message with completeMessage() after processing
6. Subscribe to messages using subscribe() with processMessage and processError handlers
7. Demonstrate sending to a topic and receiving from a subscription

Show required npm package (@azure/service-bus) and proper close() cleanup.
```

## Copilot Reasoning

The user wants a TypeScript program demonstrating Azure Service Bus messaging operations. This is a straightforward request to create a single file with example code showing various Service Bus features.

Let me create a comprehensive TypeScript file that demonstrates:
1. Creating ServiceBusClient with connection string
2. Sending a single message
3. Sending a batch of messages
4. Receiving messages with receiveMessages()
5. Completing messages
6. Subscribe pattern with handlers
7. Topic/subscription messaging
8. Proper cleanup

I should also mention the required npm package and provide clear instructions.

This is not a plan mode request, so I should just implement it directly.

## Tool Calls

### 🔧 1. report_intent

**Input:**

```json
{"intent":"Creating Service Bus demo"}
```

### 🔧 2. create

**Input:**

```json
{"file_text":"/**\n * Azure Service Bus TypeScript Demo\n * \n * Required package: @azure/service-bus\n * Install: npm install @azure/service-bus\n */\n\nimport {\n  ServiceBusClient,\n  ServiceBusMessage,\n  ServiceBusReceiver,\n  ServiceBusSender,\n  ProcessErrorArgs,\n  ProcessMessageArgs\n} from \"@azure/service-bus\";\n\n// Configuration - replace with your actual values\nconst connectionString = process.env.SERVICE_BUS_CONNECTION_STRING || \n  \"Endpoint=sb://\u003cnamespace\u003e.servicebus.windows.net/;SharedAccessKeyName=\u003ckey-name\u003e;SharedAccessKey=\u003ckey\u003e\";\nconst queueName = \"demo-queue\";\nconst topicName = \"demo-topic\";\nconst subscriptionName = \"demo-subscription\";\n\n/**\n * 1. Create ServiceBusClient using connection string\n */\nfunction createClient(): ServiceBusClient {\n  console.log(\"Creating ServiceBusClient...\");\n  return new ServiceBusClient(connectionString);\n}\n\n/**\n * 2. Send a single message to a queue\n */\nasync function sendSingleMessage(client: ServiceBusClient): Promise\u003cvoid\u003e {\n  console.log(\"\\n=== Sending Single Message ===\");\n  \n  const sender: ServiceBusSender = client.createSender(queueName);\n  \n  try {\n    const message: ServiceBusMessage = {\n      body: { text: \"Hello from Azure Service Bus!\" },\n      contentType: \"application/json\",\n      subject: \"greeting\",\n      messageId: \"msg-1\"\n    };\n    \n    await sender.sendMessages(message);\n    console.log(`✓ Sent single message: ${message.messageId}`);\n  } finally {\n    await sender.close();\n  }\n}\n\n/**\n * 3. Send a batch of messages using createMessageBatch() and tryAddMessage()\n */\nasync function sendBatchMessages(client: ServiceBusClient): Promise\u003cvoid\u003e {\n  console.log(\"\\n=== Sending Batch of Messages ===\");\n  \n  const sender: ServiceBusSender = client.createSender(queueName);\n  \n  try {\n    // Create a batch\n    const batch = await sender.createMessageBatch();\n    \n    // Try to add 5 messages to the batch\n    for (let i = 1; i \u003c= 5; i++) {\n      const message: ServiceBusMessage = {\n        body: { \n          text: `Batch message ${i}`,\n          timestamp: new Date().toISOString()\n        },\n        contentType: \"application/json\",\n        messageId: `batch-msg-${i}`\n      };\n      \n      const added = batch.tryAddMessage(message);\n      \n      if (!added) {\n        console.log(`✗ Message ${i} was too large and couldn't be added to batch`);\n      } else {\n        console.log(`✓ Added message ${i} to batch`);\n      }\n    }\n    \n    // Send the batch\n    await sender.sendMessages(batch);\n    console.log(`✓ Sent batch with ${batch.count} messages`);\n  } finally {\n    await sender.close();\n  }\n}\n\n/**\n * 4 \u0026 5. Receive messages using receiveMessages() and complete them\n */\nasync function receiveAndCompleteMessages(client: ServiceBusClient): Promise\u003cvoid\u003e {\n  console.log(\"\\n=== Receiving and Completing Messages ===\");\n  \n  const receiver: ServiceBusReceiver = client.createReceiver(queueName);\n  \n  try {\n    // Receive up to 10 messages (will wait up to 10 seconds)\n    const messages = await receiver.receiveMessages(10, { maxWaitTimeInMs: 10000 });\n    \n    console.log(`✓ Received ${messages.length} message(s)`);\n    \n    // Process and complete each message\n    for (const message of messages) {\n      console.log(`\\nProcessing message:`);\n      console.log(`  ID: ${message.messageId}`);\n      console.log(`  Body: ${JSON.stringify(message.body)}`);\n      console.log(`  Delivery count: ${message.deliveryCount}`);\n      \n      // Simulate processing\n      await processMessage(message.body);\n      \n      // Complete the message (removes it from the queue)\n      await receiver.completeMessage(message);\n      console.log(`  ✓ Message completed`);\n    }\n  } finally {\n    await receiver.close();\n  }\n}\n\n/**\n * 6. Subscribe to messages with processMessage and processError handlers\n */\nasync function subscribeToMessages(client: ServiceBusClient): Promise\u003cvoid\u003e {\n  console.log(\"\\n=== Subscribing to Messages ===\");\n  \n  const receiver: ServiceBusReceiver = client.createReceiver(queueName);\n  \n  // Message handler\n  const processMessage = async (messageArgs: ProcessMessageArgs): Promise\u003cvoid\u003e =\u003e {\n    console.log(`\\n[Subscription] Received message:`);\n    console.log(`  ID: ${messageArgs.message.messageId}`);\n    console.log(`  Body: ${JSON.stringify(messageArgs.message.body)}`);\n    \n    // Process the message\n    await processMessage(messageArgs.message.body);\n    \n    // Complete the message\n    await messageArgs.completeMessage();\n    console.log(`  ✓ Message completed via subscription`);\n  };\n  \n  // Error handler\n  const processError = async (errorArgs: ProcessErrorArgs): Promise\u003cvoid\u003e =\u003e {\n    console.error(`[Subscription] Error from source ${errorArgs.errorSource}:`);\n    console.error(errorArgs.error);\n  };\n  \n  // Subscribe to messages\n  const subscription = receiver.subscribe({\n    processMessage,\n    processError\n  });\n  \n  console.log(\"✓ Subscribed to queue. Listening for messages...\");\n  console.log(\"  (Will listen for 20 seconds)\");\n  \n  // Wait for 20 seconds to receive messages\n  await new Promise(resolve =\u003e setTimeout(resolve, 20000));\n  \n  // Close the subscription\n  await subscription.close();\n  await receiver.close();\n  console.log(\"✓ Subscription closed\");\n}\n\n/**\n * 7. Demonstrate sending to a topic and receiving from a subscription\n */\nasync function topicSubscriptionDemo(client: ServiceBusClient): Promise\u003cvoid\u003e {\n  console.log(\"\\n=== Topic and Subscription Demo ===\");\n  \n  // Send messages to topic\n  const topicSender: ServiceBusSender = client.createSender(topicName);\n  \n  try {\n    console.log(\"\\nSending messages to topic...\");\n    \n    for (let i = 1; i \u003c= 3; i++) {\n      const message: ServiceBusMessage = {\n        body: { \n          text: `Topic message ${i}`,\n          category: i % 2 === 0 ? \"even\" : \"odd\"\n        },\n        contentType: \"application/json\",\n        messageId: `topic-msg-${i}`,\n        subject: \"topic-demo\"\n      };\n      \n      await topicSender.sendMessages(message);\n      console.log(`✓ Sent message ${i} to topic`);\n    }\n  } finally {\n    await topicSender.close();\n  }\n  \n  // Receive from subscription\n  const subscriptionReceiver: ServiceBusReceiver = client.createReceiver(\n    topicName,\n    subscriptionName\n  );\n  \n  try {\n    console.log(\"\\nReceiving messages from subscription...\");\n    \n    const messages = await subscriptionReceiver.receiveMessages(10, { \n      maxWaitTimeInMs: 10000 \n    });\n    \n    console.log(`✓ Received ${messages.length} message(s) from subscription`);\n    \n    for (const message of messages) {\n      console.log(`\\n  Message ID: ${message.messageId}`);\n      console.log(`  Body: ${JSON.stringify(message.body)}`);\n      \n      await subscriptionReceiver.completeMessage(message);\n      console.log(`  ✓ Completed`);\n    }\n  } finally {\n    await subscriptionReceiver.close();\n  }\n}\n\n/**\n * Simulate message processing\n */\nasync function processMessage(messageBody: any): Promise\u003cvoid\u003e {\n  // Simulate some processing time\n  await new Promise(resolve =\u003e setTimeout(resolve, 100));\n  // In real scenario, you would process the message here\n}\n\n/**\n * Main execution function\n */\nasync function main(): Promise\u003cvoid\u003e {\n  console.log(\"╔════════════════════════════════════════════╗\");\n  console.log(\"║   Azure Service Bus TypeScript Demo      ║\");\n  console.log(\"╚════════════════════════════════════════════╝\");\n  \n  let client: ServiceBusClient | undefined;\n  \n  try {\n    // Create client\n    client = createClient();\n    \n    // Run demonstrations\n    await sendSingleMessage(client);\n    await sendBatchMessages(client);\n    await receiveAndCompleteMessages(client);\n    await subscribeToMessages(client);\n    \n    // Topic/Subscription demo (requires topic and subscription to exist)\n    try {\n      await topicSubscriptionDemo(client);\n    } catch (error) {\n      console.log(\"\\n⚠ Topic/Subscription demo skipped (entities may not exist)\");\n      console.log(`  Error: ${error instanceof Error ? error.message : error}`);\n    }\n    \n    console.log(\"\\n✓ All demonstrations completed successfully!\");\n    \n  } catch (error) {\n    console.error(\"\\n✗ Error occurred:\");\n    console.error(error);\n    throw error;\n  } finally {\n    // Always close the client to clean up resources\n    if (client) {\n      console.log(\"\\nClosing ServiceBusClient...\");\n      await client.close();\n      console.log(\"✓ Client closed\");\n    }\n  }\n}\n\n// Run the demo\nif (require.main === module) {\n  main()\n    .then(() =\u003e {\n      console.log(\"\\n✓ Program completed successfully\");\n      process.exit(0);\n    })\n    .catch((error) =\u003e {\n      console.error(\"\\n✗ Program failed:\", error);\n      process.exit(1);\n    });\n}\n\nexport {\n  createClient,\n  sendSingleMessage,\n  sendBatchMessages,\n  receiveAndCompleteMessages,\n  subscribeToMessages,\n  topicSubscriptionDemo\n};\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-service-bus-dp-js-ts-crud-baseline-skills-claude-sonnet-4.5-1228062183\\azure-service-bus-demo.ts"}
```

### 🔧 3. create

**Input:**

```json
{"file_text":"{\n  \"name\": \"azure-service-bus-demo\",\n  \"version\": \"1.0.0\",\n  \"description\": \"Azure Service Bus TypeScript demonstration\",\n  \"main\": \"azure-service-bus-demo.ts\",\n  \"scripts\": {\n    \"build\": \"tsc\",\n    \"start\": \"ts-node azure-service-bus-demo.ts\",\n    \"dev\": \"ts-node-dev --respawn azure-service-bus-demo.ts\"\n  },\n  \"keywords\": [\n    \"azure\",\n    \"service-bus\",\n    \"messaging\",\n    \"typescript\"\n  ],\n  \"dependencies\": {\n    \"@azure/service-bus\": \"^7.9.0\"\n  },\n  \"devDependencies\": {\n    \"@types/node\": \"^20.0.0\",\n    \"ts-node\": \"^10.9.0\",\n    \"ts-node-dev\": \"^2.0.0\",\n    \"typescript\": \"^5.0.0\"\n  }\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-service-bus-dp-js-ts-crud-baseline-skills-claude-sonnet-4.5-1228062183\\package.json"}
```

### 🔧 4. create

**Input:**

```json
{"file_text":"{\n  \"compilerOptions\": {\n    \"target\": \"ES2020\",\n    \"module\": \"commonjs\",\n    \"lib\": [\"ES2020\"],\n    \"outDir\": \"./dist\",\n    \"rootDir\": \"./\",\n    \"strict\": true,\n    \"esModuleInterop\": true,\n    \"skipLibCheck\": true,\n    \"forceConsistentCasingInFileNames\": true,\n    \"resolveJsonModule\": true,\n    \"moduleResolution\": \"node\"\n  },\n  \"include\": [\"*.ts\"],\n  \"exclude\": [\"node_modules\", \"dist\"]\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-service-bus-dp-js-ts-crud-baseline-skills-claude-sonnet-4.5-1228062183\\tsconfig.json"}
```

### 🔧 5. create

**Input:**

```json
{"file_text":"# Azure Service Bus TypeScript Demo\n\nA comprehensive demonstration of Azure Service Bus messaging operations in TypeScript.\n\n## Features Demonstrated\n\n1. **ServiceBusClient Creation** - Initialize client with connection string\n2. **Single Message** - Send individual messages to a queue\n3. **Batch Messages** - Send multiple messages using `createMessageBatch()` and `tryAddMessage()`\n4. **Receive Messages** - Use `receiveMessages()` to pull messages\n5. **Complete Messages** - Process and complete messages with `completeMessage()`\n6. **Subscribe Pattern** - Use `subscribe()` with `processMessage` and `processError` handlers\n7. **Topics/Subscriptions** - Demonstrate pub/sub pattern with topics and subscriptions\n\n## Prerequisites\n\n- Node.js 16+ and npm\n- Azure Service Bus namespace\n- A queue named `demo-queue`\n- (Optional) A topic named `demo-topic` with subscription `demo-subscription`\n\n## Installation\n\n```bash\nnpm install\n```\n\n## Configuration\n\nSet your Service Bus connection string:\n\n```bash\n# Linux/macOS\nexport SERVICE_BUS_CONNECTION_STRING=\"Endpoint=sb://\u003cnamespace\u003e.servicebus.windows.net/;SharedAccessKeyName=\u003ckey-name\u003e;SharedAccessKey=\u003ckey\u003e\"\n\n# Windows (PowerShell)\n$env:SERVICE_BUS_CONNECTION_STRING=\"Endpoint=sb://\u003cnamespace\u003e.servicebus.windows.net/;SharedAccessKeyName=\u003ckey-name\u003e;SharedAccessKey=\u003ckey\u003e\"\n\n# Windows (CMD)\nset SERVICE_BUS_CONNECTION_STRING=Endpoint=sb://\u003cnamespace\u003e.servicebus.windows.net/;SharedAccessKeyName=\u003ckey-name\u003e;SharedAccessKey=\u003ckey\u003e\n```\n\nOr edit the connection string directly in `azure-service-bus-demo.ts`.\n\n## Usage\n\nRun with ts-node:\n```bash\nnpm start\n```\n\nOr compile and run:\n```bash\nnpm run build\nnode dist/azure-service-bus-demo.js\n```\n\n## Key Concepts\n\n### Send vs Receive Modes\n\n- **Sender**: `createSender(queueName)` - Sends messages to queue or topic\n- **Receiver**: `createReceiver(queueName)` - Receives messages from queue or subscription\n\n### Message Completion\n\nMessages must be explicitly completed, abandoned, or deadlettered:\n- `completeMessage()` - Successfully processed, remove from queue\n- `abandonMessage()` - Failed processing, requeue for retry\n- `deadLetterMessage()` - Permanently failed, move to dead-letter queue\n\n### Subscription Pattern\n\nThe `subscribe()` method provides continuous message processing:\n- Automatically manages connection and retries\n- Handles messages concurrently\n- Includes error handling\n\n### Batch Operations\n\nUse batching for efficiency when sending multiple messages:\n- `createMessageBatch()` creates a batch respecting size limits\n- `tryAddMessage()` safely adds messages without exceeding limits\n- Send entire batch in single operation\n\n## Required Package\n\n```json\n{\n  \"dependencies\": {\n    \"@azure/service-bus\": \"^7.9.0\"\n  }\n}\n```\n\n## Cleanup\n\nThe demo properly closes all resources:\n- Senders are closed after sending\n- Receivers are closed after receiving\n- Subscriptions are closed after use\n- ServiceBusClient is closed in finally block\n\nThis ensures proper connection cleanup and resource management.\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-service-bus-dp-js-ts-crud-baseline-skills-claude-sonnet-4.5-1228062183\\README.md"}
```

### 🔧 6. create

**Input:**

```json
{"file_text":"# Azure Service Bus Configuration\nSERVICE_BUS_CONNECTION_STRING=Endpoint=sb://\u003cnamespace\u003e.servicebus.windows.net/;SharedAccessKeyName=\u003ckey-name\u003e;SharedAccessKey=\u003ckey\u003e\n\n# Entity Names (modify in azure-service-bus-demo.ts if needed)\n# QUEUE_NAME=demo-queue\n# TOPIC_NAME=demo-topic\n# SUBSCRIPTION_NAME=demo-subscription\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-service-bus-dp-js-ts-crud-baseline-skills-claude-sonnet-4.5-1228062183\\.env.example"}
```

### 🔧 7. powershell

**Input:**

```json
{"command":"Get-Location; Get-ChildItem","description":"Check current directory"}
```

## Copilot Response

I'll create a comprehensive TypeScript program demonstrating Azure Service Bus messaging operations.

I encountered permission errors when trying to create the files. Let me check the current directory and try again:

It appears there's a permission issue in this environment. Let me provide you with the complete code directly that you can save to your local system:

## Azure Service Bus TypeScript Demo

**Required Package:** `@azure/service-bus` (version 7.9.0 or later)

### Installation
```bash
npm install @azure/service-bus
npm install --save-dev typescript @types/node ts-node
```

### Main Program File: `azure-service-bus-demo.ts`

```typescript
/**
 * Azure Service Bus TypeScript Demo
 * 
 * Required package: @azure/service-bus
 * Install: npm install @azure/service-bus
 */

import {
  ServiceBusClient,
  ServiceBusMessage,
  ServiceBusReceiver,
  ServiceBusSender,
  ProcessErrorArgs,
  ProcessMessageArgs
} from "@azure/service-bus";

// Configuration - replace with your actual values
const connectionString = process.env.SERVICE_BUS_CONNECTION_STRING || 
  "Endpoint=sb://<namespace>.servicebus.windows.net/;SharedAccessKeyName=<key-name>;SharedAccessKey=<key>";
const queueName = "demo-queue";
const topicName = "demo-topic";
const subscriptionName = "demo-subscription";

/**
 * 1. Create ServiceBusClient using connection string
 */
function createClient(): ServiceBusClient {
  console.log("Creating ServiceBusClient...");
  return new ServiceBusClient(connectionString);
}

/**
 * 2. Send a single message to a queue
 */
async function sendSingleMessage(client: ServiceBusClient): Promise<void> {
  console.log("\n=== Sending Single Message ===");
  
  const sender: ServiceBusSender = client.createSender(queueName);
  
  try {
    const message: ServiceBusMessage = {
      body: { text: "Hello from Azure Service Bus!" },
      contentType: "application/json",
      subject: "greeting",
      messageId: "msg-1"
    };
    
    await sender.sendMessages(message);
    console.log(`✓ Sent single message: ${message.messageId}`);
  } finally {
    await sender.close();
  }
}

/**
 * 3. Send a batch of messages using createMessageBatch() and tryAddMessage()
 */
async function sendBatchMessages(client: ServiceBusClient): Promise<void> {
  console.log("\n=== Sending Batch of Messages ===");
  
  const sender: ServiceBusSender = client.createSender(queueName);
  
  try {
    // Create a batch
    const batch = await sender.createMessageBatch();
    
    // Try to add 5 messages to the batch
    for (let i = 1; i <= 5; i++) {
      const message: ServiceBusMessage = {
        body: { 
          text: `Batch message ${i}`,
          timestamp: new Date().toISOString()
        },
        contentType: "application/json",
        messageId: `batch-msg-${i}`
      };
      
      const added = batch.tryAddMessage(message);
      
      if (!added) {
        console.log(`✗ Message ${i} was too large and couldn't be added to batch`);
      } else {
        console.log(`✓ Added message ${i} to batch`);
      }
    }
    
    // Send the batch
    await sender.sendMessages(batch);
    console.log(`✓ Sent batch with ${batch.count} messages`);
  } finally {
    await sender.close();
  }
}

/**
 * 4 & 5. Receive messages using receiveMessages() and complete them
 */
async function receiveAndCompleteMessages(client: ServiceBusClient): Promise<void> {
  console.log("\n=== Receiving and Completing Messages ===");
  
  const receiver: ServiceBusReceiver = client.createReceiver(queueName);
  
  try {
    // Receive up to 10 messages (will wait up to 10 seconds)
    const messages = await receiver.receiveMessages(10, { maxWaitTimeInMs: 10000 });
    
    console.log(`✓ Received ${messages.length} message(s)`);
    
    // Process and complete each message
    for (const message of messages) {
      console.log(`\nProcessing message:`);
      console.log(`  ID: ${message.messageId}`);
      console.log(`  Body: ${JSON.stringify(message.body)}`);
      console.log(`  Delivery count: ${message.deliveryCount}`);
      
      // Simulate processing
      await processMessage(message.body);
      
      // Complete the message (removes it from the queue)
      await receiver.completeMessage(message);
      console.log(`  ✓ Message completed`);
    }
  } finally {
    await receiver.close();
  }
}

/**
 * 6. Subscribe to messages with processMessage and processError handlers
 */
async function subscribeToMessages(client: ServiceBusClient): Promise<void> {
  console.log("\n=== Subscribing to Messages ===");
  
  const receiver: ServiceBusReceiver = client.createReceiver(queueName);
  
  // Message handler
  const messageHandler = async (messageArgs: ProcessMessageArgs): Promise<void> => {
    console.log(`\n[Subscription] Received message:`);
    console.log(`  ID: ${messageArgs.message.messageId}`);
    console.log(`  Body: ${JSON.stringify(messageArgs.message.body)}`);
    
    // Process the message
    await processMessage(messageArgs.message.body);
    
    // Complete the message
    await messageArgs.completeMessage();
    console.log(`  ✓ Message completed via subscription`);
  };
  
  // Error handler
  const errorHandler = async (errorArgs: ProcessErrorArgs): Promise<void> => {
    console.error(`[Subscription] Error from source ${errorArgs.errorSource}:`);
    console.error(errorArgs.error);
  };
  
  // Subscribe to messages
  const subscription = receiver.subscribe({
    processMessage: messageHandler,
    processError: errorHandler
  });
  
  console.log("✓ Subscribed to queue. Listening for messages...");
  console.log("  (Will listen for 20 seconds)");
  
  // Wait for 20 seconds to receive messages
  await new Promise(resolve => setTimeout(resolve, 20000));
  
  // Close the subscription
  await subscription.close();
  await receiver.close();
  console.log("✓ Subscription closed");
}

/**
 * 7. Demonstrate sending to a topic and receiving from a subscription
 */
async function topicSubscriptionDemo(client: ServiceBusClient): Promise<void> {
  console.log("\n=== Topic and Subscription Demo ===");
  
  // Send messages to topic
  const topicSender: ServiceBusSender = client.createSender(topicName);
  
  try {
    console.log("\nSending messages to topic...");
    
    for (let i = 1; i <= 3; i++) {
      const message: ServiceBusMessage = {
        body: { 
          text: `Topic message ${i}`,
          category: i % 2 === 0 ? "even" : "odd"
        },
        contentType: "application/json",
        messageId: `topic-msg-${i}`,
        subject: "topic-demo"
      };
      
      await topicSender.sendMessages(message);
      console.log(`✓ Sent message ${i} to topic`);
    }
  } finally {
    await topicSender.close();
  }
  
  // Receive from subscription
  const subscriptionReceiver: ServiceBusReceiver = client.createReceiver(
    topicName,
    subscriptionName
  );
  
  try {
    console.log("\nReceiving messages from subscription...");
    
    const messages = await subscriptionReceiver.receiveMessages(10, { 
      maxWaitTimeInMs: 10000 
    });
    
    console.log(`✓ Received ${messages.length} message(s) from subscription`);
    
    for (const message of messages) {
      console.log(`\n  Message ID: ${message.messageId}`);
      console.log(`  Body: ${JSON.stringify(message.body)}`);
      
      await subscriptionReceiver.completeMessage(message);
      console.log(`  ✓ Completed`);
    }
  } finally {
    await subscriptionReceiver.close();
  }
}

/**
 * Simulate message processing
 */
async function processMessage(messageBody: any): Promise<void> {
  // Simulate some processing time
  await new Promise(resolve => setTimeout(resolve, 100));
  // In real scenario, you would process the message here
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  console.log("╔════════════════════════════════════════════╗");
  console.log("║   Azure Service Bus TypeScript Demo      ║");
  console.log("╚════════════════════════════════════════════╝");
  
  let client: ServiceBusClient | undefined;
  
  try {
    // Create client
    client = createClient();
    
    // Run demonstrations
    await sendSingleMessage(client);
    await sendBatchMessages(client);
    await receiveAndCompleteMessages(client);
    await subscribeToMessages(client);
    
    // Topic/Subscription demo (requires topic and subscription to exist)
    try {
      await topicSubscriptionDemo(client);
    } catch (error) {
      console.log("\n⚠ Topic/Subscription demo skipped (entities may not exist)");
      console.log(`  Error: ${error instanceof Error ? error.message : error}`);
    }
    
    console.log("\n✓ All demonstrations completed successfully!");
    
  } catch (error) {
    console.error("\n✗ Error occurred:");
    console.error(error);
    throw error;
  } finally {
    // Always close the client to clean up resources
    if (client) {
      console.log("\nClosing ServiceBusClient...");
      await client.close();
      console.log("✓ Client closed");
    }
  }
}

// Run the demo
if (require.main === module) {
  main()
    .then(() => {
      console.log("\n✓ Program completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n✗ Program failed:", error);
      process.exit(1);
    });
}

export {
  createClient,
  sendSingleMessage,
  sendBatchMessages,
  receiveAndCompleteMessages,
  subscribeToMessages,
  topicSubscriptionDemo
};
```

### Usage:
1. **Install package**: `npm install @azure/service-bus`
2. **Set connection string**: `export SERVICE_BUS_CONNECTION_STRING="..."`
3. **Run**: `ts-node azure-service-bus-demo.ts`

The program demonstrates all 7 required features with proper resource cleanup using `close()` methods in finally blocks!

## Re-run Command

```bash
hyoka run --prompt-id service-bus-dp-js-ts-crud --config baseline-skills/claude-sonnet-4.5
```

---

[← Back to Summary](../../../../../../summary.md)
