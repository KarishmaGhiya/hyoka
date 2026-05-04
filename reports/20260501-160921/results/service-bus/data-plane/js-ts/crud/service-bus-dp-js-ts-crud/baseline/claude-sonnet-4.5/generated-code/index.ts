import { 
  ServiceBusClient, 
  ServiceBusMessage, 
  ServiceBusReceiver, 
  ServiceBusSender,
  ServiceBusReceivedMessage 
} from "@azure/service-bus";

// Configuration - Replace with your actual connection string, queue, topic, and subscription names
const connectionString = process.env.AZURE_SERVICEBUS_CONNECTION_STRING || 
  "Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=your-key";
const queueName = "demo-queue";
const topicName = "demo-topic";
const subscriptionName = "demo-subscription";

// 1. Create a ServiceBusClient using a connection string
function createServiceBusClient(): ServiceBusClient {
  console.log("Creating ServiceBusClient...");
  const client = new ServiceBusClient(connectionString);
  console.log("ServiceBusClient created successfully\n");
  return client;
}

// 2. Send a single message to a queue
async function sendSingleMessage(sender: ServiceBusSender): Promise<void> {
  console.log("=== Sending Single Message ===");
  
  const message: ServiceBusMessage = {
    body: { orderId: "12345", product: "Laptop", quantity: 1 },
    messageId: "single-msg-001",
    contentType: "application/json"
  };
  
  await sender.sendMessages(message);
  console.log(`Sent single message: ${message.messageId}\n`);
}

// 3. Send a batch of 5 messages using createMessageBatch() and tryAddMessage()
async function sendBatchMessages(sender: ServiceBusSender): Promise<void> {
  console.log("=== Sending Batch Messages ===");
  
  const batch = await sender.createMessageBatch();
  
  for (let i = 1; i <= 5; i++) {
    const message: ServiceBusMessage = {
      body: { 
        orderId: `BATCH-${i}`, 
        product: `Product ${i}`, 
        quantity: i 
      },
      messageId: `batch-msg-${i.toString().padStart(3, '0')}`,
      contentType: "application/json"
    };
    
    const added = batch.tryAddMessage(message);
    if (!added) {
      console.log(`Message ${i} is too large for batch, sending current batch...`);
      await sender.sendMessages(batch);
      batch.tryAddMessage(message);
    }
    console.log(`Added message to batch: ${message.messageId}`);
  }
  
  await sender.sendMessages(batch);
  console.log("Batch sent successfully\n");
}

// 4. Receive messages using receiveMessages()
async function receiveMessages(receiver: ServiceBusReceiver): Promise<void> {
  console.log("=== Receiving Messages ===");
  
  const messages = await receiver.receiveMessages(3, { maxWaitTimeInMs: 5000 });
  console.log(`Received ${messages.length} messages`);
  
  for (const message of messages) {
    console.log(`\nMessage ID: ${message.messageId}`);
    console.log(`Body: ${JSON.stringify(message.body)}`);
    console.log(`Delivery Count: ${message.deliveryCount}`);
    
    // 5. Complete a message with completeMessage() after processing
    await receiver.completeMessage(message);
    console.log(`Message ${message.messageId} completed`);
  }
  console.log();
}

// 6. Subscribe to messages using subscribe() with processMessage and processError handlers
async function subscribeToMessages(receiver: ServiceBusReceiver): Promise<void> {
  console.log("=== Subscribing to Messages ===");
  
  return new Promise((resolve, reject) => {
    let messageCount = 0;
    const maxMessages = 3;
    
    const subscription = receiver.subscribe({
      processMessage: async (message: ServiceBusReceivedMessage) => {
        console.log(`\n[Subscribe] Received message: ${message.messageId}`);
        console.log(`[Subscribe] Body: ${JSON.stringify(message.body)}`);
        
        // Process the message
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate processing
        
        console.log(`[Subscribe] Message ${message.messageId} processed`);
        
        messageCount++;
        if (messageCount >= maxMessages) {
          console.log("\nReceived maximum messages, closing subscription...\n");
          subscription.close();
          resolve(undefined);
        }
      },
      processError: async (error) => {
        console.error("[Subscribe] Error occurred:", error);
        reject(error);
      }
    });
    
    // Set timeout to close subscription if not enough messages
    setTimeout(() => {
      console.log("\nSubscription timeout reached, closing...\n");
      subscription.close();
      resolve(undefined);
    }, 10000);
  });
}

// 7. Demonstrate sending to a topic and receiving from a subscription
async function demonstrateTopicSubscription(client: ServiceBusClient): Promise<void> {
  console.log("=== Topic and Subscription Demo ===");
  
  const topicSender = client.createSender(topicName);
  const subscriptionReceiver = client.createReceiver(topicName, subscriptionName);
  
  try {
    // Send messages to topic
    console.log("Sending messages to topic...");
    for (let i = 1; i <= 3; i++) {
      const message: ServiceBusMessage = {
        body: { 
          eventType: "OrderPlaced", 
          orderId: `TOPIC-${i}`,
          timestamp: new Date().toISOString()
        },
        messageId: `topic-msg-${i.toString().padStart(3, '0')}`,
        subject: "order.placed"
      };
      
      await topicSender.sendMessages(message);
      console.log(`Sent to topic: ${message.messageId}`);
    }
    
    // Receive from subscription
    console.log("\nReceiving messages from subscription...");
    const messages = await subscriptionReceiver.receiveMessages(3, { maxWaitTimeInMs: 5000 });
    
    for (const message of messages) {
      console.log(`\nReceived from subscription: ${message.messageId}`);
      console.log(`Subject: ${message.subject}`);
      console.log(`Body: ${JSON.stringify(message.body)}`);
      
      await subscriptionReceiver.completeMessage(message);
      console.log(`Message completed: ${message.messageId}`);
    }
    
  } finally {
    await topicSender.close();
    await subscriptionReceiver.close();
    console.log("\nTopic sender and subscription receiver closed\n");
  }
}

// Main execution function
async function main(): Promise<void> {
  console.log("Azure Service Bus TypeScript Demo\n");
  console.log("=".repeat(50) + "\n");
  
  const client = createServiceBusClient();
  
  try {
    // Demo 1-5: Queue operations
    const queueSender = client.createSender(queueName);
    const queueReceiver = client.createReceiver(queueName);
    
    try {
      // 2. Send single message
      await sendSingleMessage(queueSender);
      
      // 3. Send batch messages
      await sendBatchMessages(queueSender);
      
      // 4 & 5. Receive and complete messages
      await receiveMessages(queueReceiver);
      
      // 6. Subscribe to messages
      await subscribeToMessages(queueReceiver);
      
    } finally {
      await queueSender.close();
      await queueReceiver.close();
      console.log("Queue sender and receiver closed\n");
    }
    
    // Demo 7: Topic and subscription
    await demonstrateTopicSubscription(client);
    
    console.log("=".repeat(50));
    console.log("\nDemo completed successfully!");
    
  } catch (error) {
    console.error("\nError occurred during demo:", error);
    throw error;
  } finally {
    // Proper cleanup
    await client.close();
    console.log("\nServiceBusClient closed");
  }
}

// Run the demo
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
