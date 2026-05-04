# Azure Cosmos DB CRUD Operations Example

This TypeScript program demonstrates complete CRUD (Create, Read, Update, Delete) operations with Azure Cosmos DB NoSQL API.

## Features

✅ **Create**: CosmosClient with endpoint and key authentication  
✅ **Database & Container**: Creates "TestDB" database and "Items" container with partition key "/category"  
✅ **Create Item**: Inserts an item with id, category, name, and quantity properties  
✅ **Read Item**: Retrieves the item using `item().read()`  
✅ **Query Items**: Queries items with parameterized query (category = "electronics")  
✅ **Update Item**: Replaces the item with updated quantity using `item().replace()`  
✅ **Delete Item**: Removes the item using `item().delete()`  
✅ **Error Handling**: Comprehensive error handling with status code checks (404, 409, 429, etc.)  

## Required Package

```bash
npm install @azure/cosmos
```

## Prerequisites

- Node.js >= 20.0.0
- Azure Cosmos DB account
- Cosmos DB endpoint and key

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Copy `.env.example` to `.env` and update with your Cosmos DB credentials:
   ```bash
   COSMOS_ENDPOINT=https://your-account-name.documents.azure.com:443/
   COSMOS_KEY=your-primary-or-secondary-key
   ```

   Or set them in your shell:
   ```bash
   # Windows PowerShell
   $env:COSMOS_ENDPOINT="https://your-account.documents.azure.com:443/"
   $env:COSMOS_KEY="your-key-here"

   # Linux/Mac
   export COSMOS_ENDPOINT="https://your-account.documents.azure.com:443/"
   export COSMOS_KEY="your-key-here"
   ```

## Usage

Run the program:

```bash
npm start
```

Or compile and run:

```bash
npm run build
node dist/cosmos-crud.js
```

## Expected Output

```
✓ CosmosClient created
✓ Database 'TestDB' created or already exists
✓ Container 'Items' created or already exists with partition key '/category'
✓ Item created successfully (Status: 201)
  Created item: { id: 'item-001', category: 'electronics', name: 'Laptop', quantity: 10 }
✓ Item read successfully (Status: 200)
  Read item: { id: 'item-001', category: 'electronics', name: 'Laptop', quantity: 10 }
✓ Query executed successfully
  Found 1 item(s) in 'electronics' category:
    [1] Laptop - Quantity: 10
✓ Item replaced successfully (Status: 200)
  Updated item: { id: 'item-001', category: 'electronics', name: 'Laptop', quantity: 15 }
✓ Item deleted successfully (Status: 204)
✓ Verified: Item no longer exists (404 Not Found)

✓ All CRUD operations completed successfully!

✓ CosmosClient disposed
```

## Error Handling

The program handles common Cosmos DB error status codes:

- **400** - Bad Request (invalid syntax)
- **401** - Unauthorized (invalid credentials)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found (resource doesn't exist)
- **409** - Conflict (resource already exists)
- **412** - Precondition Failed (ETag mismatch)
- **413** - Request Too Large (document size limit exceeded)
- **429** - Too Many Requests (rate limited with retry-after)
- **500** - Internal Server Error
- **503** - Service Unavailable

## Key Concepts

### Partition Key
The container uses `/category` as the partition key, which means all items with the same category value are stored in the same logical partition.

### Parameterized Queries
The program uses parameterized queries to prevent injection attacks:
```typescript
const querySpec: SqlQuerySpec = {
  query: "SELECT * FROM c WHERE c.category = @category",
  parameters: [{ name: "@category", value: "electronics" }]
};
```

### Status Code Checking
Each operation verifies the HTTP status code:
- **201** - Created (successful creation)
- **200** - OK (successful read/replace)
- **204** - No Content (successful deletion)

## Production Best Practices

For production applications, consider:

1. **Use Microsoft Entra ID authentication** instead of keys:
   ```typescript
   import { DefaultAzureCredential } from "@azure/identity";
   const credential = new DefaultAzureCredential();
   const client = new CosmosClient({ 
     endpoint, 
     aadCredentials: credential 
   });
   ```

2. **Implement retry logic** for 429 (rate limiting) errors

3. **Use bulk operations** for multiple writes:
   ```typescript
   await container.items.executeBulkOperations(operations);
   ```

4. **Enable optimistic concurrency** with ETags for updates

5. **Monitor RU consumption** to optimize costs

## Resources

- [@azure/cosmos Documentation](https://learn.microsoft.com/javascript/api/@azure/cosmos)
- [Azure Cosmos DB Documentation](https://learn.microsoft.com/azure/cosmos-db/)
- [Best Practices Guide](https://learn.microsoft.com/azure/cosmos-db/nosql/best-practice-nodejs)
