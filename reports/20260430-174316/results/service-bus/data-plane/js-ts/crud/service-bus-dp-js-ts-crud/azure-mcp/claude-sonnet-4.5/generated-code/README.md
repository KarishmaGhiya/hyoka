# Azure Service Bus Demo - TypeScript

A comprehensive demonstration of Azure Service Bus messaging capabilities in TypeScript.

## Features Demonstrated

1. **ServiceBusClient Creation** - Initialize client with connection string
2. **Single Message Sending** - Send individual messages to a queue
3. **Batch Message Sending** - Use `createMessageBatch()` and `tryAddMessage()` for efficient batch operations
4. **Pull-based Receiving** - Receive messages using `receiveMessages()`
5. **Message Completion** - Complete messages with `completeMessage()` after processing
6. **Push-based Subscription** - Subscribe to messages with `processMessage` and `processError` handlers
7. **Topic/Subscription Pattern** - Send to topics and receive from subscriptions

## Prerequisites

- Node.js 18+ and npm
- Azure Service Bus namespace
- A queue named `demo-queue`
- A topic named `demo-topic` with a subscription named `demo-subscription`

## Installation

```bash
npm install
```

## Configuration

Set your Service Bus connection string as an environment variable:

**Windows (PowerShell):**
```powershell
$env:SERVICE_BUS_CONNECTION_STRING="Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=your-key"
```

**Linux/Mac:**
```bash
export SERVICE_BUS_CONNECTION_STRING="Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=your-key"
```

Or modify the `CONNECTION_STRING` variable in the code directly.

## Usage

**Run with ts-node:**
```bash
npm start
```

**Build and run:**
```bash
npm run build
node dist/azure-service-bus-demo.js
```

**Development mode with auto-reload:**
```bash
npm run dev
```

## Code Structure

The demo includes the following functions:

- `sendSingleMessage()` - Demonstrates sending a single message
- `sendBatchMessages()` - Demonstrates batch sending with size management
- `receiveMessages()` - Demonstrates pull-based message receiving
- `subscribeToMessages()` - Demonstrates push-based message subscription
- `demonstrateTopicSubscription()` - Demonstrates topic/subscription messaging

## Key Concepts

### Message Batch
```typescript
const batch = await sender.createMessageBatch();
batch.tryAddMessage(message); // Returns true if added, false if too large
await sender.sendMessages(batch);
```

### Receive Modes
- **PeekLock** (default): Messages are locked and require explicit completion
- **ReceiveAndDelete**: Messages are automatically deleted upon receipt

### Message Completion
```typescript
await receiver.completeMessage(message); // Success
await receiver.abandonMessage(message);  // Retry later
await receiver.deadLetterMessage(message); // Move to dead-letter queue
await receiver.deferMessage(message);    // Defer for later processing
```

### Subscription Options
```typescript
receiver.subscribe({
  processMessage: async (message) => { /* handle message */ },
  processError: async (error) => { /* handle error */ }
}, {
  autoCompleteMessages: true,    // Auto-complete on success
  maxConcurrentCalls: 1          // Process one message at a time
});
```

## Resource Cleanup

The demo properly closes all resources:
- Senders are closed with `await sender.close()`
- Receivers are closed with `await receiver.close()`
- Subscriptions are closed with `await subscription.close()`
- Client is closed with `await client.close()`

## Error Handling

All operations include proper try-catch-finally blocks to ensure resources are cleaned up even if errors occur.

## Dependencies

- `@azure/service-bus` (^7.9.4) - Azure Service Bus client library

## License

MIT
