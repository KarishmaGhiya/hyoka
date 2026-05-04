# Azure Service Bus TypeScript Demo

Comprehensive demonstration of Azure Service Bus messaging operations using TypeScript.

## Features Demonstrated

1. **ServiceBusClient Creation** - Using connection string authentication
2. **Single Message** - Send individual messages to a queue
3. **Batch Messages** - Send multiple messages efficiently using `createMessageBatch()` and `tryAddMessage()`
4. **Pull Mode Receiving** - Receive messages using `receiveMessages()`
5. **Message Completion** - Complete messages with `completeMessage()` after processing
6. **Push Mode Subscription** - Subscribe to messages using `subscribe()` with handlers
7. **Topic/Subscription** - Send to topics and receive from subscriptions

## Prerequisites

- Node.js 14+ and npm
- Azure Service Bus namespace with:
  - A queue named `demo-queue`
  - A topic named `demo-topic`
  - A subscription named `demo-subscription` under `demo-topic`
- Service Bus connection string

## Installation

```bash
npm install
```

## Configuration

Set your Service Bus connection string as an environment variable:

```bash
# Windows (PowerShell)
$env:SERVICE_BUS_CONNECTION_STRING="Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=your-key"

# Windows (Command Prompt)
set SERVICE_BUS_CONNECTION_STRING=Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=your-key

# Linux/Mac
export SERVICE_BUS_CONNECTION_STRING="Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=your-key"
```

Or edit the connection string directly in `azure-service-bus-demo.ts`.

## Usage

```bash
npm start
```

Or with TypeScript compiler:

```bash
npm run build
node azure-service-bus-demo.js
```

## Code Structure

### Key Components

**ServiceBusClient**
- Entry point for all Service Bus operations
- Created with connection string
- Must be closed after use

**Sender**
- Sends messages to queues or topics
- Supports single messages and batches
- Created per destination

**Receiver**
- Receives messages from queues or subscriptions
- Supports pull mode (`receiveMessages`) and push mode (`subscribe`)
- Handles message completion and abandonment

**Message Properties**
- `body` - Message payload (any JSON-serializable data)
- `messageId` - Unique identifier
- `subject` - Message label/subject
- `contentType` - Content type (e.g., "application/json")
- `applicationProperties` - Custom key-value pairs

## Message Patterns

### Pull Mode (receiveMessages)
```typescript
const messages = await receiver.receiveMessages(10, { maxWaitTimeInMs: 10000 });
for (const message of messages) {
    // Process message
    await receiver.completeMessage(message);
}
```

### Push Mode (subscribe)
```typescript
const subscription = receiver.subscribe({
    processMessage: async (message) => {
        // Process message (auto-completed)
    },
    processError: async (error) => {
        // Handle errors
    }
});
```

### Batch Sending
```typescript
const batch = await sender.createMessageBatch();
for (const msg of messages) {
    if (!batch.tryAddMessage(msg)) {
        // Batch full - send and create new batch
        await sender.sendMessages(batch);
    }
}
await sender.sendMessages(batch);
```

## Cleanup

The demo properly closes all resources:
- Senders are closed after sending
- Receivers are closed after receiving
- Subscriptions are closed when done
- ServiceBusClient is closed in finally block

## Error Handling

The demo includes:
- Try-finally blocks for resource cleanup
- Error handlers for subscriptions
- Delivery count tracking for poison messages

## Reference

- [@azure/service-bus Documentation](https://www.npmjs.com/package/@azure/service-bus)
- [Azure Service Bus Documentation](https://docs.microsoft.com/azure/service-bus-messaging/)
