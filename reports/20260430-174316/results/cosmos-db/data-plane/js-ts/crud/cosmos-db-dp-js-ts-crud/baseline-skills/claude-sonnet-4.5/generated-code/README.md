# Azure Cosmos DB CRUD Operations - TypeScript

This program demonstrates complete CRUD operations with Azure Cosmos DB NoSQL API.

## Required Package

```bash
npm install @azure/cosmos
```

## Features

✅ **Create** CosmosClient with endpoint and key  
✅ **Create** database "TestDB" and container "Items" with partition key "/category"  
✅ **Create** an item with id, category, name, quantity  
✅ **Read** item back using `item().read()`  
✅ **Query** items with parameterized query (category = "electronics")  
✅ **Replace** item with updated quantity using `item().replace()`  
✅ **Delete** item using `item().delete()`  
✅ **Error handling** with status code checks

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set environment variables:
   ```bash
   export COSMOS_ENDPOINT="https://your-account.documents.azure.com:443/"
   export COSMOS_KEY="your-cosmos-db-key"
   ```

   Or on Windows (PowerShell):
   ```powershell
   $env:COSMOS_ENDPOINT="https://your-account.documents.azure.com:443/"
   $env:COSMOS_KEY="your-cosmos-db-key"
   ```

3. Run the program:
   ```bash
   npm start
   ```

## Status Codes Handled

- **201**: Item created successfully
- **200**: Item read/replaced successfully
- **204**: Item deleted successfully
- **404**: Item not found (expected after deletion)

## Program Flow

1. Creates CosmosClient connection
2. Creates/opens TestDB database
3. Creates/opens Items container with /category partition key
4. Creates a new item (Laptop, electronics, quantity: 5)
5. Reads the item back to verify creation
6. Queries for all electronics items
7. Updates the item (quantity: 5 → 10)
8. Deletes the item
9. Verifies deletion (expects 404)
