# Evaluation Report: service-bus-dp-js-ts-crud

**Config:** baseline-skills/claude-sonnet-4.5 | **Result:** ✅ PASSED | **Duration:** 164.4s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `service-bus-dp-js-ts-crud` |
| Config | baseline-skills/claude-sonnet-4.5 |
| Result | ✅ PASSED |
| Duration | 164.4s |
| Timestamp | 2026-05-02T01:29:09Z |
| Files Generated | 4 |
| Event Count | 87 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 98.4s |
| Review | 65.9s |
| **Total** | **164.4s** |

## Configuration

- **name:** baseline-skills/claude-sonnet-4.5
- **model:** claude-sonnet-4.5

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | claude-sonnet-4.5 |
| Skill Directories | C:\code\hyoka\skills\generator\js-ts-azure-patterns, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-identity-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-storage-blob-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-keyvault-secrets-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-keyvault-keys-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-cosmos-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-servicebus-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-eventhub-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-appconfiguration-ts, C:\code\hyoka\.skills-cache\microsoft\skills\.github\plugins\azure-sdk-typescript\skills\azure-storage-queue-ts |
| Skills Loaded | azure-identity-ts, azure-storage-blob-ts, azure-keyvault-secrets-ts, azure-keyvault-keys-ts, azure-cosmos-ts, azure-servicebus-ts, azure-eventhub-ts, azure-appconfiguration-ts, azure-storage-queue-ts, customize-cloud-agent |
| Skills Invoked | azure-servicebus-ts |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=104165 out=6551 |
| Turn Count | 4 |

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

The user wants me to write a TypeScript program demonstrating Azure Service Bus operations. This is a perfect match for the azure-servicebus-ts skill that's available. According to the instructions, I should invoke the relevant skill BEFORE writing any code to get SDK-specific patterns, API examples, and acceptance criteria.

Let me invoke the azure-servicebus-ts skill first.

The user wants a comprehensive TypeScript program demonstrating Azure Service Bus messaging with specific requirements:
1. Create ServiceBusClient with connection string
2. Send single message to a queue
3. Send batch of 5 messages using createMessageBatch() and tryAddMessage()
4. Receive messages with receiveMessages()
5. Complete message with completeMessage()
6. Subscribe with processMessage and processError handlers
7. Send to topic and receive from subscription
8. Show npm package and proper cleanup

I should create a well-structured TypeScript program that demonstrates all these features. Let me also check the reference files to ensure I'm following best practices.

## Tool Calls

### 🔧 1. skill

**Input:**

```json
{"skill":"azure-servicebus-ts"}
```

### 🔧 2. report_intent

**Input:**

```json
{"intent":"Creating Service Bus demo"}
```

### 🔧 3. view

**Input:**

```json
{"path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-config-3086682660\\.skills-cache\\microsoft\\skills\\.github\\plugins\\azure-sdk-typescript\\skills\\azure-servicebus-ts\\references\\queues-topics.md"}
```

### 🔧 4. view

**Input:**

```json
{"path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-config-3086682660\\.skills-cache\\microsoft\\skills\\.github\\plugins\\azure-sdk-typescript\\skills\\azure-servicebus-ts\\references\\error-handling.md"}
```

### 🔧 5. create

**Input:**

```json
{"file_text":"/**\n * Azure Service Bus Comprehensive Demo\n * Demonstrates queues, topics/subscriptions, batching, and message handling\n */\n\nimport {\n  ServiceBusClient,\n  ServiceBusSender,\n  ServiceBusReceiver,\n  ServiceBusMessage,\n  ServiceBusReceivedMessage,\n} from \"@azure/service-bus\";\n\n// Configuration - set these environment variables\nconst connectionString = process.env.SERVICEBUS_CONNECTION_STRING || \"\";\nconst queueName = process.env.SERVICEBUS_QUEUE_NAME || \"demo-queue\";\nconst topicName = process.env.SERVICEBUS_TOPIC_NAME || \"demo-topic\";\nconst subscriptionName = process.env.SERVICEBUS_SUBSCRIPTION_NAME || \"demo-subscription\";\n\n/**\n * Demo 1: Send a single message to a queue\n */\nasync function sendSingleMessage(sender: ServiceBusSender): Promise\u003cvoid\u003e {\n  console.log(\"\\n=== Demo 1: Sending Single Message ===\");\n  \n  const message: ServiceBusMessage = {\n    body: {\n      orderId: \"12345\",\n      amount: 99.99,\n      timestamp: new Date().toISOString(),\n    },\n    contentType: \"application/json\",\n    messageId: \"msg-001\",\n  };\n\n  await sender.sendMessages(message);\n  console.log(`✓ Sent single message: ${message.messageId}`);\n}\n\n/**\n * Demo 2: Send a batch of messages using createMessageBatch and tryAddMessage\n */\nasync function sendBatchMessages(sender: ServiceBusSender): Promise\u003cvoid\u003e {\n  console.log(\"\\n=== Demo 2: Sending Batch of 5 Messages ===\");\n  \n  const batch = await sender.createMessageBatch();\n  \n  for (let i = 1; i \u003c= 5; i++) {\n    const message: ServiceBusMessage = {\n      body: {\n        messageNumber: i,\n        content: `Batch message ${i}`,\n        timestamp: new Date().toISOString(),\n      },\n      messageId: `batch-msg-${i}`,\n    };\n\n    const added = batch.tryAddMessage(message);\n    \n    if (!added) {\n      // Batch is full - send current batch and create new one\n      console.log(`Batch full at message ${i}, sending current batch...`);\n      await sender.sendMessages(batch);\n      \n      const newBatch = await sender.createMessageBatch();\n      newBatch.tryAddMessage(message);\n      await sender.sendMessages(newBatch);\n    } else {\n      console.log(`✓ Added message ${i} to batch`);\n    }\n  }\n\n  // Send remaining messages in batch\n  if (batch.count \u003e 0) {\n    await sender.sendMessages(batch);\n    console.log(`✓ Sent batch with ${batch.count} messages`);\n  }\n}\n\n/**\n * Demo 3: Receive messages using receiveMessages and complete them\n */\nasync function receiveAndCompleteMessages(receiver: ServiceBusReceiver): Promise\u003cvoid\u003e {\n  console.log(\"\\n=== Demo 3: Receiving and Completing Messages ===\");\n  \n  const messages = await receiver.receiveMessages(10, {\n    maxWaitTimeInMs: 5000,\n  });\n\n  console.log(`✓ Received ${messages.length} messages`);\n\n  for (const message of messages) {\n    console.log(`  - Message ID: ${message.messageId}`);\n    console.log(`    Body: ${JSON.stringify(message.body)}`);\n    console.log(`    Delivery count: ${message.deliveryCount}`);\n    \n    // Process the message (simulate processing)\n    await processMessage(message);\n    \n    // Complete the message to remove it from the queue\n    await receiver.completeMessage(message);\n    console.log(`    ✓ Completed message: ${message.messageId}`);\n  }\n}\n\n/**\n * Demo 4: Subscribe to messages with processMessage and processError handlers\n */\nasync function subscribeToMessages(receiver: ServiceBusReceiver): Promise\u003cvoid\u003e {\n  console.log(\"\\n=== Demo 4: Subscribing to Messages (Event-Driven) ===\");\n  \n  return new Promise((resolve) =\u003e {\n    let messageCount = 0;\n    const maxMessages = 3; // Process 3 messages then stop\n\n    const subscription = receiver.subscribe(\n      {\n        processMessage: async (message: ServiceBusReceivedMessage) =\u003e {\n          messageCount++;\n          console.log(`\\n[Subscribe] Received message ${messageCount}:`);\n          console.log(`  - Message ID: ${message.messageId}`);\n          console.log(`  - Body: ${JSON.stringify(message.body)}`);\n          \n          // Simulate processing\n          await processMessage(message);\n          \n          // Message is auto-completed on success\n          console.log(`  ✓ Message auto-completed`);\n\n          // Stop after processing maxMessages\n          if (messageCount \u003e= maxMessages) {\n            console.log(`\\nProcessed ${maxMessages} messages, stopping subscription...`);\n            subscription.close().then(() =\u003e resolve());\n          }\n        },\n        processError: async (args) =\u003e {\n          console.error(`\\n[Error Handler] Error occurred:`);\n          console.error(`  - Error source: ${args.errorSource}`);\n          console.error(`  - Entity path: ${args.entityPath}`);\n          console.error(`  - Error: ${args.error.message}`);\n          \n          // Handle different error sources\n          if (args.errorSource === \"receive\") {\n            console.log(\"  Connection issue - SDK will reconnect automatically\");\n          } else if (args.errorSource === \"processMessageCallback\") {\n            console.log(\"  Error in message processing - check handler logic\");\n          }\n        },\n      },\n      {\n        autoCompleteMessages: true, // Auto-complete on success\n        maxConcurrentCalls: 1, // Process messages sequentially for demo\n      }\n    );\n\n    console.log(\"✓ Subscription active, waiting for messages...\");\n    console.log(\"  (Will process 3 messages then stop)\");\n\n    // Set a timeout in case no messages arrive\n    setTimeout(async () =\u003e {\n      if (messageCount === 0) {\n        console.log(\"\\nNo messages received within timeout, closing subscription...\");\n      }\n      await subscription.close();\n      resolve();\n    }, 15000); // 15 second timeout\n  });\n}\n\n/**\n * Demo 5: Send to topic and receive from subscription\n */\nasync function topicAndSubscriptionDemo(client: ServiceBusClient): Promise\u003cvoid\u003e {\n  console.log(\"\\n=== Demo 5: Topics and Subscriptions ===\");\n  \n  // Create topic sender\n  const topicSender = client.createSender(topicName);\n  \n  try {\n    // Send messages to topic\n    console.log(\"\\nSending messages to topic...\");\n    const topicMessages: ServiceBusMessage[] = [\n      {\n        body: {\n          event: \"order.created\",\n          orderId: \"T-001\",\n          customerId: \"customer-123\",\n        },\n        applicationProperties: {\n          eventType: \"order.created\",\n          region: \"us-west\",\n        },\n        subject: \"orders/created\",\n        messageId: \"topic-msg-001\",\n      },\n      {\n        body: {\n          event: \"order.updated\",\n          orderId: \"T-002\",\n          status: \"shipped\",\n        },\n        applicationProperties: {\n          eventType: \"order.updated\",\n          region: \"us-east\",\n        },\n        subject: \"orders/updated\",\n        messageId: \"topic-msg-002\",\n      },\n    ];\n\n    for (const message of topicMessages) {\n      await topicSender.sendMessages(message);\n      console.log(`✓ Sent to topic: ${message.messageId} (${message.body.event})`);\n    }\n\n    // Create subscription receiver\n    console.log(\"\\nReceiving from subscription...\");\n    const subscriptionReceiver = client.createReceiver(topicName, subscriptionName);\n    \n    try {\n      const messages = await subscriptionReceiver.receiveMessages(5, {\n        maxWaitTimeInMs: 5000,\n      });\n\n      console.log(`✓ Received ${messages.length} messages from subscription`);\n\n      for (const message of messages) {\n        console.log(`  - Message ID: ${message.messageId}`);\n        console.log(`    Event: ${message.body.event}`);\n        console.log(`    Subject: ${message.subject}`);\n        console.log(`    Application Properties:`, message.applicationProperties);\n        \n        await subscriptionReceiver.completeMessage(message);\n        console.log(`    ✓ Completed`);\n      }\n    } finally {\n      await subscriptionReceiver.close();\n      console.log(\"\\n✓ Subscription receiver closed\");\n    }\n  } finally {\n    await topicSender.close();\n    console.log(\"✓ Topic sender closed\");\n  }\n}\n\n/**\n * Simulate message processing\n */\nasync function processMessage(message: ServiceBusReceivedMessage): Promise\u003cvoid\u003e {\n  // Simulate some processing time\n  await new Promise((resolve) =\u003e setTimeout(resolve, 100));\n  // In real application, perform business logic here\n}\n\n/**\n * Main demo function\n */\nasync function main(): Promise\u003cvoid\u003e {\n  if (!connectionString) {\n    console.error(\"Error: SERVICEBUS_CONNECTION_STRING environment variable is not set\");\n    console.log(\"\\nPlease set the following environment variables:\");\n    console.log(\"  SERVICEBUS_CONNECTION_STRING=\u003cyour-connection-string\u003e\");\n    console.log(\"  SERVICEBUS_QUEUE_NAME=\u003cqueue-name\u003e (optional, default: demo-queue)\");\n    console.log(\"  SERVICEBUS_TOPIC_NAME=\u003ctopic-name\u003e (optional, default: demo-topic)\");\n    console.log(\"  SERVICEBUS_SUBSCRIPTION_NAME=\u003csubscription-name\u003e (optional, default: demo-subscription)\");\n    process.exit(1);\n  }\n\n  console.log(\"Azure Service Bus Comprehensive Demo\");\n  console.log(\"=====================================\");\n  console.log(`Queue: ${queueName}`);\n  console.log(`Topic: ${topicName}`);\n  console.log(`Subscription: ${subscriptionName}`);\n\n  // Create Service Bus client\n  const client = new ServiceBusClient(connectionString);\n  \n  try {\n    // ========================================\n    // QUEUE DEMOS\n    // ========================================\n    \n    // Create sender for queue\n    const queueSender = client.createSender(queueName);\n    \n    try {\n      // Demo 1: Send single message\n      await sendSingleMessage(queueSender);\n      \n      // Demo 2: Send batch of messages\n      await sendBatchMessages(queueSender);\n    } finally {\n      await queueSender.close();\n      console.log(\"\\n✓ Queue sender closed\");\n    }\n\n    // Create receiver for queue\n    const queueReceiver = client.createReceiver(queueName);\n    \n    try {\n      // Demo 3: Receive and complete messages\n      await receiveAndCompleteMessages(queueReceiver);\n      \n      // Demo 4: Subscribe to messages (event-driven)\n      await subscribeToMessages(queueReceiver);\n    } finally {\n      await queueReceiver.close();\n      console.log(\"\\n✓ Queue receiver closed\");\n    }\n\n    // ========================================\n    // TOPIC/SUBSCRIPTION DEMO\n    // ========================================\n    \n    // Demo 5: Topics and Subscriptions\n    await topicAndSubscriptionDemo(client);\n\n  } catch (error) {\n    console.error(\"\\n❌ Error occurred:\", error);\n    throw error;\n  } finally {\n    // Always close the client\n    await client.close();\n    console.log(\"\\n✓ Service Bus client closed\");\n    console.log(\"\\n=== Demo Complete ===\");\n  }\n}\n\n// Run the demo\nmain().catch((error) =\u003e {\n  console.error(\"Fatal error:\", error);\n  process.exit(1);\n});\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-service-bus-dp-js-ts-crud-baseline-skills-claude-sonnet-4.5-3749634394\\servicebus-demo.ts"}
```

### 🔧 6. create

**Input:**

```json
{"file_text":"{\n  \"name\": \"azure-servicebus-demo\",\n  \"version\": \"1.0.0\",\n  \"description\": \"Comprehensive Azure Service Bus TypeScript demo\",\n  \"main\": \"servicebus-demo.ts\",\n  \"scripts\": {\n    \"start\": \"ts-node servicebus-demo.ts\",\n    \"build\": \"tsc\",\n    \"dev\": \"ts-node-dev --respawn servicebus-demo.ts\"\n  },\n  \"keywords\": [\n    \"azure\",\n    \"service-bus\",\n    \"messaging\",\n    \"typescript\"\n  ],\n  \"author\": \"\",\n  \"license\": \"MIT\",\n  \"dependencies\": {\n    \"@azure/service-bus\": \"^7.9.5\"\n  },\n  \"devDependencies\": {\n    \"@types/node\": \"^20.0.0\",\n    \"ts-node\": \"^10.9.2\",\n    \"ts-node-dev\": \"^2.0.0\",\n    \"typescript\": \"^5.3.0\"\n  }\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-service-bus-dp-js-ts-crud-baseline-skills-claude-sonnet-4.5-3749634394\\package.json"}
```

### 🔧 7. create

**Input:**

```json
{"file_text":"{\n  \"compilerOptions\": {\n    \"target\": \"ES2020\",\n    \"module\": \"commonjs\",\n    \"lib\": [\"ES2020\"],\n    \"outDir\": \"./dist\",\n    \"rootDir\": \"./\",\n    \"strict\": true,\n    \"esModuleInterop\": true,\n    \"skipLibCheck\": true,\n    \"forceConsistentCasingInFileNames\": true,\n    \"resolveJsonModule\": true,\n    \"moduleResolution\": \"node\"\n  },\n  \"include\": [\"*.ts\"],\n  \"exclude\": [\"node_modules\", \"dist\"]\n}\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-service-bus-dp-js-ts-crud-baseline-skills-claude-sonnet-4.5-3749634394\\tsconfig.json"}
```

### 🔧 8. create

**Input:**

```json
{"file_text":"# Azure Service Bus TypeScript Demo\n\nComprehensive demonstration of Azure Service Bus messaging patterns using the `@azure/service-bus` SDK.\n\n## Features Demonstrated\n\n1. **Create ServiceBusClient** - Using connection string authentication\n2. **Send Single Message** - Send one message to a queue\n3. **Batch Sending** - Send 5 messages using `createMessageBatch()` and `tryAddMessage()`\n4. **Receive Messages** - Receive messages using `receiveMessages()`\n5. **Complete Messages** - Complete messages with `completeMessage()` after processing\n6. **Subscribe Pattern** - Subscribe to messages with `processMessage` and `processError` handlers\n7. **Topics \u0026 Subscriptions** - Send to topic and receive from subscription\n\n## Prerequisites\n\n- Node.js 18+ installed\n- Azure Service Bus namespace\n- A queue named `demo-queue` (or set custom name)\n- A topic named `demo-topic` with subscription `demo-subscription` (or set custom names)\n\n## Installation\n\n```bash\nnpm install\n```\n\n## Required Packages\n\n- `@azure/service-bus` (v7.9.5+) - Azure Service Bus SDK for JavaScript/TypeScript\n\n## Configuration\n\nSet the following environment variables:\n\n```bash\n# Required\nexport SERVICEBUS_CONNECTION_STRING=\"Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=your-key\"\n\n# Optional (defaults shown)\nexport SERVICEBUS_QUEUE_NAME=\"demo-queue\"\nexport SERVICEBUS_TOPIC_NAME=\"demo-topic\"\nexport SERVICEBUS_SUBSCRIPTION_NAME=\"demo-subscription\"\n```\n\n### Getting Connection String\n\n1. Go to Azure Portal → Your Service Bus Namespace\n2. Under Settings → Shared access policies\n3. Click on \"RootManageSharedAccessKey\" (or create a new policy)\n4. Copy the \"Primary Connection String\"\n\n### Creating Resources\n\nYou can create the queue, topic, and subscription in Azure Portal or using Azure CLI:\n\n```bash\n# Create queue\naz servicebus queue create \\\n  --namespace-name \u003cyour-namespace\u003e \\\n  --resource-group \u003cyour-resource-group\u003e \\\n  --name demo-queue\n\n# Create topic\naz servicebus topic create \\\n  --namespace-name \u003cyour-namespace\u003e \\\n  --resource-group \u003cyour-resource-group\u003e \\\n  --name demo-topic\n\n# Create subscription\naz servicebus topic subscription create \\\n  --namespace-name \u003cyour-namespace\u003e \\\n  --resource-group \u003cyour-resource-group\u003e \\\n  --topic-name demo-topic \\\n  --name demo-subscription\n```\n\n## Running the Demo\n\n```bash\n# Using ts-node\nnpm start\n\n# Or compile and run\nnpm run build\nnode dist/servicebus-demo.js\n```\n\n## Demo Flow\n\n### 1. Send Single Message\n- Creates a sender for the queue\n- Sends a single message with JSON body\n\n### 2. Send Batch of 5 Messages\n- Creates a message batch\n- Adds 5 messages using `tryAddMessage()`\n- Handles batch size limits automatically\n\n### 3. Receive and Complete Messages\n- Creates a receiver in peek-lock mode\n- Receives up to 10 messages\n- Processes and completes each message\n\n### 4. Subscribe to Messages (Event-Driven)\n- Uses `subscribe()` for continuous message processing\n- Demonstrates `processMessage` callback\n- Demonstrates `processError` callback for error handling\n- Auto-completes messages on success\n\n### 5. Topics and Subscriptions\n- Sends messages to a topic\n- Receives messages from a subscription\n- Shows application properties and message routing\n\n## Key Concepts\n\n### ServiceBusClient\n```typescript\nconst client = new ServiceBusClient(connectionString);\n```\nMain client for interacting with Service Bus. Reuse across senders/receivers.\n\n### Sending Messages\n```typescript\n// Single message\nawait sender.sendMessages({ body: data });\n\n// Batch with size management\nconst batch = await sender.createMessageBatch();\nbatch.tryAddMessage({ body: data });\nawait sender.sendMessages(batch);\n```\n\n### Receiving Messages\n```typescript\n// Pull model\nconst messages = await receiver.receiveMessages(10);\n\n// Push model (subscribe)\nreceiver.subscribe({\n  processMessage: async (msg) =\u003e { /* process */ },\n  processError: async (args) =\u003e { /* handle error */ }\n});\n```\n\n### Message Settlement\n- `completeMessage()` - Remove from queue (success)\n- `abandonMessage()` - Return to queue (retry)\n- `deferMessage()` - Defer for later retrieval\n- `deadLetterMessage()` - Move to dead-letter queue\n\n### Resource Cleanup\nAlways close resources in proper order:\n```typescript\nawait sender.close();\nawait receiver.close();\nawait client.close();\n```\n\n## Troubleshooting\n\n### \"Entity not found\"\n- Ensure queue/topic/subscription exists in your namespace\n- Check entity names match environment variables\n\n### \"Unauthorized access\"\n- Verify connection string is correct\n- Ensure the access policy has Send/Listen permissions\n\n### \"No messages received\"\n- Check that messages were sent successfully\n- Verify queue/subscription has messages (check Azure Portal)\n- Increase `maxWaitTimeInMs` timeout\n\n## Best Practices\n\n1. **Reuse clients** - Create `ServiceBusClient` once per application\n2. **Close resources** - Always close senders, receivers, and client\n3. **Handle errors** - Implement `processError` for subscriptions\n4. **Use batching** - More efficient for multiple messages\n5. **Idempotent processing** - Design for at-least-once delivery\n6. **Monitor DLQ** - Set up alerts for dead-letter queue\n\n## Learn More\n\n- [Azure Service Bus Documentation](https://learn.microsoft.com/azure/service-bus-messaging/)\n- [@azure/service-bus SDK Reference](https://learn.microsoft.com/javascript/api/@azure/service-bus/)\n- [Service Bus Samples](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/servicebus/service-bus/samples)\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-service-bus-dp-js-ts-crud-baseline-skills-claude-sonnet-4.5-3749634394\\README.md"}
```

### 🔧 9. create

**Input:**

```json
{"file_text":"# Azure Service Bus Configuration\n# Copy this file to .env and fill in your values\n\n# Required: Service Bus connection string\n# Get from: Azure Portal → Service Bus Namespace → Shared access policies\nSERVICEBUS_CONNECTION_STRING=Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=your-key-here\n\n# Optional: Queue name (default: demo-queue)\nSERVICEBUS_QUEUE_NAME=demo-queue\n\n# Optional: Topic name (default: demo-topic)\nSERVICEBUS_TOPIC_NAME=demo-topic\n\n# Optional: Subscription name (default: demo-subscription)\nSERVICEBUS_SUBSCRIPTION_NAME=demo-subscription\n","path":"C:\\Users\\kaghiya\\AppData\\Local\\Temp\\hyoka-service-bus-dp-js-ts-crud-baseline-skills-claude-sonnet-4.5-3749634394\\.env.example"}
```

## Generated Files

- `README.md`
- `package.json`
- `servicebus-demo.ts`
- `tsconfig.json`

## Copilot Response

I'll help you create a comprehensive TypeScript program demonstrating Azure Service Bus messaging. Let me first invoke the Azure Service Bus skill to get the latest patterns and best practices.

Now I'll create a comprehensive TypeScript program demonstrating all the requested Azure Service Bus features:

Perfect! I've created a comprehensive Azure Service Bus TypeScript demo that covers all your requirements:

## 📁 Created Files

1. **`servicebus-demo.ts`** - Main demo program with all 7 features
2. **`package.json`** - Required package: `@azure/service-bus` v7.9.5
3. **`tsconfig.json`** - TypeScript configuration
4. **`README.md`** - Complete documentation
5. **`.env.example`** - Environment variable template

## ✅ Features Demonstrated

1. **ServiceBusClient with connection string** - Creates client for messaging operations
2. **Send single message** - Sends one message to queue with JSON body
3. **Batch sending** - Uses `createMessageBatch()` and `tryAddMessage()` for 5 messages
4. **Receive messages** - Uses `receiveMessages()` to pull messages
5. **Complete messages** - Calls `completeMessage()` after processing
6. **Subscribe pattern** - Uses `subscribe()` with `processMessage` and `processError` handlers
7. **Topics & subscriptions** - Sends to topic and receives from subscription

## 🚀 To Run

```bash
# Install dependencies
npm install

# Set environment variable
export SERVICEBUS_CONNECTION_STRING="Endpoint=sb://..."

# Run demo
npm start
```

The program demonstrates proper resource cleanup with `close()` on all senders, receivers, and the client. It includes error handling, message processing patterns, and follows Azure Service Bus best practices from the skill's reference materials.

## Re-run Command

```bash
hyoka run --prompt-id service-bus-dp-js-ts-crud --config baseline-skills/claude-sonnet-4.5
```

---

[← Back to Summary](../../../../../../summary.md)
