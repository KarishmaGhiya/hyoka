import { ServiceBusClient, ServiceBusMessage } from "@azure/service-bus";

const connectionString = process.env.SERVICE_BUS_CONNECTION_STRING ?? "<connection-string>";
const queueName = process.env.SERVICE_BUS_QUEUE_NAME ?? "<queue-name>";
const topicName = process.env.SERVICE_BUS_TOPIC_NAME ?? "<topic-name>";
const subscriptionName = process.env.SERVICE_BUS_SUBSCRIPTION_NAME ?? "<subscription-name>";

function ensureConfiguration(): void {
  const missing: string[] = [];

  if (connectionString === "<connection-string>") {
    missing.push("SERVICE_BUS_CONNECTION_STRING");
  }
  if (queueName === "<queue-name>") {
    missing.push("SERVICE_BUS_QUEUE_NAME");
  }
  if (topicName === "<topic-name>") {
    missing.push("SERVICE_BUS_TOPIC_NAME");
  }
  if (subscriptionName === "<subscription-name>") {
    missing.push("SERVICE_BUS_SUBSCRIPTION_NAME");
  }

  if (missing.length > 0) {
    throw new Error(`Set these environment variables before running the demo: ${missing.join(", ")}`);
  }
}

async function sendSingleQueueMessage(client: ServiceBusClient): Promise<void> {
  const sender = client.createSender(queueName);

  try {
    const message: ServiceBusMessage = {
      body: "Single queue message",
      subject: "single-message",
      applicationProperties: {
        source: "typescript-demo"
      }
    };

    await sender.sendMessages(message);
    console.log("Sent a single message to the queue.");
  } finally {
    await sender.close();
  }
}

async function sendQueueBatch(client: ServiceBusClient): Promise<void> {
  const sender = client.createSender(queueName);

  try {
    const batch = await sender.createMessageBatch();

    for (let index = 1; index <= 5; index += 1) {
      const message: ServiceBusMessage = {
        body: `Batch message ${index}`,
        messageId: `batch-${index}`
      };

      if (!batch.tryAddMessage(message)) {
        throw new Error(`Batch is full. Unable to add message ${index}.`);
      }
    }

    await sender.sendMessages(batch);
    console.log("Sent a batch of 5 messages to the queue.");
  } finally {
    await sender.close();
  }
}

async function receiveQueueMessages(client: ServiceBusClient): Promise<void> {
  const receiver = client.createReceiver(queueName);

  try {
    const messages = await receiver.receiveMessages(6, { maxWaitTimeInMs: 5_000 });

    for (const message of messages) {
      console.log(`Received with receiveMessages(): ${String(message.body)}`);
      await receiver.completeMessage(message);
    }
  } finally {
    await receiver.close();
  }
}

async function subscribeToQueueMessages(client: ServiceBusClient): Promise<void> {
  const sender = client.createSender(queueName);
  const receiver = client.createReceiver(queueName);

  try {
    await sender.sendMessages([
      { body: "Streaming message 1", messageId: "stream-1" },
      { body: "Streaming message 2", messageId: "stream-2" }
    ]);

    const subscription = receiver.subscribe({
      processMessage: async (message) => {
        console.log(`Received with subscribe(): ${String(message.body)}`);
        await receiver.completeMessage(message);
      },
      processError: async (args) => {
        console.error("Subscription error:", args.error);
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 5_000));
    await subscription.close();
  } finally {
    await receiver.close();
    await sender.close();
  }
}

async function sendToTopicAndReceiveFromSubscription(client: ServiceBusClient): Promise<void> {
  const topicSender = client.createSender(topicName);
  const subscriptionReceiver = client.createReceiver(topicName, subscriptionName);

  try {
    await topicSender.sendMessages({
      body: "Message sent to topic",
      subject: "topic-demo"
    });

    const messages = await subscriptionReceiver.receiveMessages(1, { maxWaitTimeInMs: 5_000 });

    for (const message of messages) {
      console.log(`Received from topic subscription: ${String(message.body)}`);
      await subscriptionReceiver.completeMessage(message);
    }
  } finally {
    await subscriptionReceiver.close();
    await topicSender.close();
  }
}

async function main(): Promise<void> {
  ensureConfiguration();

  const client = new ServiceBusClient(connectionString);

  try {
    await sendSingleQueueMessage(client);
    await sendQueueBatch(client);
    await receiveQueueMessages(client);
    await subscribeToQueueMessages(client);
    await sendToTopicAndReceiveFromSubscription(client);
  } finally {
    await client.close();
  }
}

main().catch((error: unknown) => {
  console.error("Demo failed:", error);
  process.exitCode = 1;
});
