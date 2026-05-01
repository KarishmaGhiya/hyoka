import { ServiceBusClient, ServiceBusReceivedMessage } from "@azure/service-bus";

type DemoConfig = {
  connectionString: string;
  queueName: string;
  topicName: string;
  subscriptionName: string;
};

function getRequiredEnv(name: keyof NodeJS.ProcessEnv): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function loadConfig(): DemoConfig {
  return {
    connectionString: getRequiredEnv("SERVICE_BUS_CONNECTION_STRING"),
    queueName: getRequiredEnv("SERVICE_BUS_QUEUE_NAME"),
    topicName: getRequiredEnv("SERVICE_BUS_TOPIC_NAME"),
    subscriptionName: getRequiredEnv("SERVICE_BUS_SUBSCRIPTION_NAME"),
  };
}

function describeMessage(message: ServiceBusReceivedMessage): string {
  const body = typeof message.body === "string" ? message.body : JSON.stringify(message.body);

  return `body=${body} messageId=${message.messageId ?? "<none>"}`;
}

async function runQueueReceiveDemo(client: ServiceBusClient, queueName: string): Promise<void> {
  const sender = client.createSender(queueName);

  try {
    await sender.sendMessages({
      body: "Single queue message",
      contentType: "text/plain",
      subject: "single-message",
    });
    console.log("Sent a single queue message.");

    const batch = await sender.createMessageBatch();

    for (let index = 1; index <= 5; index += 1) {
      const added = batch.tryAddMessage({
        body: `Batch queue message ${index}`,
        contentType: "text/plain",
        subject: "batch-message",
        messageId: `batch-${index}-${Date.now()}`,
      });

      if (!added) {
        throw new Error(`Message ${index} could not be added to the batch.`);
      }
    }

    await sender.sendMessages(batch);
    console.log("Sent a batch of 5 queue messages.");
  } finally {
    await sender.close();
  }

  const receiver = client.createReceiver(queueName);

  try {
    const messages = await receiver.receiveMessages(6, {
      maxWaitTimeInMs: 10_000,
    });

    console.log(`Received ${messages.length} queue messages with receiveMessages().`);

    for (const message of messages) {
      console.log(`Processing queue message: ${describeMessage(message)}`);
      await receiver.completeMessage(message);
      console.log(`Completed queue message: ${message.messageId ?? "<no-id>"}`);
    }
  } finally {
    await receiver.close();
  }
}

async function runQueueSubscribeDemo(client: ServiceBusClient, queueName: string): Promise<void> {
  const sender = client.createSender(queueName);
  const receiver = client.createReceiver(queueName);
  const expectedMessageCount = 2;

  let processedCount = 0;
  let resolveProcessed!: () => void;
  let rejectProcessed!: (error: Error) => void;

  const processed = new Promise<void>((resolve, reject) => {
    resolveProcessed = resolve;
    rejectProcessed = reject;
  });

  const subscription = receiver.subscribe(
    {
      processMessage: async (message) => {
        console.log(`subscribe() received queue message: ${describeMessage(message)}`);
        await receiver.completeMessage(message);
        processedCount += 1;

        if (processedCount >= expectedMessageCount) {
          resolveProcessed();
        }
      },
      processError: async (args) => {
        rejectProcessed(args.error);
      },
    },
    {
      autoCompleteMessages: false,
      maxConcurrentCalls: 1,
    },
  );

  try {
    await sender.sendMessages([
      {
        body: "Queue message for subscribe() #1",
        contentType: "text/plain",
        messageId: `subscribe-1-${Date.now()}`,
      },
      {
        body: "Queue message for subscribe() #2",
        contentType: "text/plain",
        messageId: `subscribe-2-${Date.now()}`,
      },
    ]);

    console.log("Sent queue messages for subscribe().");
    await processed;
  } finally {
    await subscription.close();
    await receiver.close();
    await sender.close();
  }
}

async function runTopicSubscriptionDemo(
  client: ServiceBusClient,
  topicName: string,
  subscriptionName: string,
): Promise<void> {
  const sender = client.createSender(topicName);

  try {
    await sender.sendMessages({
      body: "Topic message for subscription receiver",
      contentType: "text/plain",
      subject: "topic-demo",
      messageId: `topic-${Date.now()}`,
    });
    console.log("Sent a topic message.");
  } finally {
    await sender.close();
  }

  const receiver = client.createReceiver(topicName, subscriptionName);

  try {
    const messages = await receiver.receiveMessages(1, {
      maxWaitTimeInMs: 10_000,
    });

    console.log(
      `Received ${messages.length} message(s) from topic "${topicName}" subscription "${subscriptionName}".`,
    );

    for (const message of messages) {
      console.log(`Processing subscription message: ${describeMessage(message)}`);
      await receiver.completeMessage(message);
      console.log(`Completed subscription message: ${message.messageId ?? "<no-id>"}`);
    }
  } finally {
    await receiver.close();
  }
}

async function main(): Promise<void> {
  const config = loadConfig();
  const client = new ServiceBusClient(config.connectionString);

  try {
    await runQueueReceiveDemo(client, config.queueName);
    await runQueueSubscribeDemo(client, config.queueName);
    await runTopicSubscriptionDemo(client, config.topicName, config.subscriptionName);
  } finally {
    await client.close();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);

  console.error(message);
  process.exitCode = 1;
});
