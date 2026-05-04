# Azure Service Bus TypeScript Demo

Comprehensive demonstration of Azure Service Bus messaging patterns using the `@azure/service-bus` SDK.

## Features Demonstrated

1. **Single Message Send** - Send individual messages to a queue
2. **Batch Message Send** - Send multiple messages efficiently using `createMessageBatch()` and `tryAddMessage()`
3. **Receive Messages** - Pull messages from a queue using `receiveMessages()`
4. **Complete Messages** - Process and complete messages with `completeMessage()`
5. **Subscribe Pattern** - Event-driven message processing with `subscribe()` and handlers
6. **Topic Publishing** - Send messages to topics for pub/sub patterns
7. **Subscription Receiving** - Receive messages from topic subscriptions

## Prerequisites

- Node.js 16+ and npm
- Azure Service Bus namespace
- A queue named `demo-queue` (or specify custom name)
- A topic named `demo-topic` with subscription `demo-subscription` (or specify custom names)

## Installation

```bash
npm install
```

## Configuration

Set the following environment variables:

```bash
# Required
export SERVICEBUS_CONNECTION_STRING="Endpoint=sb://<namespace>.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=<key>"

# Optional (defaults provided)
export QUEUE_NAME="demo-queue"
export TOPIC_NAME="demo-topic"
export SUBSCRIPTION_NAME="demo-subscription"
```

### Windows (PowerShell)

```powershell
$env:SERVICEBUS_CONNECTION_STRING="Endpoint=sb://<namespace>.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=<key>"
$env:QUEUE_NAME="demo-queue"
$env:TOPIC_NAME="demo-topic"
$env:SUBSCRIPTION_NAME="demo-subscription"
```

## Usage

### Run with ts-node

```bash
npm start
```

### Compile and run

```bash
npm run build
node dist/service-bus-demo.js
```

### Development mode (auto-restart)

```bash
npm run dev
```

## Demo Flow

The program demonstrates the following sequence:

1. **Sends a single message** to the queue with metadata
2. **Sends a batch of 5 messages** efficiently using message batching
3. **Receives and processes messages** from the queue using pull model
4. **Completes messages** after successful processing
5. **Subscribes to queue** using event-driven push model with handlers
6. **Sends messages to a topic** for pub/sub pattern
7. **Receives from subscription** demonstrating fan-out messaging

## Code Structure

```typescript
// Create client with connection string
const client = new ServiceBusClient(connectionString);

// Queue sender
const sender = client.createSender(queueName);

// Send single message
await sender.sendMessages({ body: { ... } });

// Send batch
const batch = await sender.createMessageBatch();
batch.tryAddMessage({ body: { ... } });
await sender.sendMessages(batch);

// Queue receiver (pull)
const receiver = client.createReceiver(queueName);
const messages = await receiver.receiveMessages(10);
await receiver.completeMessage(message);

// Queue subscriber (push)
receiver.subscribe({
  processMessage: async (message) => { /* ... */ },
  processError: async (args) => { /* ... */ }
});

// Topic sender
const topicSender = client.createSender(topicName);
await topicSender.sendMessages({ body: { ... } });

// Subscription receiver
const subReceiver = client.createReceiver(topicName, subscriptionName);
const messages = await subReceiver.receiveMessages(10);

// Always close resources
await sender.close();
await receiver.close();
await client.close();
```

## Key Concepts

### Queue vs Topic

- **Queue**: Point-to-point messaging (one consumer per message)
- **Topic/Subscription**: Pub/sub messaging (multiple consumers per message)

### Receive Modes

- **Peek-Lock** (default): Message locked until completed/abandoned
- **Receive-and-Delete**: Message removed immediately on receive

### Message Settlement

- `completeMessage()` - Remove from queue (success)
- `abandonMessage()` - Return to queue (retry)
- `deadLetterMessage()` - Move to dead-letter queue (poison message)
- `deferMessage()` - Defer for later processing

### Processing Patterns

- **Pull Model**: `receiveMessages()` - Application polls for messages
- **Push Model**: `subscribe()` - Messages pushed to handlers (recommended)

## Best Practices

1. ✅ Reuse `ServiceBusClient` - create once, share across senders/receivers
2. ✅ Always close resources - use `finally` blocks or try-with-resources
3. ✅ Use batching for multiple messages - more efficient than individual sends
4. ✅ Implement error handlers - handle transient and permanent failures
5. ✅ Use peek-lock mode - ensures at-least-once delivery
6. ✅ Set appropriate timeouts - balance responsiveness vs. efficiency
7. ✅ Monitor dead-letter queues - handle poison messages

## Error Handling

The demo includes comprehensive error handling:

```typescript
receiver.subscribe({
  processMessage: async (message) => {
    // Process message
  },
  processError: async (args) => {
    console.error(`Error source: ${args.errorSource}`);
    console.error(`Error: ${args.error.message}`);
    
    // Handle different error sources
    switch (args.errorSource) {
      case "receive": // Connection issues
      case "processMessageCallback": // Handler errors
      case "renewLock": // Lock renewal failures
    }
  }
});
```

## Cleanup

The demo automatically closes all resources:

```typescript
finally {
  await sender.close();
  await receiver.close();
  await client.close();
}
```

## Troubleshooting

### Connection Issues

- Verify connection string is correct
- Check firewall rules allow Service Bus access
- Ensure namespace exists and is active

### Queue/Topic Not Found

- Create queue/topic in Azure Portal or via Azure CLI
- Verify entity names match configuration

### Messages Not Received

- Check messages were sent successfully
- Verify receiver is connected to correct queue/subscription
- Check message time-to-live hasn't expired

## References

- [Azure Service Bus Documentation](https://learn.microsoft.com/azure/service-bus-messaging/)
- [@azure/service-bus NPM Package](https://www.npmjs.com/package/@azure/service-bus)
- [Azure Service Bus SDK for JavaScript](https://learn.microsoft.com/javascript/api/overview/azure/service-bus-readme)

## License

MIT
