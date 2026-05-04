import {
  ServiceBusClient,
  ServiceBusMessage,
  ServiceBusReceivedMessage,
  ProcessErrorArgs,
} from "@azure/service-bus";

// ---------------------------------------------------------------------------
// Configuration – set these via environment variables or replace inline
// ---------------------------------------------------------------------------
const connectionString =
  process.env.SERVICE_BUS_CONNECTION_STRING ||
  "<your-service-bus-connection-string>";
const queueName = process.env.QUEUE_NAME || "my-queue";
const topicName = process.env.TOPIC_NAME || "my-topic";
const subscriptionName = process.env.SUBSCRIPTION_NAME || "my-subscription";

// ---------------------------------------------------------------------------
// 1. Create ServiceBusClient from a connection string
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  const sbClient = new ServiceBusClient(connectionString);
  console.log("ServiceBusClient created.");

  try {
    await sendSingleMessage(sbClient);
    await sendMessageBatch(sbClient);
    await receiveMessages(sbClient);
    await subscribeToMessages(sbClient);
    await topicAndSubscription(sbClient);
  } finally {
    await sbClient.close();
    console.log("\nServiceBusClient closed.");
  }
}

// ---------------------------------------------------------------------------
// 2. Send a single message to a queue
// ---------------------------------------------------------------------------
async function sendSingleMessage(sbClient: ServiceBusClient): Promise<void> {
  const sender = sbClient.createSender(queueName);

  try {
    const message: ServiceBusMessage = {
      body: "Hello from Azure Service Bus!",
      contentType: "text/plain",
      subject: "greeting",
      applicationProperties: { source: "demo-app" },
    };

    await sender.sendMessages(message);
    console.log("\n--- Single message sent to queue ---");
    console.log(`  Body : ${message.body}`);
  } finally {
    await sender.close();
  }
}

// ---------------------------------------------------------------------------
// 3. Send a batch of 5 messages using createMessageBatch / tryAddMessage
// ---------------------------------------------------------------------------
async function sendMessageBatch(sbClient: ServiceBusClient): Promise<void> {
  const sender = sbClient.createSender(queueName);

  try {
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
    console.log(`\n--- Batch of ${batch.count} messages sent to queue ---`);
  } finally {
    await sender.close();
  }
}

// ---------------------------------------------------------------------------
// 4 & 5. Receive messages with receiveMessages() and complete them
// ---------------------------------------------------------------------------
async function receiveMessages(sbClient: ServiceBusClient): Promise<void> {
  const receiver = sbClient.createReceiver(queueName);

  try {
    console.log("\n--- Receiving messages (receiveMessages) ---");
    const messages: ServiceBusReceivedMessage[] =
      await receiver.receiveMessages(10, { maxWaitTimeInMs: 5000 });

    console.log(`  Received ${messages.length} message(s).`);

    for (const msg of messages) {
      console.log(`  Processing: ${msg.body}`);

      // 5. Complete the message so it is removed from the queue
      await receiver.completeMessage(msg);
      console.log(`  Completed : ${msg.body}`);
    }
  } finally {
    await receiver.close();
  }
}

// ---------------------------------------------------------------------------
// 6. Subscribe to messages with processMessage / processError handlers
// ---------------------------------------------------------------------------
async function subscribeToMessages(sbClient: ServiceBusClient): Promise<void> {
  const receiver = sbClient.createReceiver(queueName);

  console.log("\n--- Subscribing to messages (subscribe) ---");

  // First, seed a message so the subscriber has something to process
  const sender = sbClient.createSender(queueName);
  await sender.sendMessages({ body: "Message for subscriber" });
  await sender.close();

  return new Promise<void>((resolve) => {
    let messageCount = 0;

    const subscription = receiver.subscribe({
      async processMessage(
        message: ServiceBusReceivedMessage
      ): Promise<void> {
        console.log(`  [subscribe] Received: ${message.body}`);
        await receiver.completeMessage(message);
        console.log(`  [subscribe] Completed: ${message.body}`);
        messageCount++;

        // Stop after processing the seeded message
        if (messageCount >= 1) {
          await subscription.close();
          await receiver.close();
          resolve();
        }
      },

      async processError(args: ProcessErrorArgs): Promise<void> {
        console.error(`  [subscribe] Error: ${args.error.message}`);
        console.error(`    Source   : ${args.errorSource}`);
        console.error(`    Entity   : ${args.entityPath}`);
        console.error(`    Namespace: ${args.fullyQualifiedNamespace}`);
      },
    });
  });
}

// ---------------------------------------------------------------------------
// 7. Send to a topic and receive from a subscription
// ---------------------------------------------------------------------------
async function topicAndSubscription(sbClient: ServiceBusClient): Promise<void> {
  // Send to a topic
  const sender = sbClient.createSender(topicName);

  try {
    const message: ServiceBusMessage = {
      body: "Hello from topic!",
      subject: "topic-demo",
      applicationProperties: { priority: "high" },
    };

    await sender.sendMessages(message);
    console.log("\n--- Message sent to topic ---");
    console.log(`  Body : ${message.body}`);
  } finally {
    await sender.close();
  }

  // Receive from a subscription on that topic
  const receiver = sbClient.createReceiver(topicName, subscriptionName);

  try {
    console.log("\n--- Receiving from topic subscription ---");
    const messages = await receiver.receiveMessages(5, {
      maxWaitTimeInMs: 5000,
    });

    console.log(`  Received ${messages.length} message(s) from subscription.`);

    for (const msg of messages) {
      console.log(`  Body    : ${msg.body}`);
      console.log(`  Subject : ${msg.subject}`);
      console.log(`  Props   : ${JSON.stringify(msg.applicationProperties)}`);

      await receiver.completeMessage(msg);
      console.log(`  Completed.`);
    }
  } finally {
    await receiver.close();
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
