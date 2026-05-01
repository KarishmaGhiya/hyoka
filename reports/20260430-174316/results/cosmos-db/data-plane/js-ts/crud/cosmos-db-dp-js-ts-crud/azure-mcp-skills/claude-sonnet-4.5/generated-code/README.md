# Azure Cosmos DB CRUD Operations Demo

This TypeScript program demonstrates all CRUD operations with Azure Cosmos DB NoSQL API.

## Required Package

```bash
npm install @azure/cosmos
```

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set environment variables:**
   ```bash
   # Windows (PowerShell)
   $env:COSMOS_ENDPOINT="https://your-account.documents.azure.com:443/"
   $env:COSMOS_KEY="your-primary-or-secondary-key"
   
   # Linux/Mac
   export COSMOS_ENDPOINT="https://your-account.documents.azure.com:443/"
   export COSMOS_KEY="your-primary-or-secondary-key"
   ```

## Run

```bash
# Run directly with ts-node
npm run dev

# Or compile and run
npm run build
npm start
```

## Operations Performed

1. **Create CosmosClient** - Initializes client with endpoint and key
2. **Create Database & Container** - Creates "TestDB" database and "Items" container with partition key "/category"
3. **Create Item** - Inserts item with id, category, name, quantity (Status: 201)
4. **Read Item** - Retrieves item using `item().read()` (Status: 200)
5. **Query Items** - Parameterized query for category "electronics"
6. **Replace Item** - Updates quantity using `item().replace()` (Status: 200)
7. **Delete Item** - Removes item using `item().delete()` (Status: 204)

## Error Handling

- Status code validation for each operation
- Detailed error messages with status codes
- Verification of deletion with 404 check

## Expected Output

```
✓ CosmosClient created
✓ Database 'TestDB' ready
✓ Container 'Items' ready with partition key '/category'
✓ Item created (Status: 201)
  ID: item-001, Name: Wireless Mouse
✓ Item read successfully (Status: 200)
  Item: { id: "item-001", category: "electronics", name: "Wireless Mouse", quantity: 50 }
✓ Query executed: Found 1 item(s) in 'electronics' category
  [1] Wireless Mouse (Quantity: 50)
✓ Item replaced successfully (Status: 200)
  Updated quantity: 75
✓ Item deleted successfully (Status: 204)
✓ Verified: Item no longer exists (404 Not Found)

🎉 All CRUD operations completed successfully!
```
