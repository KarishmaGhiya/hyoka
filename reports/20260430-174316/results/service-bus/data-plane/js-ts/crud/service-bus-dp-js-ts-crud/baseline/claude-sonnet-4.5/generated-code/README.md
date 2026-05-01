# Azure Service Bus TypeScript Demo

This demo showcases all major Azure Service Bus messaging patterns in TypeScript.

## Prerequisites

- Node.js (v16 or later)
- Azure Service Bus namespace with:
  - A queue named `demo-queue`
  - A topic named `demo-topic`
  - A subscription named `demo-subscription` under the topic

## Installation

```bash
npm install
```

## Required Package

- **@azure/service-bus** (v7.9.5 or later)

## Configuration

Set your Azure Service Bus connection string:

```bash
# Windows (PowerShell)
$env:SERVICE_BUS_CONNECTION_STRING="Endpoint=sb://..."

# Windows (Command Prompt)
set SERVICE_BUS_CONNECTION_STRING=Endpoint=sb://...

# Linux/macOS
export SERVICE_BUS_CONNECTION_STRING="Endpoint=sb://..."
```

Or modify the connection string directly in the code.

## Running the Demo

```bash
# Run with ts-node (no compilation needed)
npm start

# Or compile and run
npm run build
npm run start:compiled
```

## Features Demonstrated

1. ✅ **ServiceBusClient** - Create client using connection string
2. ✅ **Send Single Message** - Send a single message to a queue
3. ✅ **Send Batch Messages** - Use `createMessageBatch()` and `tryAddMessage()` to send 5 messages
4. ✅ **Receive Messages** - Use `receiveMessages()` to pull messages from a queue
5. ✅ **Complete Messages** - Use `completeMessage()` to acknowledge processing
6. ✅ **Subscribe Pattern** - Use `subscribe()` with `processMessage` and `processError` handlers
7. ✅ **Topic/Subscription** - Send to topic and receive from subscription
8. ✅ **Proper Cleanup** - Close all senders, receivers, and clients

## Code Structure

- `sendSingleMessage()` - Demonstrates sending a single message
- `sendBatchMessages()` - Demonstrates batch sending with size management
- `receiveAndCompleteMessages()` - Demonstrates pull-based message receiving
- `subscribeToMessages()` - Demonstrates push-based message subscription
- `topicSubscriptionDemo()` - Demonstrates topic/subscription pub-sub pattern

## Additional Message Operations

The `@azure/service-bus` package also supports:

- `abandonMessage()` - Return message to queue for reprocessing
- `deferMessage()` - Defer message for later retrieval
- `deadLetterMessage()` - Move message to dead-letter queue
- `renewMessageLock()` - Extend message lock duration
- `scheduleMessages()` - Schedule messages for future delivery

## Resources

- [Azure Service Bus Documentation](https://learn.microsoft.com/azure/service-bus-messaging/)
- [@azure/service-bus npm package](https://www.npmjs.com/package/@azure/service-bus)
