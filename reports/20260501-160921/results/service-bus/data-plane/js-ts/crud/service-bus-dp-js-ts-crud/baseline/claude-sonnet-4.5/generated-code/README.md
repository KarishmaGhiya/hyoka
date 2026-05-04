# Azure Service Bus TypeScript Demo

This program demonstrates comprehensive Azure Service Bus messaging patterns in TypeScript.

## Features Demonstrated

1. **ServiceBusClient Creation** - Initialize client with connection string
2. **Single Message Send** - Send individual messages to a queue
3. **Batch Message Send** - Use `createMessageBatch()` and `tryAddMessage()` for efficient batch sending
4. **Message Receive** - Receive messages using `receiveMessages()`
5. **Message Completion** - Complete messages with `completeMessage()` after processing
6. **Subscribe Pattern** - Subscribe to messages with `processMessage` and `processError` handlers
7. **Topic/Subscription** - Send to topics and receive from subscriptions

## Prerequisites

- Node.js 18+ and npm
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
   # Windows PowerShell
   $env:AZURE_SERVICEBUS_CONNECTION_STRING="Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=your-key"
   
   # Linux/macOS
   export AZURE_SERVICEBUS_CONNECTION_STRING="Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=your-key"
   ```

3. Create required entities in Azure Portal or using Azure CLI:
   ```bash
   # Create queue
   az servicebus queue create --resource-group myResourceGroup --namespace-name myNamespace --name demo-queue
   
   # Create topic
   az servicebus topic create --resource-group myResourceGroup --namespace-name myNamespace --name demo-topic
   
   # Create subscription
   az servicebus topic subscription create --resource-group myResourceGroup --namespace-name myNamespace --topic-name demo-topic --name demo-subscription
   ```

## Run

```bash
npm start
```

## Key Concepts

### ServiceBusClient
- Central client for all Service Bus operations
- Created from connection string
- Must be properly closed after use

### Sender Operations
- **sendMessages()** - Send single or array of messages
- **createMessageBatch()** - Create optimized batch
- **tryAddMessage()** - Add messages to batch with size validation

### Receiver Operations
- **receiveMessages()** - Pull messages with configurable count and timeout
- **completeMessage()** - Mark message as successfully processed
- **subscribe()** - Push-based message handling with callbacks

### Message Properties
- `body` - Message payload (any type)
- `messageId` - Unique identifier
- `contentType` - Content type descriptor
- `subject` - Message subject/label

## Cleanup

All resources are properly cleaned up with `close()` calls in finally blocks to ensure no resource leaks.
