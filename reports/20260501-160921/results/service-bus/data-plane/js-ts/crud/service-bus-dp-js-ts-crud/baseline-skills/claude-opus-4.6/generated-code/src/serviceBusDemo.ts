import {
  ServiceBusClient,
  ServiceBusMessage,
  ServiceBusReceivedMessage,
  ServiceBusSender,
  ServiceBusReceiver,
  ProcessErrorArgs,
} from "@azure/service-bus";

// Replace with your actual connection string and entity names
const connectionString =
  process.env.SERVICE_BUS_CONNECTION_STRING ||
  "Endpoint=sb://<namespace>.servicebus.windows.net/;SharedAccessKeyName=<key-name>;SharedAccessKey=<key>";
const queueName = process.env.SERVICE_BUS_QUEUE_NAME || "my-queue";
const topicName = process.env.SERVICE_BUS_TOPIC_NAME || "my-topic";
const subscriptionName =
  process.env.SERVICE_BUS_SUBSCRIPTION_NAME || "my-subscription";

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
    applicationProperties: { source: "demo-app" },
  };

  await sender.sendMessages(message);
  console.log("Single message sent to queue.");
}

// ---------------------------------------------------------------------------
// 3. Send a batch of 5 messages using createMessageBatch / tryAddMessage
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
  console.log("Waiting to receive messages (peekLock mode)...");

  const messages: ServiceBusReceivedMessage[] = await receiver.receiveMessages(
    10, // max message count
    { maxWaitTimeInMs: 5000 }
  );

  console.log(`Received ${messages.length} message(s).`);

  for (const msg of messages) {
    console.log(`  Processing: ${msg.body}`);
    // Complete the message to remove it from the queue
    await receiver.completeMessage(msg);
    console.log(`  Completed message (id: ${msg.messageId}).`);
  }
}

// ---------------------------------------------------------------------------
// 6. Subscribe to messages using subscribe() with handlers
// ---------------------------------------------------------------------------
async function subscribeToMessages(
  receiver: ServiceBusReceiver
): Promise<void> {
  console.log("Subscribing to messages...");

  return new Promise<void>((resolve) => {
    let messageCount = 0;

    const subscription = receiver.subscribe({
      async processMessage(
        message: ServiceBusReceivedMessage
      ): Promise<void> {
        console.log(`  [subscribe] Received: ${message.body}`);
        await receiver.completeMessage(message);
        messageCount++;

        // Stop after receiving some messages for demo purposes
        if (messageCount >= 5) {
          await subscription.close();
          resolve();
        }
      },

      async processError(args: ProcessErrorArgs): Promise<void> {
        console.error(`  [subscribe] Error: ${args.error.message}`);
        console.error(`  Source: ${args.errorSource}`);
        console.error(
          `  Entity path: ${args.fullyQualifiedNamespace}/${args.entityPath}`
        );
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
async function topicAndSubscriptionDemo(
  client: ServiceBusClient
): Promise<void> {
  console.log("\n--- Topic / Subscription Demo ---");

  // Create a sender for the topic
  const topicSender: ServiceBusSender = client.createSender(topicName);

  // Send messages to the topic
  const batch = await topicSender.createMessageBatch();
  for (let i = 1; i <= 3; i++) {
    if (
      !batch.tryAddMessage({
        body: `Topic message #${i}`,
        subject: "demo-topic",
        applicationProperties: { priority: i },
      })
    ) {
      throw new Error(`Topic message #${i} is too large for the batch.`);
    }
  }

  await topicSender.sendMessages(batch);
  console.log(`Sent ${batch.count} messages to topic "${topicName}".`);
  await topicSender.close();

  // Create a receiver for the subscription
  const subscriptionReceiver: ServiceBusReceiver =
    client.createReceiver(topicName, subscriptionName);

  const messages = await subscriptionReceiver.receiveMessages(3, {
    maxWaitTimeInMs: 5000,
  });

  console.log(
    `Received ${messages.length} message(s) from subscription "${subscriptionName}".`
  );

  for (const msg of messages) {
    console.log(`  Topic message: ${msg.body} (priority: ${msg.applicationProperties?.priority})`);
    await subscriptionReceiver.completeMessage(msg);
  }

  await subscriptionReceiver.close();
}

// ---------------------------------------------------------------------------
// Main – orchestrate all demos with proper cleanup
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  const client = await createClient();

  // Create sender and receiver for the queue
  const sender: ServiceBusSender = client.createSender(queueName);
  const receiver: ServiceBusReceiver = client.createReceiver(queueName);

  try {
    // 2. Send a single message
    await sendSingleMessage(sender);

    // 3. Send a batch of messages
    await sendBatchMessages(sender);

    // 4 & 5. Receive and complete messages
    await receiveAndCompleteMessages(receiver);

    // 6. Subscribe to messages (send more first so there's something to receive)
    await sendBatchMessages(sender);
    await subscribeToMessages(receiver);

    // 7. Topic and subscription demo
    await topicAndSubscriptionDemo(client);
  } finally {
    // Proper close() cleanup for all resources
    await sender.close();
    console.log("Sender closed.");

    await receiver.close();
    console.log("Receiver closed.");

    await client.close();
    console.log("ServiceBusClient closed. Done!");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
