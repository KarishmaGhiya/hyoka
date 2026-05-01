# Azure Service Bus TypeScript Demo

This project demonstrates various Azure Service Bus messaging operations using TypeScript and the `@azure/service-bus` SDK.

## Features Demonstrated

1. **ServiceBusClient Creation**: Creating a client using a connection string
2. **Single Message**: Sending a single message to a queue
3. **Batch Messages**: Sending a batch of 5 messages using `createMessageBatch()` and `tryAddMessage()`
4. **Receive Messages**: Receiving messages with `receiveMessages()`
5. **Complete Messages**: Completing messages with `completeMessage()` after processing
6. **Message Subscription**: Subscribing to messages with `processMessage` and `processError` handlers
7. **Topic/Subscription**: Sending to a topic and receiving from a subscription
8. **Proper Cleanup**: Using `close()` to clean up resources

## Prerequisites

- Node.js (v16 or later)
- Azure Service Bus namespace
- A queue named `demo-queue`
- A topic named `demo-topic` with a subscription named `demo-subscription`

## Installation

```bash
npm install
```

## Configuration

Set your Azure Service Bus connection string as an environment variable:

```bash
# Windows (PowerShell)
$env:SERVICE_BUS_CONNECTION_STRING="Endpoint=sb://YOUR_NAMESPACE.servicebus.windows.net/;SharedAccessKeyName=YOUR_KEY_NAME;SharedAccessKey=YOUR_KEY"

# Windows (CMD)
set SERVICE_BUS_CONNECTION_STRING=Endpoint=sb://YOUR_NAMESPACE.servicebus.windows.net/;SharedAccessKeyName=YOUR_KEY_NAME;SharedAccessKey=YOUR_KEY

# Linux/Mac
export SERVICE_BUS_CONNECTION_STRING="Endpoint=sb://YOUR_NAMESPACE.servicebus.windows.net/;SharedAccessKeyName=YOUR_KEY_NAME;SharedAccessKey=YOUR_KEY"
```

Or modify the connection string directly in `src/index.ts`.

## Build and Run

```bash
# Build TypeScript
npm run build

# Run the demo
npm start
```

## Package Dependencies

- **@azure/service-bus** (^7.9.4): Azure Service Bus client library for Node.js
- **typescript** (^5.3.0): TypeScript compiler
- **@types/node** (^20.11.0): TypeScript type definitions for Node.js

## Key Concepts

### ServiceBusClient
The main entry point for interacting with Azure Service Bus. Created using a connection string.

### Sender
Used to send messages to a queue or topic. Supports single messages and batches.

### Receiver
Used to receive messages from a queue or subscription. Supports pull-based (`receiveMessages()`) and push-based (`subscribe()`) patterns.

### Message Completion
Messages must be explicitly completed, abandoned, or dead-lettered. Completing a message removes it from the queue/subscription.

### Batching
`createMessageBatch()` ensures the batch doesn't exceed Service Bus limits. `tryAddMessage()` returns false if a message won't fit.

### Subscriptions
The `subscribe()` method provides a push-based model where messages are delivered to your handlers automatically.

## Clean Up

The demo properly closes all resources:
- Senders are closed with `sender.close()`
- Receivers are closed with `receiver.close()`
- Subscriptions are closed with `subscription.close()`
- The ServiceBusClient is closed with `serviceBusClient.close()`
