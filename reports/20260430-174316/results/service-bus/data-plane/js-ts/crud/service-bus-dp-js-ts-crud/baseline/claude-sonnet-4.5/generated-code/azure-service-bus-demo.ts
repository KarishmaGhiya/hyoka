import {
  ServiceBusClient,
  ServiceBusMessage,
  ServiceBusReceiver,
  ServiceBusSender,
} from "@azure/service-bus";

// Azure Service Bus connection string
const connectionString = process.env.SERVICE_BUS_CONNECTION_STRING || "<your-connection-string>";
const queueName = "demo-queue";
const topicName = "demo-topic";
const subscriptionName = "demo-subscription";

async function main() {
  // 1. Create a ServiceBusClient using a connection string
  const serviceBusClient = new ServiceBusClient(connectionString);
  console.log("✓ ServiceBusClient created");

  try {
    // 2. Create a sender for a queue and send a single message
    await sendSingleMessage(serviceBusClient);

    // 3. Send a batch of 5 messages using createMessageBatch() and tryAddMessage()
    await sendBatchMessages(serviceBusClient);

    // 4. Create a receiver and receive messages using receiveMessages()
    // 5. Complete a message with completeMessage() after processing
    await receiveAndCompleteMessages(serviceBusClient);

    // 6. Subscribe to messages using subscribe() with processMessage and processError handlers
    await subscribeToMessages(serviceBusClient);

    // 7. Demonstrate sending to a topic and receiving from a subscription
    await topicSubscriptionDemo(serviceBusClient);
  } finally {
    // Proper cleanup: close the ServiceBusClient
    await serviceBusClient.close();
    console.log("\n✓ ServiceBusClient closed");
  }
}

// 2. Send a single message to a queue
async function sendSingleMessage(client: ServiceBusClient): Promise<void> {
  console.log("\n--- Sending Single Message ---");
  const sender: ServiceBusSender = client.createSender(queueName);

  try {
    const message: ServiceBusMessage = {
      body: { orderId: "12345", product: "Laptop" },
      contentType: "application/json",
      messageId: "single-msg-1",
    };

    await sender.sendMessages(message);
    console.log(`✓ Sent single message: ${message.messageId}`);
  } finally {
    await sender.close();
  }
}

// 3. Send a batch of 5 messages using createMessageBatch() and tryAddMessage()
async function sendBatchMessages(client: ServiceBusClient): Promise<void> {
  console.log("\n--- Sending Batch Messages ---");
  const sender: ServiceBusSender = client.createSender(queueName);

  try {
    // Create a batch object
    const batch = await sender.createMessageBatch();
    console.log("✓ Message batch created");

    // Try to add 5 messages to the batch
    for (let i = 1; i <= 5; i++) {
      const message: ServiceBusMessage = {
        body: { batchId: i, data: `Batch message ${i}` },
        messageId: `batch-msg-${i}`,
      };

      const isAdded = batch.tryAddMessage(message);
      if (isAdded) {
        console.log(`  ✓ Added message ${i} to batch`);
      } else {
        console.log(`  ✗ Message ${i} too large for batch, sending current batch`);
        // Send current batch and create a new one
        await sender.sendMessages(batch);
        batch.tryAddMessage(message);
      }
    }

    // Send the batch
    await sender.sendMessages(batch);
    console.log("✓ Batch sent successfully");
  } finally {
    await sender.close();
  }
}

// 4 & 5. Receive messages using receiveMessages() and complete them
async function receiveAndCompleteMessages(client: ServiceBusClient): Promise<void> {
  console.log("\n--- Receiving and Completing Messages ---");
  const receiver: ServiceBusReceiver = client.createReceiver(queueName);

  try {
    // Receive up to 10 messages with a 5-second wait time
    const messages = await receiver.receiveMessages(10, { maxWaitTimeInMs: 5000 });
    console.log(`✓ Received ${messages.length} messages`);

    // Process and complete each message
    for (const message of messages) {
      console.log(`\n  Processing message: ${message.messageId}`);
      console.log(`  Body: ${JSON.stringify(message.body)}`);
      console.log(`  Delivery count: ${message.deliveryCount}`);

      // Simulate message processing
      // In real scenarios, perform your business logic here

      // 5. Complete the message to remove it from the queue
      await receiver.completeMessage(message);
      console.log(`  ✓ Message ${message.messageId} completed`);
    }
  } finally {
    await receiver.close();
  }
}

// 6. Subscribe to messages with processMessage and processError handlers
async function subscribeToMessages(client: ServiceBusClient): Promise<void> {
  console.log("\n--- Subscribing to Messages ---");
  const receiver: ServiceBusReceiver = client.createReceiver(queueName);

  // Subscribe with message and error handlers
  const subscription = receiver.subscribe({
    processMessage: async (message) => {
      console.log(`\n  [Subscription] Received: ${message.messageId}`);
      console.log(`  [Subscription] Body: ${JSON.stringify(message.body)}`);
      
      // Message is automatically completed after processMessage returns
      // unless you explicitly abandon, defer, or deadletter it
    },
    processError: async (error) => {
      console.error(`  [Subscription] Error: ${error.message}`);
    },
  });

  console.log("✓ Subscription active, listening for messages...");

  // Let the subscription run for 10 seconds
  await new Promise((resolve) => setTimeout(resolve, 10000));

  // Close the subscription
  await subscription.close();
  console.log("✓ Subscription closed");

  await receiver.close();
}

// 7. Demonstrate sending to a topic and receiving from a subscription
async function topicSubscriptionDemo(client: ServiceBusClient): Promise<void> {
  console.log("\n--- Topic and Subscription Demo ---");

  // Send messages to a topic
  const topicSender: ServiceBusSender = client.createSender(topicName);

  try {
    const topicMessages: ServiceBusMessage[] = [
      {
        body: { event: "UserCreated", userId: "user-001" },
        messageId: "topic-msg-1",
        subject: "user-events",
      },
      {
        body: { event: "OrderPlaced", orderId: "order-001" },
        messageId: "topic-msg-2",
        subject: "order-events",
      },
      {
        body: { event: "PaymentProcessed", paymentId: "pay-001" },
        messageId: "topic-msg-3",
        subject: "payment-events",
      },
    ];

    await topicSender.sendMessages(topicMessages);
    console.log(`✓ Sent ${topicMessages.length} messages to topic: ${topicName}`);
  } finally {
    await topicSender.close();
  }

  // Receive messages from a topic subscription
  const subscriptionReceiver: ServiceBusReceiver = client.createReceiver(
    topicName,
    subscriptionName
  );

  try {
    const messages = await subscriptionReceiver.receiveMessages(10, {
      maxWaitTimeInMs: 5000,
    });
    console.log(`✓ Received ${messages.length} messages from subscription: ${subscriptionName}`);

    for (const message of messages) {
      console.log(`\n  Topic Message: ${message.messageId}`);
      console.log(`  Subject: ${message.subject}`);
      console.log(`  Body: ${JSON.stringify(message.body)}`);

      await subscriptionReceiver.completeMessage(message);
      console.log(`  ✓ Completed message: ${message.messageId}`);
    }
  } finally {
    await subscriptionReceiver.close();
  }
}

// Run the demo
main().catch((error) => {
  console.error("Error running demo:", error);
  process.exit(1);
});
