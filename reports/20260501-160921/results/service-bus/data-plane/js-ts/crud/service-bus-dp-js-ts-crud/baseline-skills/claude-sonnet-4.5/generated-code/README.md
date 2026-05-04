# Azure Service Bus TypeScript Demo

A comprehensive demonstration of Azure Service Bus messaging patterns using TypeScript.

## Features Demonstrated

1. **ServiceBusClient Creation** - Using connection string authentication
2. **Single Message Sending** - Send individual messages to a queue
3. **Batch Messaging** - Create and send batches using `createMessageBatch()` and `tryAddMessage()`
4. **Message Receiving** - Receive messages with `receiveMessages()` in peek-lock mode
5. **Message Completion** - Complete messages with `completeMessage()` after processing
6. **Message Subscription** - Subscribe to messages with `processMessage` and `processError` handlers
7. **Topic/Subscription** - Send to topics and receive from subscriptions

## Prerequisites

- Node.js 18 or higher
- Azure Service Bus namespace
- Service Bus queue named `demo-queue`
- Service Bus topic named `demo-topic` with subscription `demo-subscription`

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Connection String

Set your Service Bus connection string as an environment variable:

**Windows (PowerShell):**
```powershell
$env:SERVICE_BUS_CONNECTION_STRING="Endpoint=sb://<namespace>.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=<key>"
```

**Linux/Mac:**
```bash
export SERVICE_BUS_CONNECTION_STRING="Endpoint=sb://<namespace>.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=<key>"
```

### 3. Create Service Bus Resources

You can create the required resources using Azure Portal or Azure CLI:

```bash
# Create a namespace (if not exists)
az servicebus namespace create --resource-group <rg-name> --name <namespace-name> --location eastus

# Create a queue
az servicebus queue create --resource-group <rg-name> --namespace-name <namespace-name> --name demo-queue

# Create a topic
az servicebus topic create --resource-group <rg-name> --namespace-name <namespace-name> --name demo-topic

# Create a subscription
az servicebus topic subscription create --resource-group <rg-name> --namespace-name <namespace-name> --topic-name demo-topic --name demo-subscription

# Get connection string
az servicebus namespace authorization-rule keys list --resource-group <rg-name> --namespace-name <namespace-name> --name RootManageSharedAccessKey --query primaryConnectionString -o tsv
```

## Running the Demo

```bash
npm start
```

Or with auto-reload during development:

```bash
npm run dev
```

## Code Structure

### Single Message Sending

```typescript
const message: ServiceBusMessage = {
  body: { orderId: "12345", product: "Laptop" },
  contentType: "application/json",
  messageId: "msg-001",
  applicationProperties: { priority: "high" }
};

await sender.sendMessages(message);
```

### Batch Sending

```typescript
const batch = await sender.createMessageBatch();

for (const msg of messages) {
  if (!batch.tryAddMessage(msg)) {
    // Message doesn't fit, send current batch
    await sender.sendMessages(batch);
  }
}

if (batch.count > 0) {
  await sender.sendMessages(batch);
}
```

### Receiving and Completing Messages

```typescript
const messages = await receiver.receiveMessages(10, { maxWaitTimeInMs: 10000 });

for (const message of messages) {
  await processMessage(message);
  await receiver.completeMessage(message);
}
```

### Subscribe with Handlers

```typescript
const subscription = receiver.subscribe({
  processMessage: async (message) => {
    console.log("Processing:", message.body);
    // Auto-completed if autoCompleteMessages: true
  },
  processError: async (error) => {
    console.error("Error:", error);
  }
}, {
  autoCompleteMessages: true,
  maxConcurrentCalls: 5
});
```

## Important Notes

### Resource Cleanup

Always close senders, receivers, and the client:

```typescript
await sender.close();
await receiver.close();
await client.close();
```

### Receive Modes

- **peekLock** (default): Messages are locked and must be explicitly completed
- **receiveAndDelete**: Messages are automatically removed upon receipt

### Message Settlement

- `completeMessage()` - Successfully processed, remove from queue
- `abandonMessage()` - Failed processing, return to queue for redelivery
- `deferMessage()` - Set aside for later processing
- `deadLetterMessage()` - Move to dead-letter queue

### Best Practices

1. **Use batching** for high throughput scenarios
2. **Set proper maxWaitTimeInMs** for `receiveMessages()` to avoid long polling
3. **Implement error handling** in `processError` callback
4. **Use autoCompleteMessages** when messages should auto-complete on success
5. **Monitor delivery count** to detect poison messages
6. **Always clean up resources** in finally blocks

## Package Information

- **@azure/service-bus** (^7.9.5): Official Azure SDK for Service Bus
  - Supports queues, topics, and subscriptions
  - Implements AMQP protocol
  - Built-in retry logic and connection management
  - Type-safe TypeScript API

## Troubleshooting

### Connection Issues

- Verify connection string format
- Check firewall rules on Service Bus namespace
- Ensure queue/topic exists

### Message Not Received

- Check if messages are in dead-letter queue
- Verify subscription filters (topics)
- Check message lock duration vs processing time

### Performance

- Use batching for multiple messages
- Tune `maxConcurrentCalls` for subscriptions
- Consider session-enabled queues for ordered processing

## Additional Resources

- [Azure Service Bus Documentation](https://learn.microsoft.com/azure/service-bus-messaging/)
- [@azure/service-bus NPM Package](https://www.npmjs.com/package/@azure/service-bus)
- [Service Bus Samples](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/servicebus/service-bus/samples)
