# Evaluation Report: service-bus-dp-js-ts-crud

**Config:** baseline/gpt-5.3-codex | **Result:** ❌ FAILED | **Duration:** 18.1s

## Overview

| Field | Value |
|-------|-------|
| Prompt ID | `service-bus-dp-js-ts-crud` |
| Config | baseline/gpt-5.3-codex |
| Result | ❌ FAILED |
| Duration | 18.1s |
| Timestamp | 2026-04-30T23:29:52Z |
| Files Generated | 0 |
| Event Count | 22 |

## Phase Timing

| Phase | Duration |
|-------|----------|
| Generation | 18.0s |
| **Total** | **18.1s** |

## Configuration

- **model:** gpt-5.3-codex
- **name:** baseline/gpt-5.3-codex

## Environment & Configuration

| Setting | Value |
|---------|-------|
| Model | gpt-5.3-codex |
| Skills Loaded | customize-cloud-agent |
| Safety Boundaries | ✅ Active |
| Cloud Access | ❌ Denied |
| Token Usage | in=14448 out=1122 |
| Turn Count | 1 |

## Error

```
0 files generated — agent did not create any files
```

## Prompt Sent

```
Write a TypeScript program
that demonstrates messaging with Azure Service Bus:
1. Create a ServiceBusClient using a connection string
2. Create a sender for a queue and send a single message
3. Send a batch of 5 messages using createMessageBatch() and tryAddMessage()
4. Create a receiver and receive messages using receiveMessages()
5. Complete a message with completeMessage() after processing
6. Subscribe to messages using subscribe() with processMessage and processError handlers
7. Demonstrate sending to a topic and receiving from a subscription

Show required npm package (@azure/service-bus) and proper close() cleanup.
```

## Copilot Response

Use this as `service-bus-demo.ts`:

```ts
import { ServiceBusClient } from "@azure/service-bus";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const connectionString = required("SERVICE_BUS_CONNECTION_STRING");
const queueName = required("SERVICE_BUS_QUEUE");
const topicName = required("SERVICE_BUS_TOPIC");
const subscriptionName = required("SERVICE_BUS_SUBSCRIPTION");

async function queueDemo(client: ServiceBusClient) {
  const sender = client.createSender(queueName);
  const receiver = client.createReceiver(queueName);

  try {
    // 1) Send a single message
    await sender.sendMessages({ body: "single message" });

    // 2) Send a batch of 5 messages
    const batch = await sender.createMessageBatch();
    for (let i = 1; i <= 5; i++) {
      const ok = batch.tryAddMessage({ body: `batch message ${i}` });
      if (!ok) throw new Error(`Message ${i} did not fit in the batch`);
    }
    await sender.sendMessages(batch);

    // 3) Pull messages with receiveMessages()
    const received = await receiver.receiveMessages(6, { maxWaitTimeInMs: 5000 });
    for (const msg of received) {
      console.log("receiveMessages() got:", msg.body);
      // 4) Complete after processing
      await receiver.completeMessage(msg);
    }

    // 5) Subscribe with processMessage/processError
    const subscription = receiver.subscribe(
      {
        processMessage: async (msg) => {
          console.log("subscribe() got:", msg.body);
          await receiver.completeMessage(msg); // manual completion
        },
        processError: async (args) => {
          console.error("subscribe() error:", args.error);
        },
      },
      {
        autoCompleteMessages: false,
        maxConcurrentCalls: 1,
      }
    );

    // Send one more message so subscribe() can receive it
    await sender.sendMessages({ body: "message for subscribe()" });

    await new Promise((resolve) => setTimeout(resolve, 3000));
    await subscription.close();
  } finally {
    await receiver.close();
    await sender.close();
  }
}

async function topicDemo(client: ServiceBusClient) {
  const topicSender = client.createSender(topicName);
  const subscriptionReceiver = client.createReceiver(topicName, subscriptionName);

  try {
    // 6) Send to topic
    await topicSender.sendMessages({ body: "hello topic/subscription" });

    // 7) Receive from subscription
    const msgs = await subscriptionReceiver.receiveMessages(1, { maxWaitTimeInMs: 5000 });
    for (const msg of msgs) {
      console.log("topic/subscription got:", msg.body);
      await subscriptionReceiver.completeMessage(msg);
    }
  } finally {
    await subscriptionReceiver.close();
    await topicSender.close();
  }
}

async function main() {
  const client = new ServiceBusClient(connectionString);
  try {
    await queueDemo(client);
    await topicDemo(client);
  } finally {
    // Proper cleanup
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

Install required package:

```bash
npm install @azure/service-bus
```

Set env vars before running:

- `SERVICE_BUS_CONNECTION_STRING`
- `SERVICE_BUS_QUEUE`
- `SERVICE_BUS_TOPIC`
- `SERVICE_BUS_SUBSCRIPTION`

## Re-run Command

```bash
hyoka run --prompt-id service-bus-dp-js-ts-crud --config baseline/gpt-5.3-codex
```

---

[← Back to Summary](../../../../../../summary.md)
