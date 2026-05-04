# Azure Service Bus TypeScript Demo

Comprehensive demonstration of Azure Service Bus messaging patterns using the `@azure/service-bus` SDK.

## Features Demonstrated

1. **Create ServiceBusClient** - Using connection string authentication
2. **Send Single Message** - Send one message to a queue
3. **Batch Sending** - Send 5 messages using `createMessageBatch()` and `tryAddMessage()`
4. **Receive Messages** - Receive messages using `receiveMessages()`
5. **Complete Messages** - Complete messages with `completeMessage()` after processing
6. **Subscribe Pattern** - Subscribe to messages with `processMessage` and `processError` handlers
7. **Topics & Subscriptions** - Send to topic and receive from subscription

## Prerequisites

- Node.js 18+ installed
- Azure Service Bus namespace
- A queue named `demo-queue` (or set custom name)
- A topic named `demo-topic` with subscription `demo-subscription` (or set custom names)

## Installation

```bash
npm install
```

## Required Packages

- `@azure/service-bus` (v7.9.5+) - Azure Service Bus SDK for JavaScript/TypeScript

## Configuration

Set the following environment variables:

```bash
# Required
export SERVICEBUS_CONNECTION_STRING="Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=your-key"

# Optional (defaults shown)
export SERVICEBUS_QUEUE_NAME="demo-queue"
export SERVICEBUS_TOPIC_NAME="demo-topic"
export SERVICEBUS_SUBSCRIPTION_NAME="demo-subscription"
```

### Getting Connection String

1. Go to Azure Portal → Your Service Bus Namespace
2. Under Settings → Shared access policies
3. Click on "RootManageSharedAccessKey" (or create a new policy)
4. Copy the "Primary Connection String"

### Creating Resources

You can create the queue, topic, and subscription in Azure Portal or using Azure CLI:

```bash
# Create queue
az servicebus queue create \
  --namespace-name <your-namespace> \
  --resource-group <your-resource-group> \
  --name demo-queue

# Create topic
az servicebus topic create \
  --namespace-name <your-namespace> \
  --resource-group <your-resource-group> \
  --name demo-topic

# Create subscription
az servicebus topic subscription create \
  --namespace-name <your-namespace> \
  --resource-group <your-resource-group> \
  --topic-name demo-topic \
  --name demo-subscription
```

## Running the Demo

```bash
# Using ts-node
npm start

# Or compile and run
npm run build
node dist/servicebus-demo.js
```

## Demo Flow

### 1. Send Single Message
- Creates a sender for the queue
- Sends a single message with JSON body

### 2. Send Batch of 5 Messages
- Creates a message batch
- Adds 5 messages using `tryAddMessage()`
- Handles batch size limits automatically

### 3. Receive and Complete Messages
- Creates a receiver in peek-lock mode
- Receives up to 10 messages
- Processes and completes each message

### 4. Subscribe to Messages (Event-Driven)
- Uses `subscribe()` for continuous message processing
- Demonstrates `processMessage` callback
- Demonstrates `processError` callback for error handling
- Auto-completes messages on success

### 5. Topics and Subscriptions
- Sends messages to a topic
- Receives messages from a subscription
- Shows application properties and message routing

## Key Concepts

### ServiceBusClient
```typescript
const client = new ServiceBusClient(connectionString);
```
Main client for interacting with Service Bus. Reuse across senders/receivers.

### Sending Messages
```typescript
// Single message
await sender.sendMessages({ body: data });

// Batch with size management
const batch = await sender.createMessageBatch();
batch.tryAddMessage({ body: data });
await sender.sendMessages(batch);
```

### Receiving Messages
```typescript
// Pull model
const messages = await receiver.receiveMessages(10);

// Push model (subscribe)
receiver.subscribe({
  processMessage: async (msg) => { /* process */ },
  processError: async (args) => { /* handle error */ }
});
```

### Message Settlement
- `completeMessage()` - Remove from queue (success)
- `abandonMessage()` - Return to queue (retry)
- `deferMessage()` - Defer for later retrieval
- `deadLetterMessage()` - Move to dead-letter queue

### Resource Cleanup
Always close resources in proper order:
```typescript
await sender.close();
await receiver.close();
await client.close();
```

## Troubleshooting

### "Entity not found"
- Ensure queue/topic/subscription exists in your namespace
- Check entity names match environment variables

### "Unauthorized access"
- Verify connection string is correct
- Ensure the access policy has Send/Listen permissions

### "No messages received"
- Check that messages were sent successfully
- Verify queue/subscription has messages (check Azure Portal)
- Increase `maxWaitTimeInMs` timeout

## Best Practices

1. **Reuse clients** - Create `ServiceBusClient` once per application
2. **Close resources** - Always close senders, receivers, and client
3. **Handle errors** - Implement `processError` for subscriptions
4. **Use batching** - More efficient for multiple messages
5. **Idempotent processing** - Design for at-least-once delivery
6. **Monitor DLQ** - Set up alerts for dead-letter queue

## Learn More

- [Azure Service Bus Documentation](https://learn.microsoft.com/azure/service-bus-messaging/)
- [@azure/service-bus SDK Reference](https://learn.microsoft.com/javascript/api/@azure/service-bus/)
- [Service Bus Samples](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/servicebus/service-bus/samples)
