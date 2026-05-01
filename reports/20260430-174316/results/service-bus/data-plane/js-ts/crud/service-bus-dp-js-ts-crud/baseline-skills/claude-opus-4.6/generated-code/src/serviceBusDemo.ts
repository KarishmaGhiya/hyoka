import {
  ServiceBusClient,
  ServiceBusMessage,
  ServiceBusReceivedMessage,
  ServiceBusSender,
  ServiceBusReceiver,
  ProcessErrorArgs,
} from "@azure/service-bus";

// ---------------------------------------------------------------------------
// Configuration – set these environment variables before running
// ---------------------------------------------------------------------------
const connectionString =
  process.env.SERVICEBUS_CONNECTION_STRING ||
  "<your-service-bus-connection-string>";
const queueName = process.env.SERVICEBUS_QUEUE_NAME || "demo-queue";
const topicName = process.env.SERVICEBUS_TOPIC_NAME || "demo-topic";
const subscriptionName =
  process.env.SERVICEBUS_SUBSCRIPTION_NAME || "demo-subscription";

// ---------------------------------------------------------------------------
// 1. Create ServiceBusClient
// ---------------------------------------------------------------------------
async function createClient(): Promise<ServiceBusClient> {
  const client = new ServiceBusClient(connectionString);
  console.log("ServiceBusClient created successfully.");
  return client;
}

// ---------------------------------------------------------------------------
// 2. Send a single message to a queue
// ---------------------------------------------------------------------------
async function sendSingleMessage(sender: ServiceBusSender): Promise<void> {
  const message: ServiceBusMessage = {
    body: "Hello from Azure Service Bus!",
    contentType: "text/plain",
    subject: "greeting",
    applicationProperties: { source: "demo-app" },
  };

  await sender.sendMessages(message);
  console.log("Single message sent to queue.");
}

// ---------------------------------------------------------------------------
// 3. Send a batch of messages using createMessageBatch / tryAddMessage
// ---------------------------------------------------------------------------
async function sendBatchMessages(sender: ServiceBusSender): Promise<void> {
  const batch = await sender.createMessageBatch();

  for (let i = 1; i <= 5; i++) {
    const message: ServiceBusMessage = {
      body: `Batch message #${i}`,
      applicationProperties: { index: i },
    };

    if (!batch.tryAddMessage(message)) {
      throw new Error(`Message #${i} is too large for the batch.`);
    }
  }

  await sender.sendMessages(batch);
  console.log(`Batch of ${batch.count} messages sent to queue.`);
}

// ---------------------------------------------------------------------------
// 4 & 5. Receive messages with receiveMessages() and complete them
// ---------------------------------------------------------------------------
async function receiveAndCompleteMessages(
  receiver: ServiceBusReceiver
): Promise<void> {
  console.log("Waiting for messages (receiveMessages)...");
  const messages: ServiceBusReceivedMessage[] = await receiver.receiveMessages(
    10, // max message count
    { maxWaitTimeInMs: 5000 }
  );

  console.log(`Received ${messages.length} message(s).`);

  for (const msg of messages) {
    console.log(`  → Body: ${msg.body}`);
    // 5. Complete message after processing
    await receiver.completeMessage(msg);
    console.log(`    ✓ Message completed.`);
  }
}

// ---------------------------------------------------------------------------
// 6. Subscribe to messages with processMessage / processError handlers
// ---------------------------------------------------------------------------
async function subscribeToMessages(
  receiver: ServiceBusReceiver
): Promise<void> {
  return new Promise<void>((resolve) => {
    let messageCount = 0;

    const subscription = receiver.subscribe({
      async processMessage(message: ServiceBusReceivedMessage): Promise<void> {
        console.log(`  [subscribe] Body: ${message.body}`);
        await receiver.completeMessage(message);
        messageCount++;

        // Stop after receiving a few messages for demo purposes
        if (messageCount >= 3) {
          await subscription.close();
          resolve();
        }
      },

      async processError(args: ProcessErrorArgs): Promise<void> {
        console.error(`Error source: ${args.errorSource}`);
        console.error(`Error:`, args.error);
      },
    });

    // Safety timeout so the demo doesn't hang forever
    setTimeout(async () => {
      await subscription.close();
      resolve();
    }, 10_000);
  });
}

// ---------------------------------------------------------------------------
// 7. Send to a topic and receive from a subscription
// ---------------------------------------------------------------------------
async function demonstrateTopicAndSubscription(
  client: ServiceBusClient
): Promise<void> {
  // Create a sender for the topic
  const topicSender: ServiceBusSender = client.createSender(topicName);

  const messages: ServiceBusMessage[] = [
    { body: "Topic message A", subject: "info" },
    { body: "Topic message B", subject: "warning" },
    { body: "Topic message C", subject: "error" },
  ];

  await topicSender.sendMessages(messages);
  console.log(`Sent ${messages.length} messages to topic "${topicName}".`);

  // Create a receiver for the subscription
  const subscriptionReceiver: ServiceBusReceiver =
    client.createReceiver(topicName, subscriptionName);

  const received = await subscriptionReceiver.receiveMessages(10, {
    maxWaitTimeInMs: 5000,
  });

  console.log(
    `Received ${received.length} message(s) from subscription "${subscriptionName}":`
  );
  for (const msg of received) {
    console.log(`  → [${msg.subject}] ${msg.body}`);
    await subscriptionReceiver.completeMessage(msg);
  }

  // Cleanup topic resources
  await subscriptionReceiver.close();
  await topicSender.close();
}

// ---------------------------------------------------------------------------
// Main – orchestrate all demos
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  const client = await createClient();

  // Create sender and receiver for the queue
  const sender: ServiceBusSender = client.createSender(queueName);
  const receiver: ServiceBusReceiver = client.createReceiver(queueName);

  try {
    // 2. Send a single message
    await sendSingleMessage(sender);

    // 3. Send a batch of 5 messages
    await sendBatchMessages(sender);

    // 4 & 5. Receive and complete messages
    await receiveAndCompleteMessages(receiver);

    // Send a few more messages for the subscribe demo
    for (let i = 1; i <= 3; i++) {
      await sender.sendMessages({ body: `Subscribe demo message #${i}` });
    }

    // 6. Subscribe to messages
    console.log("Subscribing to messages...");
    await subscribeToMessages(receiver);

    // 7. Topic / subscription demo
    console.log("\n--- Topic & Subscription Demo ---");
    await demonstrateTopicAndSubscription(client);
  } finally {
    // Proper cleanup – always close sender, receiver, and client
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
