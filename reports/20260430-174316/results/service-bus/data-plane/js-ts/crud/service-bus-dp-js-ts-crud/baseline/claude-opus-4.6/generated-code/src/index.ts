import {
  ServiceBusClient,
  ServiceBusMessage,
  ServiceBusReceivedMessage,
  ServiceBusReceiver,
  ServiceBusSender,
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
// 1. Create a ServiceBusClient using a connection string
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
    applicationProperties: {
      source: "demo-app",
    },
  };

  await sender.sendMessages(message);
  console.log("Single message sent to queue.");
}

// ---------------------------------------------------------------------------
// 3. Send a batch of messages using createMessageBatch() + tryAddMessage()
// ---------------------------------------------------------------------------
async function sendBatchMessages(sender: ServiceBusSender): Promise<void> {
  const batch = await sender.createMessageBatch();

  for (let i = 1; i <= 5; i++) {
    const message: ServiceBusMessage = {
      body: { orderId: i, item: `Product-${i}`, quantity: i * 10 },
      contentType: "application/json",
      subject: `order-${i}`,
      messageId: `batch-msg-${i}`,
    };

    const added = batch.tryAddMessage(message);
    if (!added) {
      throw new Error(
        `Message ${i} could not be added to the batch (batch is full).`
      );
    }
  }

  await sender.sendMessages(batch);
  console.log(`Batch of ${batch.count} messages sent to queue.`);
}

// ---------------------------------------------------------------------------
// 4. Receive messages using receiveMessages()
// ---------------------------------------------------------------------------
async function receiveMessages(
  receiver: ServiceBusReceiver
): Promise<ServiceBusReceivedMessage[]> {
  console.log("Waiting for messages...");
  const messages = await receiver.receiveMessages(10, {
    maxWaitTimeInMs: 5000,
  });

  console.log(`Received ${messages.length} message(s).`);

  for (const msg of messages) {
    console.log(`  - Subject: ${msg.subject}, Body:`, msg.body);
  }

  return messages;
}

// ---------------------------------------------------------------------------
// 5. Complete a message after processing (peekLock mode)
// ---------------------------------------------------------------------------
async function processAndCompleteMessages(
  receiver: ServiceBusReceiver
): Promise<void> {
  const messages = await receiver.receiveMessages(10, {
    maxWaitTimeInMs: 5000,
  });

  for (const msg of messages) {
    try {
      // Simulate processing
      console.log(`Processing message: ${msg.subject ?? msg.messageId}`);

      // Mark message as completed so it is removed from the queue
      await receiver.completeMessage(msg);
      console.log(`  Completed message: ${msg.subject ?? msg.messageId}`);
    } catch (err) {
      // If processing fails the message remains in the queue for retry
      console.error(`  Failed to process message: ${err}`);
    }
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
    const maxMessages = 5;

    const subscription = receiver.subscribe(
      {
        processMessage: async (msg: ServiceBusReceivedMessage) => {
          console.log(
            `[subscribe] Received: ${msg.subject ?? msg.messageId}`,
            msg.body
          );
          await receiver.completeMessage(msg);
          console.log(`[subscribe] Completed: ${msg.subject ?? msg.messageId}`);

          messageCount++;
          if (messageCount >= maxMessages) {
            await subscription.close();
            resolve();
          }
        },

        processError: async (args: ProcessErrorArgs) => {
          console.error(`[subscribe] Error (${args.errorSource}):`, args.error);
        },
      },
      { autoCompleteMessages: false }
    );

    // Safety timeout so the demo doesn't hang indefinitely
    setTimeout(async () => {
      await subscription.close();
      resolve();
    }, 15_000);
  });
}

// ---------------------------------------------------------------------------
// 7. Send to a topic and receive from a subscription
// ---------------------------------------------------------------------------
async function demonstrateTopicAndSubscription(
  client: ServiceBusClient
): Promise<void> {
  const topicSender = client.createSender(topicName);

  // Send messages to the topic
  const batch = await topicSender.createMessageBatch();
  for (let i = 1; i <= 3; i++) {
    batch.tryAddMessage({
      body: { event: `event-${i}`, timestamp: new Date().toISOString() },
      contentType: "application/json",
      subject: `topic-event-${i}`,
    });
  }
  await topicSender.sendMessages(batch);
  console.log(`Sent ${batch.count} messages to topic "${topicName}".`);

  // Receive from the subscription
  const subscriptionReceiver = client.createReceiver(
    topicName,
    subscriptionName
  );

  const messages = await subscriptionReceiver.receiveMessages(10, {
    maxWaitTimeInMs: 5000,
  });

  console.log(
    `Received ${messages.length} message(s) from subscription "${subscriptionName}".`
  );
  for (const msg of messages) {
    console.log(`  [topic] Subject: ${msg.subject}, Body:`, msg.body);
    await subscriptionReceiver.completeMessage(msg);
  }

  // Cleanup topic resources
  await subscriptionReceiver.close();
  await topicSender.close();
  console.log("Topic sender and subscription receiver closed.");
}

// ---------------------------------------------------------------------------
// Main – orchestrate all demos
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  const client = await createClient();

  // Create sender and receiver for the queue
  const sender = client.createSender(queueName);
  const receiver = client.createReceiver(queueName);

  try {
    // 2. Send a single message
    console.log("\n--- Send Single Message ---");
    await sendSingleMessage(sender);

    // 3. Send a batch of messages
    console.log("\n--- Send Batch Messages ---");
    await sendBatchMessages(sender);

    // 4. Receive messages
    console.log("\n--- Receive Messages ---");
    await receiveMessages(receiver);

    // 5. Complete messages after processing
    console.log("\n--- Process & Complete Messages ---");
    await processAndCompleteMessages(receiver);

    // 6. Subscribe to messages (send some first so the subscriber has data)
    console.log("\n--- Subscribe to Messages ---");
    await sendBatchMessages(sender);
    await subscribeToMessages(receiver);

    // 7. Topic / subscription demo
    console.log("\n--- Topic & Subscription ---");
    await demonstrateTopicAndSubscription(client);
  } finally {
    // Proper cleanup – always close resources
    await receiver.close();
    await sender.close();
    await client.close();
    console.log("\nAll Service Bus resources closed.");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
