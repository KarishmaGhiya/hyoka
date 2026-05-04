import {
  ServiceBusClient,
  ServiceBusMessage,
  ServiceBusSender,
  ServiceBusReceiver,
  ServiceBusReceivedMessage,
} from "@azure/service-bus";

// Connection string - replace with your actual Service Bus connection string
const connectionString = process.env.SERVICE_BUS_CONNECTION_STRING || 
  "Endpoint=sb://<namespace>.servicebus.windows.net/;SharedAccessKeyName=<key-name>;SharedAccessKey=<key>";

const queueName = "demo-queue";
const topicName = "demo-topic";
const subscriptionName = "demo-subscription";

/**
 * Demonstrates sending a single message to a queue
 */
async function sendSingleMessage(sender: ServiceBusSender): Promise<void> {
  console.log("\n=== Sending Single Message ===");
  
  const message: ServiceBusMessage = {
    body: { orderId: "12345", product: "Laptop", quantity: 1 },
    contentType: "application/json",
    subject: "Order Placed",
    messageId: "msg-001",
    applicationProperties: {
      priority: "high",
      source: "web-app"
    }
  };

  await sender.sendMessages(message);
  console.log("✓ Sent single message:", message.messageId);
}

/**
 * Demonstrates sending a batch of messages using createMessageBatch()
 */
async function sendMessageBatch(sender: ServiceBusSender): Promise<void> {
  console.log("\n=== Sending Message Batch ===");
  
  // Create a batch that will automatically handle size limits
  const batch = await sender.createMessageBatch();
  
  for (let i = 1; i <= 5; i++) {
    const message: ServiceBusMessage = {
      body: {
        orderId: `ORD-${1000 + i}`,
        product: `Product ${i}`,
        quantity: i,
        timestamp: new Date().toISOString()
      },
      messageId: `batch-msg-${i}`,
      applicationProperties: {
        batchNumber: i
      }
    };

    // tryAddMessage returns false if the message doesn't fit
    const added = batch.tryAddMessage(message);
    
    if (!added) {
      console.log(`⚠ Message ${i} too large for batch, sending batch and creating new one`);
      await sender.sendMessages(batch);
      
      // Create a new batch and add the message that didn't fit
      const newBatch = await sender.createMessageBatch();
      if (!newBatch.tryAddMessage(message)) {
        throw new Error(`Message ${i} is too large even for an empty batch`);
      }
      await sender.sendMessages(newBatch);
    } else {
      console.log(`✓ Added message ${i} to batch (${batch.count} messages, ${batch.sizeInBytes} bytes)`);
    }
  }

  // Send any remaining messages in the batch
  if (batch.count > 0) {
    await sender.sendMessages(batch);
    console.log(`✓ Sent batch with ${batch.count} messages`);
  }
}

/**
 * Demonstrates receiving messages using receiveMessages()
 */
async function receiveMessagesInPeekLockMode(receiver: ServiceBusReceiver): Promise<void> {
  console.log("\n=== Receiving Messages (Peek-Lock Mode) ===");
  
  // Receive up to 10 messages, wait max 10 seconds
  const messages = await receiver.receiveMessages(10, { maxWaitTimeInMs: 10000 });
  
  console.log(`Received ${messages.length} messages`);
  
  for (const message of messages) {
    console.log(`\n📬 Message ID: ${message.messageId}`);
    console.log(`   Body:`, message.body);
    console.log(`   Delivery Count: ${message.deliveryCount}`);
    console.log(`   Enqueued Time: ${message.enqueuedTimeUtc}`);
    
    try {
      // Process the message (simulate some work)
      await processMessage(message);
      
      // Complete the message to remove it from the queue
      await receiver.completeMessage(message);
      console.log(`   ✓ Message completed successfully`);
    } catch (error) {
      console.error(`   ✗ Error processing message:`, error);
      
      // Abandon the message (it will be redelivered)
      await receiver.abandonMessage(message);
      console.log(`   ⟲ Message abandoned for redelivery`);
    }
  }
}

/**
 * Simulates message processing
 */
async function processMessage(message: ServiceBusReceivedMessage): Promise<void> {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Add your business logic here
  console.log(`   Processing order: ${message.body?.orderId || 'unknown'}`);
}

/**
 * Demonstrates subscribing to messages with handlers
 */
async function subscribeToMessages(receiver: ServiceBusReceiver): Promise<void> {
  console.log("\n=== Subscribing to Messages with Handlers ===");
  
  const subscription = receiver.subscribe({
    processMessage: async (message: ServiceBusReceivedMessage) => {
      console.log(`\n📨 Received via subscription - ID: ${message.messageId}`);
      console.log(`   Body:`, message.body);
      console.log(`   Subject: ${message.subject}`);
      
      // Process the message
      await processMessage(message);
      
      console.log(`   ✓ Message auto-completed by handler`);
    },
    processError: async (error) => {
      console.error(`\n❌ Error in message handler:`, error);
      console.error(`   Error source: ${error.errorSource}`);
      
      // Implement retry logic, alerting, or other error handling here
    }
  }, {
    autoCompleteMessages: true,  // Automatically complete messages after processMessage succeeds
    maxConcurrentCalls: 5  // Process up to 5 messages concurrently
  });

  console.log("✓ Subscription active, waiting for messages...");
  
  // Let the subscription run for 30 seconds
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  // Close the subscription
  await subscription.close();
  console.log("✓ Subscription closed");
}

/**
 * Demonstrates sending to a topic and receiving from a subscription
 */
async function demonstrateTopicSubscription(client: ServiceBusClient): Promise<void> {
  console.log("\n\n========================================");
  console.log("=== TOPIC AND SUBSCRIPTION DEMO ===");
  console.log("========================================");
  
  const topicSender = client.createSender(topicName);
  const subscriptionReceiver = client.createReceiver(topicName, subscriptionName);

  try {
    // Send messages to the topic
    console.log(`\nSending messages to topic: ${topicName}`);
    
    const topicMessages: ServiceBusMessage[] = [
      {
        body: { eventType: "UserRegistered", userId: "user-001", email: "user@example.com" },
        subject: "UserEvent",
        applicationProperties: { eventType: "UserRegistered" }
      },
      {
        body: { eventType: "OrderCreated", orderId: "order-001", amount: 99.99 },
        subject: "OrderEvent",
        applicationProperties: { eventType: "OrderCreated" }
      },
      {
        body: { eventType: "PaymentProcessed", paymentId: "pay-001", status: "success" },
        subject: "PaymentEvent",
        applicationProperties: { eventType: "PaymentProcessed" }
      }
    ];

    for (const message of topicMessages) {
      await topicSender.sendMessages(message);
      console.log(`✓ Sent to topic: ${message.applicationProperties?.eventType}`);
    }

    // Receive from the subscription
    console.log(`\nReceiving from subscription: ${subscriptionName}`);
    
    const receivedMessages = await subscriptionReceiver.receiveMessages(10, { maxWaitTimeInMs: 5000 });
    console.log(`Received ${receivedMessages.length} messages from subscription`);
    
    for (const message of receivedMessages) {
      console.log(`\n📬 Subscription Message:`);
      console.log(`   Event Type: ${message.applicationProperties?.eventType}`);
      console.log(`   Body:`, message.body);
      
      // Complete the message
      await subscriptionReceiver.completeMessage(message);
      console.log(`   ✓ Completed`);
    }
  } finally {
    await topicSender.close();
    await subscriptionReceiver.close();
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  console.log("========================================");
  console.log("Azure Service Bus TypeScript Demo");
  console.log("========================================");
  
  // 1. Create ServiceBusClient using connection string
  console.log("\n1. Creating ServiceBusClient with connection string...");
  const client = new ServiceBusClient(connectionString);
  console.log("✓ ServiceBusClient created");

  // Create sender and receiver for queue operations
  const queueSender = client.createSender(queueName);
  const queueReceiver = client.createReceiver(queueName, {
    receiveMode: "peekLock"  // or "receiveAndDelete" for auto-completion
  });

  try {
    // 2. Send a single message
    await sendSingleMessage(queueSender);

    // 3. Send a batch of 5 messages
    await sendMessageBatch(queueSender);

    // Wait a moment for messages to be available
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 4 & 5. Receive messages and complete them
    await receiveMessagesInPeekLockMode(queueReceiver);

    // 6. Subscribe to messages with handlers
    // Note: This will wait for 30 seconds listening for messages
    // You may want to comment this out for quicker testing
    // await subscribeToMessages(queueReceiver);

    // 7. Demonstrate topic and subscription
    await demonstrateTopicSubscription(client);

  } catch (error) {
    console.error("\n❌ Error occurred:", error);
    throw error;
  } finally {
    // Proper cleanup - close all senders, receivers, and the client
    console.log("\n\n=== Cleanup ===");
    
    await queueSender.close();
    console.log("✓ Queue sender closed");
    
    await queueReceiver.close();
    console.log("✓ Queue receiver closed");
    
    await client.close();
    console.log("✓ ServiceBusClient closed");
    
    console.log("\n✓ All resources cleaned up successfully");
  }
}

// Run the demo
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
