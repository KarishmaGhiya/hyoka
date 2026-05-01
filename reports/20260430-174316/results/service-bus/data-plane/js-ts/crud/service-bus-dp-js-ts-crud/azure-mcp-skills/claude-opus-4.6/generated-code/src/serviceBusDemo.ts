import {
  ServiceBusClient,
  ServiceBusMessage,
  ServiceBusReceivedMessage,
  ServiceBusSender,
  ServiceBusReceiver,
  ProcessErrorArgs,
} from "@azure/service-bus";

// ---------------------------------------------------------------------------
// Configuration – set these environment variables before running:
//   SERVICE_BUS_CONNECTION_STRING  – Endpoint=sb://...
//   QUEUE_NAME                    – e.g. "demo-queue"
//   TOPIC_NAME                    – e.g. "demo-topic"
//   SUBSCRIPTION_NAME             – e.g. "demo-subscription"
// ---------------------------------------------------------------------------
const connectionString = process.env.SERVICE_BUS_CONNECTION_STRING!;
const queueName = process.env.QUEUE_NAME ?? "demo-queue";
const topicName = process.env.TOPIC_NAME ?? "demo-topic";
const subscriptionName = process.env.SUBSCRIPTION_NAME ?? "demo-subscription";

// ========================  1. Create the client  ========================
const sbClient = new ServiceBusClient(connectionString);

// ---------------------------------------------------------------------------
// 2. Send a single message to a queue
// ---------------------------------------------------------------------------
async function sendSingleMessage(sender: ServiceBusSender): Promise<void> {
  const message: ServiceBusMessage = {
    body: { id: 1, text: "Hello from Service Bus!" },
    contentType: "application/json",
    subject: "greeting",
  };

  await sender.sendMessages(message);
  console.log("✔ Single message sent to queue.");
}

// ---------------------------------------------------------------------------
// 3. Send a batch of messages using createMessageBatch / tryAddMessage
// ---------------------------------------------------------------------------
async function sendBatchMessages(sender: ServiceBusSender): Promise<void> {
  const batch = await sender.createMessageBatch();

  for (let i = 1; i <= 5; i++) {
    const msg: ServiceBusMessage = {
      body: { id: i, text: `Batch message #${i}` },
      contentType: "application/json",
    };

    if (!batch.tryAddMessage(msg)) {
      // If the batch is full, send what we have and start a new one.
      await sender.sendMessages(batch);
      const newBatch = await sender.createMessageBatch();
      if (!newBatch.tryAddMessage(msg)) {
        throw new Error("Single message is too large for an empty batch.");
      }
    }
  }

  await sender.sendMessages(batch);
  console.log(`✔ Batch of ${batch.count} messages sent to queue.`);
}

// ---------------------------------------------------------------------------
// 4 & 5. Receive messages with receiveMessages() and complete them
// ---------------------------------------------------------------------------
async function receiveAndComplete(receiver: ServiceBusReceiver): Promise<void> {
  // Wait up to 5 seconds for messages (maxWaitTimeInMs).
  const messages: ServiceBusReceivedMessage[] = await receiver.receiveMessages(10, {
    maxWaitTimeInMs: 5000,
  });

  console.log(`✔ Received ${messages.length} message(s) via receiveMessages().`);

  for (const msg of messages) {
    console.log(`  → Processing: ${JSON.stringify(msg.body)}`);
    // 5. Complete the message so it is removed from the queue.
    await receiver.completeMessage(msg);
    console.log(`    ✔ Message completed.`);
  }
}

// ---------------------------------------------------------------------------
// 6. Subscribe to messages with processMessage / processError handlers
// ---------------------------------------------------------------------------
function subscribeToMessages(receiver: ServiceBusReceiver): Promise<void> {
  return new Promise<void>((resolve) => {
    let received = 0;

    const subscription = receiver.subscribe({
      async processMessage(msg: ServiceBusReceivedMessage): Promise<void> {
        console.log(`  [subscribe] Received: ${JSON.stringify(msg.body)}`);
        await receiver.completeMessage(msg);
        received++;

        // Stop after processing all expected messages.
        if (received >= 5) {
          await subscription.close();
          resolve();
        }
      },

      async processError(args: ProcessErrorArgs): Promise<void> {
        console.error(`  [subscribe] Error (${args.errorSource}):`, args.error);
      },
    });

    // Safety timeout so the demo doesn't hang forever.
    setTimeout(async () => {
      await subscription.close();
      resolve();
    }, 15_000);
  });
}

// ---------------------------------------------------------------------------
// 7. Send to a topic / receive from a subscription
// ---------------------------------------------------------------------------
async function topicDemo(): Promise<void> {
  const topicSender = sbClient.createSender(topicName);

  await topicSender.sendMessages({
    body: { event: "order.created", orderId: 42 },
    contentType: "application/json",
    subject: "orders",
  });
  console.log("✔ Message sent to topic.");

  const subReceiver = sbClient.createReceiver(topicName, subscriptionName);
  const messages = await subReceiver.receiveMessages(1, { maxWaitTimeInMs: 5000 });

  for (const msg of messages) {
    console.log(`  → Topic message: ${JSON.stringify(msg.body)}`);
    await subReceiver.completeMessage(msg);
  }

  // Cleanup topic resources.
  await subReceiver.close();
  await topicSender.close();
  console.log("✔ Topic sender & subscription receiver closed.");
}

// ---------------------------------------------------------------------------
// Main – orchestrate all demos with proper cleanup
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.log("=== Azure Service Bus TypeScript Demo ===\n");

  const queueSender = sbClient.createSender(queueName);
  const queueReceiver = sbClient.createReceiver(queueName);

  try {
    // 2. Single message
    await sendSingleMessage(queueSender);

    // 3. Batch messages
    await sendBatchMessages(queueSender);

    // 4 & 5. Receive + complete
    await receiveAndComplete(queueReceiver);

    // Close the first receiver so subscribe() gets a fresh one.
    await queueReceiver.close();

    // Send another batch for the subscribe demo.
    await sendBatchMessages(queueSender);

    // 6. Subscribe-based receive
    const subscribeReceiver = sbClient.createReceiver(queueName);
    console.log("Listening via subscribe()…");
    await subscribeToMessages(subscribeReceiver);
    await subscribeReceiver.close();

    // 7. Topic / subscription demo
    await topicDemo();
  } finally {
    // Cleanup – always close sender, receiver, and client.
    await queueSender.close();
    await sbClient.close();
    console.log("\n✔ All resources closed. Done.");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  sbClient.close();
  process.exit(1);
});
