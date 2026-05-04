# Azure Service Bus TypeScript Demonstration

This program demonstrates comprehensive Azure Service Bus messaging operations in TypeScript.

## Features Demonstrated

### 1. **ServiceBusClient Creation**
- Creating a client using connection string
- Proper resource management with `close()`

### 2. **Queue Operations**
- ✅ Sending a single message
- ✅ Sending a batch of 5 messages using `createMessageBatch()` and `tryAddMessage()`
- ✅ Receiving messages with `receiveMessages()`
- ✅ Completing messages with `completeMessage()`
- ✅ Subscribing to messages with `subscribe()` (processMessage/processError handlers)

### 3. **Topic/Subscription Operations**
- ✅ Sending messages to a topic
- ✅ Receiving messages from a subscription

## Prerequisites

1. **Azure Service Bus Namespace**
   - Create a Service Bus namespace in Azure Portal
   - Create a queue named `demo-queue`
   - Create a topic named `demo-topic`
   - Create a subscription named `demo-subscription` under the topic

2. **Connection String**
   - Get your connection string from Azure Portal
   - Set it as an environment variable or update the code

## Installation

```bash
npm install
```

## Required Package

```bash
npm install @azure/service-bus
```

## Configuration

Set your Service Bus connection string:

```bash
# Linux/Mac
export SERVICE_BUS_CONNECTION_STRING="Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=your-key"

# Windows (PowerShell)
$env:SERVICE_BUS_CONNECTION_STRING="Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=your-key"

# Windows (CMD)
set SERVICE_BUS_CONNECTION_STRING=Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=your-key
```

Or update the connection string directly in the code (line 11).

## Running the Demo

```bash
# Using ts-node
npm start

# Or compile and run
npm run build
node dist/azure-service-bus-demo.js
```

## Code Structure

### Main Operations

1. **demonstrateQueueOperations()**
   - Creates ServiceBusClient
   - Sends single message
   - Sends batch of 5 messages
   - Receives messages in batch mode
   - Subscribes to messages with handlers
   - Proper cleanup with close()

2. **demonstrateTopicSubscriptionOperations()**
   - Sends messages to topic
   - Receives messages from subscription
   - Demonstrates application properties
   - Proper cleanup with close()

### Key Concepts

- **Message Batching**: Efficiently send multiple messages with size checking
- **Receive Modes**: Both pull (receiveMessages) and push (subscribe) patterns
- **Message Completion**: Explicit completion to remove from queue
- **Error Handling**: Process errors with processError handler
- **Resource Management**: Proper cleanup of senders, receivers, and clients

## Sample Output

```
╔═══════════════════════════════════════════════════╗
║  Azure Service Bus TypeScript Demonstration      ║
╚═══════════════════════════════════════════════════╝

╔═══════════════════════════════════════╗
║  QUEUE OPERATIONS DEMONSTRATION       ║
╚═══════════════════════════════════════╝

=== Sending Single Message ===
✓ Single message sent successfully

=== Sending Batch of 5 Messages ===
✓ Added message 1 to batch
✓ Added message 2 to batch
...

✅ All demonstrations completed successfully!
```

## Cleanup Best Practices

The program demonstrates proper cleanup:
1. Close sender: `await sender.close()`
2. Close receiver: `await receiver.close()`
3. Close subscription: `await subscription.close()`
4. Close client: `await sbClient.close()`

## Error Handling

- Try-catch blocks for all async operations
- processError handler in subscribe mode
- Proper error logging and exit codes

## Learn More

- [@azure/service-bus npm package](https://www.npmjs.com/package/@azure/service-bus)
- [Azure Service Bus Documentation](https://docs.microsoft.com/azure/service-bus-messaging/)
- [TypeScript SDK Reference](https://docs.microsoft.com/javascript/api/@azure/service-bus/)
