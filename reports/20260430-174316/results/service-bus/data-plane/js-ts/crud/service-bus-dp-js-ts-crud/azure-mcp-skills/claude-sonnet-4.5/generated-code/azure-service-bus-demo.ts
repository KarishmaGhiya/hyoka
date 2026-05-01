import {
  ServiceBusClient,
  ServiceBusMessage,
  ServiceBusReceiver,
  ServiceBusSender,
  ProcessErrorArgs,
  ProcessMessageArgs,
} from "@azure/service-bus";

// Configuration
const connectionString = process.env.AZURE_SERVICE_BUS_CONNECTION_STRING || "<your-connection-string>";
const queueName = "demo-queue";
const topicName = "demo-topic";
const subscriptionName = "demo-subscription";

async function main() {
  console.log("Azure Service Bus TypeScript Demo\n");

  // 1. Create a ServiceBusClient using a connection string
  const serviceBusClient = new ServiceBusClient(connectionString);
  console.log("✓ ServiceBusClient created\n");

  try {
    await demonstrateQueueOperations(serviceBusClient);
    await demonstrateTopicSubscriptionOperations(serviceBusClient);
  } finally {
    // Proper cleanup
    await serviceBusClient.close();
    console.log("\n✓ ServiceBusClient closed");
  }
}

async function demonstrateQueueOperations(client: ServiceBusClient) {
  console.log("=== Queue Operations ===\n");

  // 2. Create a sender for a queue and send a single message
  const sender: ServiceBusSender = client.createSender(queueName);
  console.log(`✓ Created sender for queue: ${queueName}`);

  try {
    // Send single message
    const singleMessage: ServiceBusMessage = {
      body: { orderId: 1001, customer: "Alice" },
      contentType: "application/json",
      messageId: "msg-001",
      subject: "Order Placed",
    };

    await sender.sendMessages(singleMessage);
    console.log(`✓ Sent single message (ID: ${singleMessage.messageId})\n`);

    // 3. Send a batch of 5 messages using createMessageBatch() and tryAddMessage()
    const batch = await sender.createMessageBatch();
    console.log("✓ Created message batch");

    for (let i = 1; i <= 5; i++) {
      const message: ServiceBusMessage = {
        body: { orderId: 1000 + i, customer: `Customer-${i}`, amount: i * 100 },
        messageId: `batch-msg-${i}`,
        subject: "Batch Order",
      };

      const added = batch.tryAddMessage(message);
      if (!added) {
        console.log(`⚠ Message ${i} couldn't fit in the batch`);
        break;
      }
      console.log(`  Added message ${i} to batch`);
    }

    await sender.sendMessages(batch);
    console.log(`✓ Sent batch of ${batch.count} messages\n`);
  } finally {
    await sender.close();
    console.log("✓ Sender closed\n");
  }

  // 4. Create a receiver and receive messages using receiveMessages()
  const receiver: ServiceBusReceiver = client.createReceiver(queueName);
  console.log(`✓ Created receiver for queue: ${queueName}`);

  try {
    // Receive up to 10 messages (will get the 6 we sent)
    const messages = await receiver.receiveMessages(10, { maxWaitTimeInMs: 5000 });
    console.log(`✓ Received ${messages.length} messages\n`);

    // 5. Complete a message with completeMessage() after processing
    for (const message of messages) {
      console.log(`Processing message (ID: ${message.messageId}):`);
      console.log(`  Body: ${JSON.stringify(message.body)}`);
      console.log(`  Subject: ${message.subject}`);
      console.log(`  Delivery count: ${message.deliveryCount}`);

      // Simulate message processing
      await processMessage(message.body);

      // Complete the message to remove it from the queue
      await receiver.completeMessage(message);
      console.log(`✓ Message completed\n`);
    }
  } finally {
    await receiver.close();
    console.log("✓ Receiver closed\n");
  }

  // 6. Subscribe to messages using subscribe() with processMessage and processError handlers
  await demonstrateSubscription(client);
}

async function demonstrateSubscription(client: ServiceBusClient) {
  console.log("=== Message Subscription ===\n");

  // Send some messages first
  const sender = client.createSender(queueName);
  try {
    for (let i = 1; i <= 3; i++) {
      await sender.sendMessages({
        body: { subscriptionTest: true, messageNumber: i },
        messageId: `sub-msg-${i}`,
      });
    }
    console.log("✓ Sent 3 messages for subscription demo\n");
  } finally {
    await sender.close();
  }

  // Create receiver and subscribe
  const receiver = client.createReceiver(queueName);

  // Track processed messages for demo purposes
  let processedCount = 0;
  const maxMessages = 3;

  return new Promise<void>((resolve, reject) => {
    const subscription = receiver.subscribe({
      processMessage: async (messageContext: ProcessMessageArgs) => {
        console.log(`[Subscription] Received message (ID: ${messageContext.message.messageId}):`);
        console.log(`  Body: ${JSON.stringify(messageContext.message.body)}`);

        // Process the message
        await processMessage(messageContext.message.body);

        // Complete the message
        await messageContext.completeMessage();
        console.log(`✓ Message auto-completed\n`);

        processedCount++;
        if (processedCount >= maxMessages) {
          // Close subscription after processing all messages
          await subscription.close();
          await receiver.close();
          console.log("✓ Subscription closed\n");
          resolve();
        }
      },
      processError: async (errorContext: ProcessErrorArgs) => {
        console.error(`[Subscription] Error from source ${errorContext.errorSource}:`);
        console.error(`  Error: ${errorContext.error}`);

        // In production, implement proper error handling/retry logic
        if (errorContext.errorSource === "receive") {
          reject(errorContext.error);
        }
      },
    });

    console.log("✓ Subscribed to queue messages (waiting for messages...)\n");
  });
}

async function demonstrateTopicSubscriptionOperations(client: ServiceBusClient) {
  console.log("=== Topic and Subscription Operations ===\n");

  // 7. Demonstrate sending to a topic and receiving from a subscription
  const topicSender = client.createSender(topicName);
  console.log(`✓ Created sender for topic: ${topicName}`);

  try {
    // Send messages to topic
    const topicMessages: ServiceBusMessage[] = [
      {
        body: { event: "UserSignedUp", userId: "user-001", timestamp: new Date() },
        messageId: "topic-msg-001",
        subject: "User.SignedUp",
        applicationProperties: { eventType: "UserEvent" },
      },
      {
        body: { event: "OrderCreated", orderId: "order-001", total: 250 },
        messageId: "topic-msg-002",
        subject: "Order.Created",
        applicationProperties: { eventType: "OrderEvent" },
      },
      {
        body: { event: "PaymentProcessed", paymentId: "pay-001", amount: 250 },
        messageId: "topic-msg-003",
        subject: "Payment.Processed",
        applicationProperties: { eventType: "PaymentEvent" },
      },
    ];

    for (const message of topicMessages) {
      await topicSender.sendMessages(message);
      console.log(`  Sent to topic: ${message.subject}`);
    }
    console.log(`✓ Sent ${topicMessages.length} messages to topic\n`);
  } finally {
    await topicSender.close();
    console.log("✓ Topic sender closed\n");
  }

  // Receive from subscription
  const subscriptionReceiver = client.createReceiver(topicName, subscriptionName);
  console.log(`✓ Created receiver for subscription: ${subscriptionName}`);

  try {
    const messages = await subscriptionReceiver.receiveMessages(10, { maxWaitTimeInMs: 5000 });
    console.log(`✓ Received ${messages.length} messages from subscription\n`);

    for (const message of messages) {
      console.log(`Processing message from topic (ID: ${message.messageId}):`);
      console.log(`  Subject: ${message.subject}`);
      console.log(`  Body: ${JSON.stringify(message.body)}`);
      console.log(`  Application Properties: ${JSON.stringify(message.applicationProperties)}`);

      await processMessage(message.body);
      await subscriptionReceiver.completeMessage(message);
      console.log(`✓ Message completed\n`);
    }
  } finally {
    await subscriptionReceiver.close();
    console.log("✓ Subscription receiver closed");
  }
}

async function processMessage(messageBody: any): Promise<void> {
  // Simulate message processing
  await new Promise((resolve) => setTimeout(resolve, 100));
  console.log(`  [Processing] Handled message data`);
}

// Run the demo
main().catch((error) => {
  console.error("\n❌ Error occurred:");
  console.error(error);
  process.exit(1);
});
