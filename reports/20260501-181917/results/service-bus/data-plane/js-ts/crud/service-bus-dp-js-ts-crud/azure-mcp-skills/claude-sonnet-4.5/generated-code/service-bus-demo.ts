/**
 * Azure Service Bus Demonstration
 * 
 * This program demonstrates comprehensive Azure Service Bus messaging patterns:
 * - Queue operations: single message, batch messages, receive, complete
 * - Topic/Subscription: publish-subscribe pattern
 * - Subscribe pattern: event-driven message processing
 * 
 * Required environment variables:
 * - SERVICEBUS_CONNECTION_STRING: Service Bus connection string
 * - QUEUE_NAME: Queue name (default: demo-queue)
 * - TOPIC_NAME: Topic name (default: demo-topic)
 * - SUBSCRIPTION_NAME: Subscription name (default: demo-subscription)
 */

import {
  ServiceBusClient,
  ServiceBusMessage,
  ServiceBusReceivedMessage,
  ProcessErrorArgs,
} from "@azure/service-bus";

// Configuration
const connectionString = process.env.SERVICEBUS_CONNECTION_STRING!;
const queueName = process.env.QUEUE_NAME || "demo-queue";
const topicName = process.env.TOPIC_NAME || "demo-topic";
const subscriptionName = process.env.SUBSCRIPTION_NAME || "demo-subscription";

/**
 * Demo 1: Send a single message to a queue
 */
async function sendSingleMessage(client: ServiceBusClient): Promise<void> {
  console.log("\n=== Demo 1: Sending Single Message ===");
  
  const sender = client.createSender(queueName);
  
  try {
    const message: ServiceBusMessage = {
      body: { orderId: "12345", amount: 99.99, customer: "John Doe" },
      contentType: "application/json",
      messageId: "msg-single-001",
      applicationProperties: {
        priority: "high",
        source: "demo-app",
      },
    };
    
    await sender.sendMessages(message);
    console.log(`✓ Sent single message: ${message.messageId}`);
  } finally {
    await sender.close();
  }
}

/**
 * Demo 2: Send a batch of 5 messages using createMessageBatch() and tryAddMessage()
 */
async function sendBatchMessages(client: ServiceBusClient): Promise<void> {
  console.log("\n=== Demo 2: Sending Batch Messages ===");
  
  const sender = client.createSender(queueName);
  
  try {
    // Create a batch with size limits
    const batch = await sender.createMessageBatch();
    
    // Try to add 5 messages to the batch
    for (let i = 1; i <= 5; i++) {
      const message: ServiceBusMessage = {
        body: {
          orderId: `ORD-${String(i).padStart(3, "0")}`,
          amount: 50 + i * 10,
          timestamp: new Date().toISOString(),
        },
        messageId: `msg-batch-${i}`,
      };
      
      const added = batch.tryAddMessage(message);
      
      if (!added) {
        // Batch is full - send current batch and create a new one
        console.log(`⚠ Batch full, sending ${batch.count} messages...`);
        await sender.sendMessages(batch);
        
        // Create new batch and add the message
        const newBatch = await sender.createMessageBatch();
        newBatch.tryAddMessage(message);
        await sender.sendMessages(newBatch);
        console.log(`✓ Sent overflow message: ${message.messageId}`);
      } else {
        console.log(`✓ Added to batch: ${message.messageId}`);
      }
    }
    
    // Send the remaining batch if it has messages
    if (batch.count > 0) {
      await sender.sendMessages(batch);
      console.log(`✓ Sent batch of ${batch.count} messages`);
    }
  } finally {
    await sender.close();
  }
}

/**
 * Demo 3: Receive messages using receiveMessages()
 * Demo 4: Complete messages with completeMessage()
 */
async function receiveAndCompleteMessages(client: ServiceBusClient): Promise<void> {
  console.log("\n=== Demo 3 & 4: Receiving and Completing Messages ===");
  
  const receiver = client.createReceiver(queueName, {
    receiveMode: "peekLock", // Message locked until settled
  });
  
  try {
    // Receive up to 10 messages with 5 second timeout
    const messages = await receiver.receiveMessages(10, {
      maxWaitTimeInMs: 5000,
    });
    
    console.log(`✓ Received ${messages.length} message(s)`);
    
    for (const message of messages) {
      try {
        // Process the message
        console.log(`\n  Processing message: ${message.messageId}`);
        console.log(`  Body: ${JSON.stringify(message.body)}`);
        console.log(`  Delivery count: ${message.deliveryCount}`);
        console.log(`  Sequence number: ${message.sequenceNumber}`);
        
        // Simulate processing
        await processMessage(message);
        
        // Complete the message (remove from queue)
        await receiver.completeMessage(message);
        console.log(`  ✓ Completed message: ${message.messageId}`);
      } catch (error) {
        console.error(`  ✗ Error processing message: ${error}`);
        
        // Abandon the message (return to queue for retry)
        await receiver.abandonMessage(message);
        console.log(`  ⚠ Abandoned message: ${message.messageId}`);
      }
    }
  } finally {
    await receiver.close();
  }
}

/**
 * Demo 5: Subscribe to messages using subscribe() with handlers
 */
async function subscribeToMessages(client: ServiceBusClient): Promise<void> {
  console.log("\n=== Demo 5: Subscribing to Messages (Event-Driven) ===");
  
  const receiver = client.createReceiver(queueName);
  
  let messageCount = 0;
  const maxMessages = 3; // Process 3 messages then stop
  
  return new Promise<void>((resolve) => {
    // Subscribe with processMessage and processError handlers
    const subscription = receiver.subscribe(
      {
        processMessage: async (message: ServiceBusReceivedMessage) => {
          messageCount++;
          console.log(`\n  [Subscribe] Message ${messageCount} received`);
          console.log(`  Message ID: ${message.messageId}`);
          console.log(`  Body: ${JSON.stringify(message.body)}`);
          console.log(`  Enqueued time: ${message.enqueuedTimeUtc}`);
          
          // Simulate processing
          await new Promise(resolve => setTimeout(resolve, 500));
          
          console.log(`  ✓ [Subscribe] Message processed successfully`);
          // Message is auto-completed on success
          
          // Stop after processing enough messages
          if (messageCount >= maxMessages) {
            console.log(`\n  Reached ${maxMessages} messages, stopping subscription...`);
            setTimeout(async () => {
              await subscription.close();
              await receiver.close();
              resolve();
            }, 1000);
          }
        },
        
        processError: async (args: ProcessErrorArgs) => {
          console.error(`\n  [Subscribe] Error occurred!`);
          console.error(`  Error source: ${args.errorSource}`);
          console.error(`  Entity path: ${args.entityPath}`);
          console.error(`  Error: ${args.error.message}`);
          
          // Handle specific error sources
          if (args.errorSource === "receive") {
            console.log(`  ⚠ Connection issue - SDK will reconnect`);
          } else if (args.errorSource === "processMessageCallback") {
            console.log(`  ⚠ Error in message handler`);
          }
        },
      },
      {
        autoCompleteMessages: true, // Auto-complete on success
        maxConcurrentCalls: 1, // Process one message at a time
      }
    );
    
    console.log("✓ Subscription active, waiting for messages...");
    
    // Timeout after 10 seconds if no messages arrive
    setTimeout(async () => {
      if (messageCount < maxMessages) {
        console.log("\n  Timeout reached, closing subscription...");
        await subscription.close();
        await receiver.close();
        resolve();
      }
    }, 10000);
  });
}

/**
 * Demo 6: Send message to a topic
 */
async function sendToTopic(client: ServiceBusClient): Promise<void> {
  console.log("\n=== Demo 6: Sending to Topic ===");
  
  const sender = client.createSender(topicName);
  
  try {
    const messages: ServiceBusMessage[] = [
      {
        body: {
          event: "order.created",
          orderId: "ORD-789",
          customerId: "CUST-123",
          amount: 299.99,
        },
        contentType: "application/json",
        subject: "orders/created",
        applicationProperties: {
          eventType: "order.created",
          region: "us-west",
          priority: "high",
        },
      },
      {
        body: {
          event: "order.updated",
          orderId: "ORD-790",
          status: "shipped",
        },
        subject: "orders/updated",
        applicationProperties: {
          eventType: "order.updated",
          region: "us-east",
        },
      },
    ];
    
    for (const message of messages) {
      await sender.sendMessages(message);
      console.log(`✓ Sent to topic: ${message.body.event}`);
    }
  } finally {
    await sender.close();
  }
}

/**
 * Demo 7: Receive messages from a topic subscription
 */
async function receiveFromSubscription(client: ServiceBusClient): Promise<void> {
  console.log("\n=== Demo 7: Receiving from Topic Subscription ===");
  
  // Create receiver for topic subscription
  const receiver = client.createReceiver(topicName, subscriptionName);
  
  try {
    // Receive messages from the subscription
    const messages = await receiver.receiveMessages(10, {
      maxWaitTimeInMs: 5000,
    });
    
    console.log(`✓ Received ${messages.length} message(s) from subscription`);
    
    for (const message of messages) {
      console.log(`\n  Message from topic:`);
      console.log(`  Subject: ${message.subject}`);
      console.log(`  Event: ${message.body.event}`);
      console.log(`  Body: ${JSON.stringify(message.body)}`);
      console.log(`  Properties:`, message.applicationProperties);
      
      // Complete the message
      await receiver.completeMessage(message);
      console.log(`  ✓ Completed message from subscription`);
    }
  } finally {
    await receiver.close();
  }
}

/**
 * Helper function to simulate message processing
 */
async function processMessage(message: ServiceBusReceivedMessage): Promise<void> {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Simulate occasional failure for demo purposes
  // Uncomment to test error handling:
  // if (Math.random() > 0.8) {
  //   throw new Error("Simulated processing error");
  // }
}

/**
 * Main function to run all demos
 */
async function main(): Promise<void> {
  // Validate configuration
  if (!connectionString) {
    console.error("❌ Error: SERVICEBUS_CONNECTION_STRING environment variable is not set");
    console.error("\nPlease set the following environment variables:");
    console.error("  SERVICEBUS_CONNECTION_STRING=<your-connection-string>");
    console.error("  QUEUE_NAME=<queue-name> (optional, default: demo-queue)");
    console.error("  TOPIC_NAME=<topic-name> (optional, default: demo-topic)");
    console.error("  SUBSCRIPTION_NAME=<subscription-name> (optional, default: demo-subscription)");
    process.exit(1);
  }
  
  console.log("Azure Service Bus Demo");
  console.log("======================");
  console.log(`Queue: ${queueName}`);
  console.log(`Topic: ${topicName}`);
  console.log(`Subscription: ${subscriptionName}`);
  
  // Create ServiceBusClient using connection string
  const client = new ServiceBusClient(connectionString);
  
  try {
    // Run all demos sequentially
    await sendSingleMessage(client);
    await sendBatchMessages(client);
    
    // Wait a moment for messages to be available
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await receiveAndCompleteMessages(client);
    
    // Send more messages for subscribe demo
    await sendBatchMessages(client);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await subscribeToMessages(client);
    
    // Topic/Subscription demo
    await sendToTopic(client);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await receiveFromSubscription(client);
    
    console.log("\n======================");
    console.log("✓ All demos completed successfully!");
    console.log("======================\n");
  } catch (error) {
    console.error("\n❌ Error during demo:", error);
    throw error;
  } finally {
    // Always close the client to clean up resources
    await client.close();
    console.log("✓ ServiceBusClient closed");
  }
}

// Run the demo
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
