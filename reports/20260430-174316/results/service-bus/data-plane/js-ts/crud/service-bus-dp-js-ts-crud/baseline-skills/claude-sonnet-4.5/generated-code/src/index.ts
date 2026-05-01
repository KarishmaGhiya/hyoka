import {
  ServiceBusClient,
  ServiceBusMessage,
  ServiceBusSender,
  ServiceBusReceiver,
  ServiceBusReceivedMessage,
} from "@azure/service-bus";

// Configuration - replace with your actual connection string, queue, topic, and subscription names
const connectionString = process.env.SERVICE_BUS_CONNECTION_STRING || "Endpoint=sb://YOUR_NAMESPACE.servicebus.windows.net/;SharedAccessKeyName=YOUR_KEY_NAME;SharedAccessKey=YOUR_KEY";
const queueName = "demo-queue";
const topicName = "demo-topic";
const subscriptionName = "demo-subscription";

async function main() {
  console.log("=== Azure Service Bus Demo ===\n");

  // 1. Create a ServiceBusClient using a connection string
  console.log("1. Creating ServiceBusClient...");
  const serviceBusClient = new ServiceBusClient(connectionString);
  console.log("   ✓ ServiceBusClient created\n");

  try {
    // Demo queue operations
    await demonstrateQueueOperations(serviceBusClient);

    // Demo topic/subscription operations
    await demonstrateTopicOperations(serviceBusClient);

  } finally {
    // Cleanup: Close the ServiceBusClient
    console.log("\nClosing ServiceBusClient...");
    await serviceBusClient.close();
    console.log("✓ ServiceBusClient closed");
  }
}

async function demonstrateQueueOperations(serviceBusClient: ServiceBusClient) {
  console.log("=== Queue Operations ===\n");

  // 2. Create a sender for a queue and send a single message
  console.log("2. Sending a single message to queue...");
  const sender: ServiceBusSender = serviceBusClient.createSender(queueName);

  try {
    const singleMessage: ServiceBusMessage = {
      body: { text: "This is a single message" },
      contentType: "application/json",
      subject: "Single Message Demo",
      messageId: "msg-001",
    };

    await sender.sendMessages(singleMessage);
    console.log(`   ✓ Sent single message with ID: ${singleMessage.messageId}\n`);

    // 3. Send a batch of 5 messages using createMessageBatch() and tryAddMessage()
    console.log("3. Sending a batch of messages...");
    const batch = await sender.createMessageBatch();

    for (let i = 1; i <= 5; i++) {
      const message: ServiceBusMessage = {
        body: { text: `Batch message ${i}`, index: i },
        contentType: "application/json",
        messageId: `batch-msg-${i}`,
      };

      const added = batch.tryAddMessage(message);
      if (!added) {
        console.log(`   ⚠ Message ${i} was too large to fit in the batch`);
        // Send current batch and create a new one
        await sender.sendMessages(batch);
        batch.tryAddMessage(message);
      } else {
        console.log(`   ✓ Added message ${i} to batch`);
      }
    }

    await sender.sendMessages(batch);
    console.log("   ✓ Batch sent successfully\n");

  } finally {
    await sender.close();
    console.log("   Sender closed\n");
  }

  // 4. Create a receiver and receive messages using receiveMessages()
  console.log("4. Receiving messages with receiveMessages()...");
  const receiver: ServiceBusReceiver = serviceBusClient.createReceiver(queueName);

  try {
    const messages = await receiver.receiveMessages(3, { maxWaitTimeInMs: 5000 });
    console.log(`   ✓ Received ${messages.length} messages\n`);

    // 5. Complete a message with completeMessage() after processing
    console.log("5. Processing and completing messages...");
    for (const message of messages) {
      console.log(`   Processing message ID: ${message.messageId}`);
      console.log(`   Body: ${JSON.stringify(message.body)}`);
      console.log(`   Delivery count: ${message.deliveryCount}`);

      // Simulate message processing
      await processMessage(message);

      // Complete the message to remove it from the queue
      await receiver.completeMessage(message);
      console.log(`   ✓ Completed message: ${message.messageId}\n`);
    }

  } finally {
    await receiver.close();
    console.log("   Receiver closed\n");
  }

  // 6. Subscribe to messages using subscribe() with processMessage and processError handlers
  console.log("6. Subscribing to messages with message handler...");
  const subscriber = serviceBusClient.createReceiver(queueName);

  const subscription = subscriber.subscribe({
    processMessage: async (message: ServiceBusReceivedMessage) => {
      console.log(`   📨 Received via subscription: ${message.messageId}`);
      console.log(`   Body: ${JSON.stringify(message.body)}`);
      await processMessage(message);
      // Message is automatically completed when processMessage completes successfully
    },
    processError: async (error) => {
      console.error(`   ❌ Error in subscription: ${error.message}`);
    },
  });

  // Let the subscription run for a few seconds to receive any remaining messages
  console.log("   Listening for messages (3 seconds)...");
  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log("   Closing subscription...");
  await subscription.close();
  await subscriber.close();
  console.log("   ✓ Subscription closed\n");
}

async function demonstrateTopicOperations(serviceBusClient: ServiceBusClient) {
  console.log("=== Topic/Subscription Operations ===\n");

  // 7. Demonstrate sending to a topic and receiving from a subscription
  console.log("7. Sending messages to a topic...");
  const topicSender = serviceBusClient.createSender(topicName);

  try {
    const topicMessages: ServiceBusMessage[] = [
      {
        body: { event: "OrderCreated", orderId: "ORD-001", amount: 99.99 },
        contentType: "application/json",
        subject: "OrderCreated",
        messageId: "topic-msg-001",
      },
      {
        body: { event: "OrderShipped", orderId: "ORD-001", carrier: "FastShip" },
        contentType: "application/json",
        subject: "OrderShipped",
        messageId: "topic-msg-002",
      },
      {
        body: { event: "OrderDelivered", orderId: "ORD-001" },
        contentType: "application/json",
        subject: "OrderDelivered",
        messageId: "topic-msg-003",
      },
    ];

    for (const message of topicMessages) {
      await topicSender.sendMessages(message);
      console.log(`   ✓ Sent to topic: ${message.subject} (${message.messageId})`);
    }
    console.log();

  } finally {
    await topicSender.close();
  }

  // Receive from subscription
  console.log("   Receiving from subscription...");
  const subscriptionReceiver = serviceBusClient.createReceiver(
    topicName,
    subscriptionName
  );

  try {
    const subscription = subscriptionReceiver.subscribe({
      processMessage: async (message: ServiceBusReceivedMessage) => {
        console.log(`   📨 Subscription received: ${message.subject}`);
        console.log(`   Message ID: ${message.messageId}`);
        console.log(`   Body: ${JSON.stringify(message.body)}`);
        console.log(`   Application properties:`, message.applicationProperties);
        await processMessage(message);
      },
      processError: async (error) => {
        console.error(`   ❌ Subscription error: ${error.message}`);
      },
    });

    // Let subscription run for a few seconds
    console.log("   Listening to subscription (3 seconds)...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    await subscription.close();
    console.log("   ✓ Subscription closed\n");

  } finally {
    await subscriptionReceiver.close();
  }
}

async function processMessage(message: ServiceBusReceivedMessage): Promise<void> {
  // Simulate message processing
  await new Promise((resolve) => setTimeout(resolve, 100));
}

// Run the demo
main()
  .then(() => {
    console.log("\n✓ Demo completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    console.error(error);
    process.exit(1);
  });
