import {
  ServiceBusClient,
  ServiceBusReceivedMessage,
  ProcessErrorArgs
} from "@azure/service-bus";

const connectionString = process.env.SERVICE_BUS_CONNECTION_STRING;
const queueName = process.env.SERVICE_BUS_QUEUE_NAME ?? "sample-queue";
const topicName = process.env.SERVICE_BUS_TOPIC_NAME ?? "sample-topic";
const subscriptionName =
  process.env.SERVICE_BUS_SUBSCRIPTION_NAME ?? "sample-subscription";

function requireConnectionString(): string {
  if (!connectionString) {
    throw new Error(
      "Set SERVICE_BUS_CONNECTION_STRING before running this sample."
    );
  }

  return connectionString;
}

async function demoQueueMessaging(): Promise<void> {
  const client = new ServiceBusClient(requireConnectionString());
  const sender = client.createSender(queueName);
  const pullReceiver = client.createReceiver(queueName);
  const pushReceiver = client.createReceiver(queueName);

  try {
    await sender.sendMessages({
      body: "single message",
      applicationProperties: { sample: "single-send" }
    });
    console.log(`Sent 1 message to queue "${queueName}".`);

    const batch = await sender.createMessageBatch();
    for (let i = 1; i <= 5; i += 1) {
      const added = batch.tryAddMessage({
        body: `batch message ${i}`,
        applicationProperties: { sample: "batch-send", index: i }
      });

      if (!added) {
        throw new Error(`Message ${i} could not be added to the batch.`);
      }
    }

    await sender.sendMessages(batch);
    console.log(`Sent 5 batched messages to queue "${queueName}".`);

    const receivedMessages = await pullReceiver.receiveMessages(6, {
      maxWaitTimeInMs: 5_000
    });

    for (const message of receivedMessages) {
      await processAndCompleteMessage(pullReceiver, message);
    }

    await sender.sendMessages({
      body: "message handled by subscribe()",
      applicationProperties: { sample: "subscribe-send" }
    });

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      let subscription = pushReceiver.subscribe(
        {
          processMessage: async (message) => {
            try {
              console.log(`subscribe() received: ${String(message.body)}`);
              await pushReceiver.completeMessage(message);
              clearTimeout(timeout);
              settled = true;
              await subscription.close();
              resolve();
            } catch (error) {
              clearTimeout(timeout);
              settled = true;
              reject(error);
            }
          },
          processError: async (args) => {
            clearTimeout(timeout);
            settled = true;
            reject(formatProcessError(args));
          }
        },
        {
          autoCompleteMessages: false
        }
      );

      const timeout = setTimeout(() => {
        if (settled) {
          return;
        }

        settled = true;
        subscription
          .close()
          .then(() => reject(new Error("Timed out waiting for subscribe().")))
          .catch(reject);
      }, 10_000);
    });
  } finally {
    await pushReceiver.close();
    await pullReceiver.close();
    await sender.close();
    await client.close();
  }
}

async function demoTopicSubscription(): Promise<void> {
  const client = new ServiceBusClient(requireConnectionString());
  const sender = client.createSender(topicName);
  const receiver = client.createReceiver(topicName, subscriptionName);

  try {
    await sender.sendMessages({
      body: "message sent to topic",
      subject: "topic-demo"
    });
    console.log(
      `Sent 1 message to topic "${topicName}" for subscription "${subscriptionName}".`
    );

    const messages = await receiver.receiveMessages(1, {
      maxWaitTimeInMs: 5_000
    });

    for (const message of messages) {
      await processAndCompleteMessage(receiver, message);
    }
  } finally {
    await receiver.close();
    await sender.close();
    await client.close();
  }
}

async function processAndCompleteMessage(
  receiver: ReturnType<ServiceBusClient["createReceiver"]>,
  message: ServiceBusReceivedMessage
): Promise<void> {
  console.log(`Processing: ${String(message.body)}`);
  await receiver.completeMessage(message);
  console.log(`Completed message: ${message.messageId ?? "<no messageId>"}`);
}

function formatProcessError(args: ProcessErrorArgs): Error {
  const entityPath =
    "entityPath" in args && typeof args.entityPath === "string"
      ? args.entityPath
      : "unknown";

  return new Error(
    `subscribe() error from ${args.errorSource} on ${entityPath}: ${args.error.message}`
  );
}

async function main(): Promise<void> {
  console.log("Required package: npm install @azure/service-bus");
  console.log(
    "This sample expects the queue, topic, and subscription to already exist."
  );

  await demoQueueMessaging();
  await demoTopicSubscription();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
