import { ServiceBusClient, ServiceBusReceiver, ServiceBusReceivedMessage } from "@azure/service-bus";

type Closable = {
  name: string;
  close(): Promise<void>;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function logMessage(prefix: string, message: ServiceBusReceivedMessage): void {
  console.log(`${prefix} messageId=${message.messageId ?? "<none>"} body=`, message.body);
}

async function completeMessages(
  receiver: ServiceBusReceiver,
  messages: ServiceBusReceivedMessage[],
  label: string,
): Promise<void> {
  for (const message of messages) {
    logMessage(label, message);
    await receiver.completeMessage(message);
  }
}

async function closeAll(resources: Closable[]): Promise<void> {
  let firstError: Error | undefined;

  for (const resource of resources) {
    try {
      await resource.close();
    } catch (error) {
      console.error(`Failed to close ${resource.name}:`, error);
      if (!firstError) {
        firstError = error instanceof Error ? error : new Error(String(error));
      }
    }
  }

  if (firstError) {
    throw firstError;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  const connectionString = requireEnv("SERVICE_BUS_CONNECTION_STRING");
  const queueName = requireEnv("SERVICE_BUS_QUEUE_NAME");
  const topicName = requireEnv("SERVICE_BUS_TOPIC_NAME");
  const subscriptionName = requireEnv("SERVICE_BUS_SUBSCRIPTION_NAME");

  const client = new ServiceBusClient(connectionString);
  const resources: Closable[] = [{ name: "service-bus-client", close: () => client.close() }];

  try {
    const queueSender = client.createSender(queueName);
    resources.unshift({ name: `sender:${queueName}`, close: () => queueSender.close() });

    await queueSender.sendMessages({
      messageId: "queue-single-1",
      body: "Single queue message from TypeScript",
      subject: "single-send-demo",
    });
    console.log("Sent one message to the queue.");

    const batch = await queueSender.createMessageBatch();
    for (let index = 1; index <= 5; index += 1) {
      const added = batch.tryAddMessage({
        messageId: `queue-batch-${index}`,
        body: `Batch queue message ${index}`,
        subject: "batch-send-demo",
        applicationProperties: {
          batchIndex: index,
        },
      });

      if (!added) {
        throw new Error(`Message ${index} could not be added to the batch.`);
      }
    }

    await queueSender.sendMessages(batch);
    console.log("Sent a batch of 5 queue messages.");

    const queueReceiver = client.createReceiver(queueName);
    resources.unshift({ name: `receiver:${queueName}:pull`, close: () => queueReceiver.close() });

    const pulledMessages = await queueReceiver.receiveMessages(6, {
      maxWaitTimeInMs: 5_000,
    });
    console.log(`Pulled ${pulledMessages.length} messages from the queue.`);
    await completeMessages(queueReceiver, pulledMessages, "[receiveMessages]");
    await queueReceiver.close();
    resources.shift();

    await queueSender.sendMessages([
      {
        messageId: "queue-subscribe-1",
        body: "Queue message handled by subscribe() #1",
        subject: "subscribe-demo",
      },
      {
        messageId: "queue-subscribe-2",
        body: "Queue message handled by subscribe() #2",
        subject: "subscribe-demo",
      },
    ]);

    const subscribedQueueReceiver = client.createReceiver(queueName);
    resources.unshift({
      name: `receiver:${queueName}:subscribe`,
      close: () => subscribedQueueReceiver.close(),
    });

    const queueSubscription = subscribedQueueReceiver.subscribe({
      processMessage: async (message) => {
        logMessage("[subscribe]", message);
        await subscribedQueueReceiver.completeMessage(message);
      },
      processError: async (args) => {
        console.error(`subscribe() error from ${args.errorSource}:`, args.error);
      },
    });

    resources.unshift({
      name: `subscription-handler:${queueName}`,
      close: () => queueSubscription.close(),
    });

    await delay(5_000);
    await queueSubscription.close();
    resources.shift();
    await subscribedQueueReceiver.close();
    resources.shift();

    const topicSender = client.createSender(topicName);
    resources.unshift({ name: `sender:${topicName}`, close: () => topicSender.close() });

    await topicSender.sendMessages({
      messageId: "topic-message-1",
      body: "Message sent to a topic and read from a subscription",
      subject: "topic-send-demo",
      applicationProperties: {
        subscriptionName,
      },
    });
    console.log("Sent one message to the topic.");

    const subscriptionReceiver = client.createReceiver(topicName, subscriptionName);
    resources.unshift({
      name: `receiver:${topicName}/${subscriptionName}`,
      close: () => subscriptionReceiver.close(),
    });

    const topicMessages = await subscriptionReceiver.receiveMessages(1, {
      maxWaitTimeInMs: 5_000,
    });
    console.log(`Pulled ${topicMessages.length} messages from the topic subscription.`);
    await completeMessages(subscriptionReceiver, topicMessages, "[topic subscription]");
  } finally {
    await closeAll(resources);
  }
}

main().catch((error) => {
  console.error("Service Bus demo failed:", error);
  process.exitCode = 1;
});
