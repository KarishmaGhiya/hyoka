import { 
    ServiceBusClient, 
    ServiceBusMessage, 
    ServiceBusSender,
    ServiceBusReceiver,
    ServiceBusReceivedMessage 
} from "@azure/service-bus";

// Connection string - Replace with your actual Service Bus connection string
const connectionString = process.env.SERVICE_BUS_CONNECTION_STRING || 
    "Endpoint=sb://<your-namespace>.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=<your-key>";
const queueName = "demo-queue";
const topicName = "demo-topic";
const subscriptionName = "demo-subscription";

async function sendSingleMessage(sender: ServiceBusSender): Promise<void> {
    console.log("\n=== Sending Single Message ===");
    
    const message: ServiceBusMessage = {
        body: { orderId: "12345", amount: 99.99 },
        contentType: "application/json",
        subject: "Order Confirmation"
    };
    
    await sender.sendMessages(message);
    console.log("✓ Single message sent successfully");
}

async function sendBatchMessages(sender: ServiceBusSender): Promise<void> {
    console.log("\n=== Sending Batch of 5 Messages ===");
    
    // Create a batch
    const batch = await sender.createMessageBatch();
    
    for (let i = 1; i <= 5; i++) {
        const message: ServiceBusMessage = {
            body: { messageNumber: i, timestamp: new Date() },
            messageId: `batch-msg-${i}`
        };
        
        // Try to add message to batch
        const added = batch.tryAddMessage(message);
        
        if (!added) {
            console.log(`Message ${i} could not be added to batch (batch full)`);
            break;
        }
        console.log(`✓ Added message ${i} to batch`);
    }
    
    // Send the batch
    await sender.sendMessages(batch);
    console.log(`✓ Batch of ${batch.count} messages sent successfully`);
}

async function receiveMessagesInBatch(receiver: ServiceBusReceiver): Promise<void> {
    console.log("\n=== Receiving Messages with receiveMessages() ===");
    
    // Receive up to 5 messages at once, wait max 5 seconds
    const messages = await receiver.receiveMessages(5, { maxWaitTimeInMs: 5000 });
    
    console.log(`Received ${messages.length} messages`);
    
    for (const message of messages) {
        console.log(`\nMessage ID: ${message.messageId}`);
        console.log(`Body: ${JSON.stringify(message.body)}`);
        console.log(`Delivery Count: ${message.deliveryCount}`);
        
        // Process the message (simulate work)
        await processMessage(message);
        
        // Complete the message to remove it from the queue
        await receiver.completeMessage(message);
        console.log("✓ Message completed and removed from queue");
    }
}

async function subscribeToMessages(receiver: ServiceBusReceiver): Promise<void> {
    console.log("\n=== Subscribing to Messages with subscribe() ===");
    
    return new Promise((resolve) => {
        let messageCount = 0;
        const maxMessages = 3; // Process 3 messages then close
        
        const subscription = receiver.subscribe({
            processMessage: async (message: ServiceBusReceivedMessage) => {
                messageCount++;
                console.log(`\n[Subscription] Received message ${messageCount}`);
                console.log(`Message ID: ${message.messageId}`);
                console.log(`Body: ${JSON.stringify(message.body)}`);
                
                // Process the message
                await processMessage(message);
                
                // Auto-complete is enabled by default in subscribe mode
                console.log("✓ Message auto-completed");
                
                // Close subscription after max messages
                if (messageCount >= maxMessages) {
                    console.log(`\nProcessed ${maxMessages} messages, closing subscription...`);
                    await subscription.close();
                    resolve();
                }
            },
            processError: async (error) => {
                console.error("[Subscription] Error occurred:", error);
            }
        });
        
        // Set a timeout to resolve even if we don't get enough messages
        setTimeout(async () => {
            console.log("\nSubscription timeout reached, closing...");
            await subscription.close();
            resolve();
        }, 10000); // 10 second timeout
    });
}

async function processMessage(message: ServiceBusReceivedMessage): Promise<void> {
    // Simulate message processing
    console.log("Processing message...");
    await new Promise(resolve => setTimeout(resolve, 100));
}

async function demonstrateQueueOperations(): Promise<void> {
    console.log("\n╔═══════════════════════════════════════╗");
    console.log("║  QUEUE OPERATIONS DEMONSTRATION       ║");
    console.log("╚═══════════════════════════════════════╝");
    
    const sbClient = new ServiceBusClient(connectionString);
    
    try {
        // 1. Create sender and send messages
        const sender = sbClient.createSender(queueName);
        
        await sendSingleMessage(sender);
        await sendBatchMessages(sender);
        
        await sender.close();
        console.log("\n✓ Sender closed");
        
        // Small delay to ensure messages are available
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 2. Create receiver and receive messages
        const receiver = sbClient.createReceiver(queueName);
        
        await receiveMessagesInBatch(receiver);
        
        // 3. Subscribe to remaining messages
        await subscribeToMessages(receiver);
        
        await receiver.close();
        console.log("✓ Receiver closed");
        
    } finally {
        await sbClient.close();
        console.log("✓ ServiceBusClient closed");
    }
}

async function demonstrateTopicSubscriptionOperations(): Promise<void> {
    console.log("\n\n╔═══════════════════════════════════════╗");
    console.log("║  TOPIC/SUBSCRIPTION DEMONSTRATION     ║");
    console.log("╚═══════════════════════════════════════╝");
    
    const sbClient = new ServiceBusClient(connectionString);
    
    try {
        // Send messages to a topic
        console.log("\n=== Sending Messages to Topic ===");
        const topicSender = sbClient.createSender(topicName);
        
        const topicMessages: ServiceBusMessage[] = [
            {
                body: { event: "UserRegistered", userId: "user-001" },
                subject: "User Events",
                applicationProperties: { priority: "high" }
            },
            {
                body: { event: "OrderPlaced", orderId: "order-123" },
                subject: "Order Events",
                applicationProperties: { priority: "medium" }
            },
            {
                body: { event: "PaymentProcessed", paymentId: "pay-456" },
                subject: "Payment Events",
                applicationProperties: { priority: "high" }
            }
        ];
        
        await topicSender.sendMessages(topicMessages);
        console.log(`✓ Sent ${topicMessages.length} messages to topic`);
        
        await topicSender.close();
        console.log("✓ Topic sender closed");
        
        // Small delay to ensure messages are available
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Receive messages from a subscription
        console.log("\n=== Receiving Messages from Subscription ===");
        const subscriptionReceiver = sbClient.createReceiver(topicName, subscriptionName);
        
        const receivedMessages = await subscriptionReceiver.receiveMessages(5, { 
            maxWaitTimeInMs: 5000 
        });
        
        console.log(`Received ${receivedMessages.length} messages from subscription`);
        
        for (const message of receivedMessages) {
            console.log(`\nSubject: ${message.subject}`);
            console.log(`Body: ${JSON.stringify(message.body)}`);
            console.log(`Priority: ${message.applicationProperties?.priority}`);
            
            await subscriptionReceiver.completeMessage(message);
            console.log("✓ Message completed");
        }
        
        await subscriptionReceiver.close();
        console.log("\n✓ Subscription receiver closed");
        
    } finally {
        await sbClient.close();
        console.log("✓ ServiceBusClient closed");
    }
}

async function main(): Promise<void> {
    try {
        console.log("╔═══════════════════════════════════════════════════╗");
        console.log("║  Azure Service Bus TypeScript Demonstration      ║");
        console.log("╚═══════════════════════════════════════════════════╝");
        
        // Demonstrate Queue Operations
        await demonstrateQueueOperations();
        
        // Demonstrate Topic/Subscription Operations
        await demonstrateTopicSubscriptionOperations();
        
        console.log("\n\n✅ All demonstrations completed successfully!");
        
    } catch (error) {
        console.error("\n❌ Error occurred:", error);
        process.exit(1);
    }
}

// Run the demonstration
main();
