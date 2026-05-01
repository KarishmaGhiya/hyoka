import { 
  ServiceBusClient, 
  ServiceBusMessage, 
  ServiceBusReceivedMessage,
  ServiceBusReceiver,
  ServiceBusSender
} from "@azure/service-bus";

// Configuration - Replace with your actual values
const CONNECTION_STRING = process.env.SERVICE_BUS_CONNECTION_STRING || "Endpoint=sb://...";
const QUEUE_NAME = "demo-queue";
const TOPIC_NAME = "demo-topic";
const SUBSCRIPTION_NAME = "demo-subscription";

/**
 * 1. Send a single message to a queue
 */
async function sendSingleMessage(sender: ServiceBusSender): Promise<void> {
  console.log("\n=== Sending Single Message ===");
  
  const message: ServiceBusMessage = {
    body: { orderId: 1001, product: "Laptop", quantity: 1 },
    contentType: "application/json",
    messageId: "msg-single-1",
    subject: "Order"
  };
  
  await sender.sendMessages(message);
  console.log("✓ Sent single message:", message.messageId);
}

/**
 * 2. Send a batch of messages using createMessageBatch()
 */
async function sendBatchMessages(sender: ServiceBusSender): Promise<void> {
  console.log("\n=== Sending Batch Messages ===");
  
  const batch = await sender.createMessageBatch();
  
  for (let i = 1; i <= 5; i++) {
    const message: ServiceBusMessage = {
      body: { orderId: 1000 + i, product: `Product-${i}`, quantity: i },
      contentType: "application/json",
      messageId: `msg-batch-${i}`,
      subject: "Order"
    };
    
    const added = batch.tryAddMessage(message);
    if (added) {
      console.log(`✓ Added message ${i} to batch: ${message.messageId}`);
    } else {
      console.log(`✗ Message ${i} too large for batch, sending current batch...`);
      await sender.sendMessages(batch);
      batch.tryAddMessage(message);
    }
  }
  
  if (batch.count > 0) {
    await sender.sendMessages(batch);
    console.log(`✓ Sent batch with ${batch.count} messages`);
  }
}

/**
 * 3. Receive messages using receiveMessages()
 */
async function receiveMessages(receiver: ServiceBusReceiver): Promise<void> {
  console.log("\n=== Receiving Messages (Pull Mode) ===");
  
  const messages = await receiver.receiveMessages(5, { maxWaitTimeInMs: 5000 });
  console.log(`Received ${messages.length} messages`);
  
  for (const message of messages) {
    console.log(`\nMessage ID: ${message.messageId}`);
    console.log(`Body:`, message.body);
    console.log(`Delivery Count: ${message.deliveryCount}`);
    
    // 4. Complete the message after processing
    await receiver.completeMessage(message);
    console.log(`✓ Completed message: ${message.messageId}`);
  }
}

/**
 * 5. Subscribe to messages using subscribe() with handlers
 */
async function subscribeToMessages(receiver: ServiceBusReceiver): Promise<void> {
  console.log("\n=== Subscribing to Messages (Push Mode) ===");
  
  const processMessage = async (message: ServiceBusReceivedMessage): Promise<void> => {
    console.log(`\n[Subscription Handler] Received message: ${message.messageId}`);
    console.log(`Body:`, message.body);
    console.log(`Subject: ${message.subject}`);
    
    // Simulate message processing
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Message is automatically completed when handler returns successfully
    console.log(`✓ Processed message: ${message.messageId}`);
  };
  
  const processError = async (error: Error): Promise<void> => {
    console.error(`[Error Handler] Error occurred:`, error.message);
  };
  
  const subscription = receiver.subscribe({
    processMessage,
    processError
  }, {
    autoCompleteMessages: true,
    maxConcurrentCalls: 1
  });
  
  console.log("Listening for messages... (will run for 10 seconds)");
  
  // Let it run for 10 seconds
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  console.log("\nClosing subscription...");
  await subscription.close();
  console.log("✓ Subscription closed");
}

/**
 * 6. Demonstrate topic and subscription messaging
 */
async function demonstrateTopicSubscription(client: ServiceBusClient): Promise<void> {
  console.log("\n=== Topic and Subscription Demo ===");
  
  // Create sender for topic
  const topicSender = client.createSender(TOPIC_NAME);
  
  try {
    // Send messages to topic
    const messages: ServiceBusMessage[] = [
      {
        body: { event: "UserRegistered", userId: "user-001" },
        subject: "Registration",
        applicationProperties: { eventType: "UserEvent" }
      },
      {
        body: { event: "OrderPlaced", orderId: "order-001" },
        subject: "Order",
        applicationProperties: { eventType: "OrderEvent" }
      },
      {
        body: { event: "PaymentProcessed", paymentId: "pay-001" },
        subject: "Payment",
        applicationProperties: { eventType: "PaymentEvent" }
      }
    ];
    
    for (const message of messages) {
      await topicSender.sendMessages(message);
      console.log(`✓ Sent to topic: ${message.body.event}`);
    }
    
    // Create receiver for subscription
    const subscriptionReceiver = client.createReceiver(TOPIC_NAME, SUBSCRIPTION_NAME);
    
    try {
      console.log("\nReceiving from subscription...");
      const receivedMessages = await subscriptionReceiver.receiveMessages(3, { 
        maxWaitTimeInMs: 5000 
      });
      
      console.log(`Received ${receivedMessages.length} messages from subscription`);
      
      for (const message of receivedMessages) {
        console.log(`\nEvent: ${message.body.event}`);
        console.log(`Subject: ${message.subject}`);
        console.log(`Properties:`, message.applicationProperties);
        
        await subscriptionReceiver.completeMessage(message);
        console.log(`✓ Completed: ${message.body.event}`);
      }
    } finally {
      await subscriptionReceiver.close();
      console.log("✓ Subscription receiver closed");
    }
  } finally {
    await topicSender.close();
    console.log("✓ Topic sender closed");
  }
}

/**
 * Main function to run all demonstrations
 */
async function main(): Promise<void> {
  console.log("Azure Service Bus Demo - TypeScript");
  console.log("====================================");
  
  // 1. Create ServiceBusClient
  const client = new ServiceBusClient(CONNECTION_STRING);
  console.log("✓ ServiceBusClient created");
  
  try {
    // Queue demonstrations
    const queueSender = client.createSender(QUEUE_NAME);
    const queueReceiver = client.createReceiver(QUEUE_NAME, {
      receiveMode: "peekLock" // or "receiveAndDelete"
    });
    
    try {
      // Send single message
      await sendSingleMessage(queueSender);
      
      // Send batch messages
      await sendBatchMessages(queueSender);
      
      // Receive and complete messages
      await receiveMessages(queueReceiver);
      
      // Subscribe to messages (push mode)
      // Send a few more messages first
      console.log("\n=== Preparing for subscription demo ===");
      for (let i = 1; i <= 3; i++) {
        await queueSender.sendMessages({
          body: { subscriptionTest: true, messageNumber: i },
          messageId: `sub-test-${i}`
        });
      }
      
      await subscribeToMessages(queueReceiver);
      
    } finally {
      await queueSender.close();
      console.log("\n✓ Queue sender closed");
      await queueReceiver.close();
      console.log("✓ Queue receiver closed");
    }
    
    // Topic and subscription demonstration
    await demonstrateTopicSubscription(client);
    
    console.log("\n=== All Demos Completed Successfully ===");
    
  } catch (error) {
    console.error("\n✗ Error occurred:", error);
    throw error;
  } finally {
    // Proper cleanup
    await client.close();
    console.log("\n✓ ServiceBusClient closed");
  }
}

// Run the demo
if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { 
  sendSingleMessage, 
  sendBatchMessages, 
  receiveMessages, 
  subscribeToMessages,
  demonstrateTopicSubscription 
};
