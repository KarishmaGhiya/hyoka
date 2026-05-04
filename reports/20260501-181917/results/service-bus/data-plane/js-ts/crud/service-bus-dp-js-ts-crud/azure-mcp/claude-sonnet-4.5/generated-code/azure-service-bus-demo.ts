import { ServiceBusClient, ServiceBusMessage, ServiceBusReceivedMessage } from "@azure/service-bus";

/**
 * Azure Service Bus Demo
 * 
 * Demonstrates:
 * - Creating ServiceBusClient with connection string
 * - Sending single messages and batches to queues
 * - Receiving messages (pull mode)
 * - Completing messages after processing
 * - Subscribing to messages (push mode)
 * - Topic/subscription messaging
 * 
 * Required package: @azure/service-bus
 * Install with: npm install @azure/service-bus
 */

// Connection string format: "Endpoint=sb://<namespace>.servicebus.windows.net/;SharedAccessKeyName=...;SharedAccessKey=..."
const connectionString = process.env.SERVICE_BUS_CONNECTION_STRING || "your-connection-string-here";
const queueName = "demo-queue";
const topicName = "demo-topic";
const subscriptionName = "demo-subscription";

async function main() {
    console.log("Azure Service Bus Demo\n");
    
    // 1. Create ServiceBusClient
    console.log("1. Creating ServiceBusClient...");
    const serviceBusClient = new ServiceBusClient(connectionString);
    console.log("   ✓ ServiceBusClient created\n");
    
    try {
        // 2. Send a single message to queue
        await sendSingleMessage(serviceBusClient);
        
        // 3. Send a batch of messages
        await sendMessageBatch(serviceBusClient);
        
        // 4. Receive messages using receiveMessages()
        await receiveMessagesInPullMode(serviceBusClient);
        
        // 5. Subscribe to messages using subscribe()
        await subscribeToMessages(serviceBusClient);
        
        // 6. Demonstrate topic/subscription messaging
        await demonstrateTopicSubscription(serviceBusClient);
        
    } finally {
        // 7. Cleanup - close the client
        console.log("\nClosing ServiceBusClient...");
        await serviceBusClient.close();
        console.log("✓ ServiceBusClient closed");
    }
}

/**
 * 2. Send a single message to a queue
 */
async function sendSingleMessage(client: ServiceBusClient): Promise<void> {
    console.log("2. Sending single message to queue...");
    
    const sender = client.createSender(queueName);
    
    try {
        const message: ServiceBusMessage = {
            body: { orderId: 1001, product: "Laptop", quantity: 1 },
            contentType: "application/json",
            messageId: "msg-001",
            subject: "Order"
        };
        
        await sender.sendMessages(message);
        console.log(`   ✓ Sent message: ${message.messageId}\n`);
    } finally {
        await sender.close();
    }
}

/**
 * 3. Send a batch of messages using createMessageBatch() and tryAddMessage()
 */
async function sendMessageBatch(client: ServiceBusClient): Promise<void> {
    console.log("3. Sending batch of messages...");
    
    const sender = client.createSender(queueName);
    
    try {
        // Create a batch
        const batch = await sender.createMessageBatch();
        
        // Try to add 5 messages to the batch
        for (let i = 1; i <= 5; i++) {
            const message: ServiceBusMessage = {
                body: { 
                    orderId: 2000 + i, 
                    product: `Product ${i}`, 
                    quantity: i 
                },
                messageId: `batch-msg-${i}`,
                subject: "BatchOrder"
            };
            
            // Try to add the message to the batch
            const added = batch.tryAddMessage(message);
            
            if (!added) {
                console.log(`   ⚠ Message ${i} was too large to fit in batch`);
                // If a message is too large, send current batch and create a new one
                await sender.sendMessages(batch);
                batch.tryAddMessage(message);
            } else {
                console.log(`   ✓ Added message ${i} to batch`);
            }
        }
        
        // Send the batch
        await sender.sendMessages(batch);
        console.log(`   ✓ Batch sent (${batch.count} messages)\n`);
    } finally {
        await sender.close();
    }
}

/**
 * 4. Receive messages using receiveMessages() - Pull mode
 * 5. Complete messages with completeMessage() after processing
 */
async function receiveMessagesInPullMode(client: ServiceBusClient): Promise<void> {
    console.log("4. Receiving messages in pull mode...");
    
    const receiver = client.createReceiver(queueName);
    
    try {
        // Receive up to 10 messages, wait up to 10 seconds
        const messages = await receiver.receiveMessages(10, { maxWaitTimeInMs: 10000 });
        
        console.log(`   Received ${messages.length} messages`);
        
        for (const message of messages) {
            console.log(`   Processing message: ${message.messageId}`);
            console.log(`     Body: ${JSON.stringify(message.body)}`);
            console.log(`     Subject: ${message.subject}`);
            console.log(`     Delivery count: ${message.deliveryCount}`);
            
            // Process the message (simulate work)
            await processMessage(message);
            
            // 5. Complete the message to remove it from the queue
            await receiver.completeMessage(message);
            console.log(`   ✓ Message ${message.messageId} completed`);
        }
        
        console.log();
    } finally {
        await receiver.close();
    }
}

/**
 * 6. Subscribe to messages using subscribe() - Push mode
 */
async function subscribeToMessages(client: ServiceBusClient): Promise<void> {
    console.log("6. Subscribing to messages (push mode)...");
    
    const receiver = client.createReceiver(queueName);
    
    // Set up the message handlers
    const processMessage = async (message: ServiceBusReceivedMessage) => {
        console.log(`   [Subscribe] Received message: ${message.messageId}`);
        console.log(`     Body: ${JSON.stringify(message.body)}`);
        
        // Process the message
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate processing
        
        // Message is automatically completed if processMessage doesn't throw
        console.log(`   [Subscribe] ✓ Message ${message.messageId} processed`);
    };
    
    const processError = async (error: Error) => {
        console.error(`   [Subscribe] ✗ Error occurred: ${error.message}`);
    };
    
    // Subscribe to messages
    const subscription = receiver.subscribe({
        processMessage,
        processError
    });
    
    console.log("   Subscribed. Waiting for messages...");
    
    // Wait for a few seconds to receive messages
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Close the subscription
    await subscription.close();
    await receiver.close();
    console.log("   ✓ Subscription closed\n");
}

/**
 * 7. Demonstrate topic/subscription messaging
 */
async function demonstrateTopicSubscription(client: ServiceBusClient): Promise<void> {
    console.log("7. Demonstrating topic/subscription messaging...");
    
    // Create a sender for the topic
    const topicSender = client.createSender(topicName);
    
    try {
        // Send messages to the topic
        console.log("   Sending messages to topic...");
        const messages: ServiceBusMessage[] = [
            {
                body: { event: "OrderCreated", orderId: 3001 },
                messageId: "topic-msg-1",
                subject: "Order",
                applicationProperties: { eventType: "OrderCreated" }
            },
            {
                body: { event: "OrderShipped", orderId: 3002 },
                messageId: "topic-msg-2",
                subject: "Order",
                applicationProperties: { eventType: "OrderShipped" }
            },
            {
                body: { event: "OrderDelivered", orderId: 3003 },
                messageId: "topic-msg-3",
                subject: "Order",
                applicationProperties: { eventType: "OrderDelivered" }
            }
        ];
        
        await topicSender.sendMessages(messages);
        console.log(`   ✓ Sent ${messages.length} messages to topic\n`);
        
        // Receive messages from the subscription
        console.log("   Receiving messages from subscription...");
        const subscriptionReceiver = client.createReceiver(topicName, subscriptionName);
        
        try {
            const receivedMessages = await subscriptionReceiver.receiveMessages(5, { maxWaitTimeInMs: 5000 });
            console.log(`   Received ${receivedMessages.length} messages from subscription`);
            
            for (const message of receivedMessages) {
                console.log(`   Message: ${message.messageId}`);
                console.log(`     Event: ${message.body.event}`);
                console.log(`     OrderId: ${message.body.orderId}`);
                console.log(`     EventType property: ${message.applicationProperties?.eventType}`);
                
                // Complete the message
                await subscriptionReceiver.completeMessage(message);
                console.log(`   ✓ Completed`);
            }
        } finally {
            await subscriptionReceiver.close();
        }
        
    } finally {
        await topicSender.close();
    }
    
    console.log();
}

/**
 * Helper function to simulate message processing
 */
async function processMessage(message: ServiceBusReceivedMessage): Promise<void> {
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 100));
}

// Run the demo
main().catch((error) => {
    console.error("Error running demo:", error);
    process.exit(1);
});
