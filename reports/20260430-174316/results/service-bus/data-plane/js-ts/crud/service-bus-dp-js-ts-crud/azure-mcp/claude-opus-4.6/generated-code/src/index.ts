import {
  ServiceBusClient,
  type ServiceBusMessage,
  type ServiceBusReceivedMessage,
  type ServiceBusReceiver,
  type ServiceBusSender,
} from "@azure/service-bus";

// Replace with your actual connection string and entity names
const connectionString =
  process.env.SERVICE_BUS_CONNECTION_STRING ||
  "Endpoint=sb://<namespace>.servicebus.windows.net/;SharedAccessKeyName=<key-name>;SharedAccessKey=<key>";
const queueName = process.env.QUEUE_NAME || "my-queue";
const topicName = process.env.TOPIC_NAME || "my-topic";
const subscriptionName = process.env.SUBSCRIPTION_NAME || "my-subscription";

// ---------------------------------------------------------------------------
// 1. Create a ServiceBusClient using a connection string
// ---------------------------------------------------------------------------
async function sendSingleMessage(sender: ServiceBusSender): Promise<void> {
  const message: ServiceBusMessage = {
    body: "Hello from Azure Service Bus!",
    contentType: "text/plain",
    subject: "greeting",
    applicationProperties: { source: "demo-app" },
  };
  await sender.sendMessages(message);
  console.log("  Single message sent successfully.");
}

// ---------------------------------------------------------------------------
// 2. Send a batch of 5 messages using createMessageBatch / tryAddMessage
// ---------------------------------------------------------------------------
async function sendBatchMessages(sender: ServiceBusSender): Promise<void> {
  const batch = await sender.createMessageBatch();

  for (let i = 1; i <= 5; i++) {
    const message: ServiceBusMessage = {
      body: { orderId: i, item: `item-${i}`, quantity: i * 10 },
      contentType: "application/json",
      subject: `order-${i}`,
      messageId: `batch-msg-${i}`,
    };

    if (!batch.tryAddMessage(message)) {
      throw new Error(`Message ${i} is too large for the batch.`);
    }
  }

  await sender.sendMessages(batch);
  console.log(`  Batch of ${batch.count} messages sent successfully.`);
}

// ---------------------------------------------------------------------------
// 3. Receive messages with receiveMessages() and complete them
// ---------------------------------------------------------------------------
async function receiveAndComplete(
  receiver: ServiceBusReceiver
): Promise<void> {
  // Wait up to 5 seconds for messages (peekLock mode by default)
  const messages: ServiceBusReceivedMessage[] = await receiver.receiveMessages(
    10,
    { maxWaitTimeInMs: 5000 }
  );

  console.log(`  Received ${messages.length} message(s).`);

  for (const msg of messages) {
    console.log(`    -> Body: ${JSON.stringify(msg.body)}`);

    // Complete the message so it is removed from the queue
    await receiver.completeMessage(msg);
    console.log(`       Message completed.`);
  }
}

// ---------------------------------------------------------------------------
// 4. Subscribe to messages using subscribe() with handlers
// ---------------------------------------------------------------------------
async function subscribeToMessages(
  receiver: ServiceBusReceiver
): Promise<void> {
  return new Promise<void>((resolve) => {
    let messageCount = 0;

    const subscription = receiver.subscribe(
      {
        async processMessage(message: ServiceBusReceivedMessage) {
          console.log(
            `    [subscribe] Received: ${JSON.stringify(message.body)}`
          );
          await receiver.completeMessage(message);
          messageCount++;

          // Stop after processing all expected messages
          if (messageCount >= 5) {
            await subscription.close();
            resolve();
          }
        },

        async processError(args) {
          console.error(`    [subscribe] Error: ${args.error.message}`);
          console.error(`    Source: ${args.errorSource}`);
        },
      },
      { autoCompleteMessages: false }
    );

    // Timeout safety – resolve after 10 seconds even if fewer messages arrive
    setTimeout(async () => {
      await subscription.close();
      resolve();
    }, 10_000);
  });
}

// ---------------------------------------------------------------------------
// 5. Topic / Subscription: send to a topic and receive from a subscription
// ---------------------------------------------------------------------------
async function topicDemo(client: ServiceBusClient): Promise<void> {
  const topicSender = client.createSender(topicName);

  // Send messages to the topic
  const messages: ServiceBusMessage[] = [
    { body: "Topic message 1", subject: "info" },
    { body: "Topic message 2", subject: "warning" },
    { body: "Topic message 3", subject: "error" },
  ];
  await topicSender.sendMessages(messages);
  console.log(`  Sent ${messages.length} messages to topic "${topicName}".`);
  await topicSender.close();

  // Receive from a subscription on that topic
  const subReceiver = client.createReceiver(topicName, subscriptionName);
  const received = await subReceiver.receiveMessages(10, {
    maxWaitTimeInMs: 5000,
  });

  console.log(
    `  Received ${received.length} message(s) from subscription "${subscriptionName}".`
  );
  for (const msg of received) {
    console.log(`    -> Subject: ${msg.subject}, Body: ${msg.body}`);
    await subReceiver.completeMessage(msg);
  }

  await subReceiver.close();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  // 1. Create the ServiceBusClient
  const client = new ServiceBusClient(connectionString);
  console.log("ServiceBusClient created.\n");

  const sender = client.createSender(queueName);
  const receiver = client.createReceiver(queueName);

  try {
    // 2. Send a single message
    console.log("--- Sending a single message ---");
    await sendSingleMessage(sender);

    // 3. Send a batch of messages
    console.log("\n--- Sending a batch of messages ---");
    await sendBatchMessages(sender);

    // 4. Receive messages and complete them
    console.log("\n--- Receiving messages (pull) ---");
    await receiveAndComplete(receiver);

    // 5. Send another batch, then subscribe to receive them
    console.log("\n--- Subscribing to messages (push) ---");
    await sendBatchMessages(sender);
    const subscribeReceiver = client.createReceiver(queueName);
    await subscribeToMessages(subscribeReceiver);
    await subscribeReceiver.close();

    // 6. Topic and subscription demo
    console.log("\n--- Topic / Subscription demo ---");
    await topicDemo(client);
  } finally {
    // Proper cleanup – always close senders, receivers, and the client
    await sender.close();
    await receiver.close();
    await client.close();
    console.log("\nAll resources closed.");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
