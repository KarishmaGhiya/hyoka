/**
 * Azure Service Bus Comprehensive Demo
 * Demonstrates queues, topics/subscriptions, batching, and message handling
 */

import {
  ServiceBusClient,
  ServiceBusSender,
  ServiceBusReceiver,
  ServiceBusMessage,
  ServiceBusReceivedMessage,
} from "@azure/service-bus";

// Configuration - set these environment variables
const connectionString = process.env.SERVICEBUS_CONNECTION_STRING || "";
const queueName = process.env.SERVICEBUS_QUEUE_NAME || "demo-queue";
const topicName = process.env.SERVICEBUS_TOPIC_NAME || "demo-topic";
const subscriptionName = process.env.SERVICEBUS_SUBSCRIPTION_NAME || "demo-subscription";

/**
 * Demo 1: Send a single message to a queue
 */
async function sendSingleMessage(sender: ServiceBusSender): Promise<void> {
  console.log("\n=== Demo 1: Sending Single Message ===");
  
  const message: ServiceBusMessage = {
    body: {
      orderId: "12345",
      amount: 99.99,
      timestamp: new Date().toISOString(),
    },
    contentType: "application/json",
    messageId: "msg-001",
  };

  await sender.sendMessages(message);
  console.log(`✓ Sent single message: ${message.messageId}`);
}

/**
 * Demo 2: Send a batch of messages using createMessageBatch and tryAddMessage
 */
async function sendBatchMessages(sender: ServiceBusSender): Promise<void> {
  console.log("\n=== Demo 2: Sending Batch of 5 Messages ===");
  
  const batch = await sender.createMessageBatch();
  
  for (let i = 1; i <= 5; i++) {
    const message: ServiceBusMessage = {
      body: {
        messageNumber: i,
        content: `Batch message ${i}`,
        timestamp: new Date().toISOString(),
      },
      messageId: `batch-msg-${i}`,
    };

    const added = batch.tryAddMessage(message);
    
    if (!added) {
      // Batch is full - send current batch and create new one
      console.log(`Batch full at message ${i}, sending current batch...`);
      await sender.sendMessages(batch);
      
      const newBatch = await sender.createMessageBatch();
      newBatch.tryAddMessage(message);
      await sender.sendMessages(newBatch);
    } else {
      console.log(`✓ Added message ${i} to batch`);
    }
  }

  // Send remaining messages in batch
  if (batch.count > 0) {
    await sender.sendMessages(batch);
    console.log(`✓ Sent batch with ${batch.count} messages`);
  }
}

/**
 * Demo 3: Receive messages using receiveMessages and complete them
 */
async function receiveAndCompleteMessages(receiver: ServiceBusReceiver): Promise<void> {
  console.log("\n=== Demo 3: Receiving and Completing Messages ===");
  
  const messages = await receiver.receiveMessages(10, {
    maxWaitTimeInMs: 5000,
  });

  console.log(`✓ Received ${messages.length} messages`);

  for (const message of messages) {
    console.log(`  - Message ID: ${message.messageId}`);
    console.log(`    Body: ${JSON.stringify(message.body)}`);
    console.log(`    Delivery count: ${message.deliveryCount}`);
    
    // Process the message (simulate processing)
    await processMessage(message);
    
    // Complete the message to remove it from the queue
    await receiver.completeMessage(message);
    console.log(`    ✓ Completed message: ${message.messageId}`);
  }
}

/**
 * Demo 4: Subscribe to messages with processMessage and processError handlers
 */
async function subscribeToMessages(receiver: ServiceBusReceiver): Promise<void> {
  console.log("\n=== Demo 4: Subscribing to Messages (Event-Driven) ===");
  
  return new Promise((resolve) => {
    let messageCount = 0;
    const maxMessages = 3; // Process 3 messages then stop

    const subscription = receiver.subscribe(
      {
        processMessage: async (message: ServiceBusReceivedMessage) => {
          messageCount++;
          console.log(`\n[Subscribe] Received message ${messageCount}:`);
          console.log(`  - Message ID: ${message.messageId}`);
          console.log(`  - Body: ${JSON.stringify(message.body)}`);
          
          // Simulate processing
          await processMessage(message);
          
          // Message is auto-completed on success
          console.log(`  ✓ Message auto-completed`);

          // Stop after processing maxMessages
          if (messageCount >= maxMessages) {
            console.log(`\nProcessed ${maxMessages} messages, stopping subscription...`);
            subscription.close().then(() => resolve());
          }
        },
        processError: async (args) => {
          console.error(`\n[Error Handler] Error occurred:`);
          console.error(`  - Error source: ${args.errorSource}`);
          console.error(`  - Entity path: ${args.entityPath}`);
          console.error(`  - Error: ${args.error.message}`);
          
          // Handle different error sources
          if (args.errorSource === "receive") {
            console.log("  Connection issue - SDK will reconnect automatically");
          } else if (args.errorSource === "processMessageCallback") {
            console.log("  Error in message processing - check handler logic");
          }
        },
      },
      {
        autoCompleteMessages: true, // Auto-complete on success
        maxConcurrentCalls: 1, // Process messages sequentially for demo
      }
    );

    console.log("✓ Subscription active, waiting for messages...");
    console.log("  (Will process 3 messages then stop)");

    // Set a timeout in case no messages arrive
    setTimeout(async () => {
      if (messageCount === 0) {
        console.log("\nNo messages received within timeout, closing subscription...");
      }
      await subscription.close();
      resolve();
    }, 15000); // 15 second timeout
  });
}

/**
 * Demo 5: Send to topic and receive from subscription
 */
async function topicAndSubscriptionDemo(client: ServiceBusClient): Promise<void> {
  console.log("\n=== Demo 5: Topics and Subscriptions ===");
  
  // Create topic sender
  const topicSender = client.createSender(topicName);
  
  try {
    // Send messages to topic
    console.log("\nSending messages to topic...");
    const topicMessages: ServiceBusMessage[] = [
      {
        body: {
          event: "order.created",
          orderId: "T-001",
          customerId: "customer-123",
        },
        applicationProperties: {
          eventType: "order.created",
          region: "us-west",
        },
        subject: "orders/created",
        messageId: "topic-msg-001",
      },
      {
        body: {
          event: "order.updated",
          orderId: "T-002",
          status: "shipped",
        },
        applicationProperties: {
          eventType: "order.updated",
          region: "us-east",
        },
        subject: "orders/updated",
        messageId: "topic-msg-002",
      },
    ];

    for (const message of topicMessages) {
      await topicSender.sendMessages(message);
      console.log(`✓ Sent to topic: ${message.messageId} (${message.body.event})`);
    }

    // Create subscription receiver
    console.log("\nReceiving from subscription...");
    const subscriptionReceiver = client.createReceiver(topicName, subscriptionName);
    
    try {
      const messages = await subscriptionReceiver.receiveMessages(5, {
        maxWaitTimeInMs: 5000,
      });

      console.log(`✓ Received ${messages.length} messages from subscription`);

      for (const message of messages) {
        console.log(`  - Message ID: ${message.messageId}`);
        console.log(`    Event: ${message.body.event}`);
        console.log(`    Subject: ${message.subject}`);
        console.log(`    Application Properties:`, message.applicationProperties);
        
        await subscriptionReceiver.completeMessage(message);
        console.log(`    ✓ Completed`);
      }
    } finally {
      await subscriptionReceiver.close();
      console.log("\n✓ Subscription receiver closed");
    }
  } finally {
    await topicSender.close();
    console.log("✓ Topic sender closed");
  }
}

/**
 * Simulate message processing
 */
async function processMessage(message: ServiceBusReceivedMessage): Promise<void> {
  // Simulate some processing time
  await new Promise((resolve) => setTimeout(resolve, 100));
  // In real application, perform business logic here
}

/**
 * Main demo function
 */
async function main(): Promise<void> {
  if (!connectionString) {
    console.error("Error: SERVICEBUS_CONNECTION_STRING environment variable is not set");
    console.log("\nPlease set the following environment variables:");
    console.log("  SERVICEBUS_CONNECTION_STRING=<your-connection-string>");
    console.log("  SERVICEBUS_QUEUE_NAME=<queue-name> (optional, default: demo-queue)");
    console.log("  SERVICEBUS_TOPIC_NAME=<topic-name> (optional, default: demo-topic)");
    console.log("  SERVICEBUS_SUBSCRIPTION_NAME=<subscription-name> (optional, default: demo-subscription)");
    process.exit(1);
  }

  console.log("Azure Service Bus Comprehensive Demo");
  console.log("=====================================");
  console.log(`Queue: ${queueName}`);
  console.log(`Topic: ${topicName}`);
  console.log(`Subscription: ${subscriptionName}`);

  // Create Service Bus client
  const client = new ServiceBusClient(connectionString);
  
  try {
    // ========================================
    // QUEUE DEMOS
    // ========================================
    
    // Create sender for queue
    const queueSender = client.createSender(queueName);
    
    try {
      // Demo 1: Send single message
      await sendSingleMessage(queueSender);
      
      // Demo 2: Send batch of messages
      await sendBatchMessages(queueSender);
    } finally {
      await queueSender.close();
      console.log("\n✓ Queue sender closed");
    }

    // Create receiver for queue
    const queueReceiver = client.createReceiver(queueName);
    
    try {
      // Demo 3: Receive and complete messages
      await receiveAndCompleteMessages(queueReceiver);
      
      // Demo 4: Subscribe to messages (event-driven)
      await subscribeToMessages(queueReceiver);
    } finally {
      await queueReceiver.close();
      console.log("\n✓ Queue receiver closed");
    }

    // ========================================
    // TOPIC/SUBSCRIPTION DEMO
    // ========================================
    
    // Demo 5: Topics and Subscriptions
    await topicAndSubscriptionDemo(client);

  } catch (error) {
    console.error("\n❌ Error occurred:", error);
    throw error;
  } finally {
    // Always close the client
    await client.close();
    console.log("\n✓ Service Bus client closed");
    console.log("\n=== Demo Complete ===");
  }
}

// Run the demo
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
