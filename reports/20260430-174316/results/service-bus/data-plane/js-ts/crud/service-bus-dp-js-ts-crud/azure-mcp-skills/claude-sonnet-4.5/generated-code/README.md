# Azure Service Bus TypeScript Demo

This program demonstrates comprehensive Azure Service Bus messaging operations in TypeScript.

## Features Demonstrated

1. **ServiceBusClient Creation** - Initialize client with connection string
2. **Single Message Send** - Send individual messages to a queue
3. **Batch Message Send** - Create and send message batches with `createMessageBatch()` and `tryAddMessage()`
4. **Receive Messages** - Use `receiveMessages()` to pull messages from a queue
5. **Complete Messages** - Process and complete messages with `completeMessage()`
6. **Message Subscription** - Subscribe to messages with `processMessage` and `processError` handlers
7. **Topic/Subscription** - Send to topics and receive from subscriptions

## Prerequisites

- Node.js 14.x or higher
- Azure Service Bus namespace
- A queue named `demo-queue`
- A topic named `demo-topic` with a subscription named `demo-subscription`

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set your connection string:
```bash
# Windows
set AZURE_SERVICE_BUS_CONNECTION_STRING=Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=your-key

# Linux/Mac
export AZURE_SERVICE_BUS_CONNECTION_STRING="Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=your-key"
```

3. Create the required Service Bus entities using Azure Portal or CLI:
```bash
# Create queue
az servicebus queue create --resource-group <rg-name> --namespace-name <namespace> --name demo-queue

# Create topic
az servicebus topic create --resource-group <rg-name> --namespace-name <namespace> --name demo-topic

# Create subscription
az servicebus topic subscription create --resource-group <rg-name> --namespace-name <namespace> --topic-name demo-topic --name demo-subscription
```

## Run

```bash
npm start
```

## Key Concepts

### ServiceBusClient
- Central client for all Service Bus operations
- Created from connection string
- Must be closed after use

### Sender
- Created for specific queue or topic
- Supports single and batch message sending
- Should be closed after operations

### Receiver
- Created for queue or topic subscription
- Supports pull-based (`receiveMessages()`) and push-based (`subscribe()`) patterns
- Messages must be completed, abandoned, or dead-lettered

### Message Completion
- `completeMessage()` - Successfully processed, remove from queue
- `abandonMessage()` - Processing failed, return to queue
- `deadLetterMessage()` - Cannot process, move to dead-letter queue

### Batch Operations
- `createMessageBatch()` - Creates a batch respecting size limits
- `tryAddMessage()` - Safely adds messages, returns false if batch is full
- More efficient than sending individual messages

## Cleanup

The program automatically closes all clients, senders, and receivers in finally blocks to ensure proper resource cleanup.
