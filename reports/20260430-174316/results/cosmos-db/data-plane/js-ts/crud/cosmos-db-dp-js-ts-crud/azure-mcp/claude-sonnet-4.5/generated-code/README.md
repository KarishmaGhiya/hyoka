# Azure Cosmos DB CRUD Operations (TypeScript)

This program demonstrates CRUD operations on an Azure Cosmos DB NoSQL container using TypeScript.

## Required Package

- **@azure/cosmos** (v4.0.0+): Official Azure Cosmos DB SDK for Node.js/TypeScript

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set environment variables with your Cosmos DB credentials:
   ```bash
   # Windows (PowerShell)
   $env:COSMOS_ENDPOINT="https://your-account.documents.azure.com:443/"
   $env:COSMOS_KEY="your-cosmos-db-key"

   # Linux/Mac
   export COSMOS_ENDPOINT="https://your-account.documents.azure.com:443/"
   export COSMOS_KEY="your-cosmos-db-key"
   ```

3. Build the TypeScript code:
   ```bash
   npm run build
   ```

4. Run the program:
   ```bash
   npm start
   ```

## What the Program Does

1. **Create CosmosClient**: Initializes the client with endpoint and key
2. **Create Database & Container**: Creates "TestDB" database and "Items" container with partition key "/category"
3. **Create Item**: Inserts a new item with id, category, name, and quantity (Status 201)
4. **Read Item**: Retrieves the item using item().read() (Status 200)
5. **Query Items**: Executes parameterized query for items with category="electronics"
6. **Replace Item**: Updates the item's quantity using item().replace() (Status 200)
7. **Delete Item**: Removes the item using item().delete() (Status 204)

## Error Handling

The program includes comprehensive error handling:
- Status code checks for each operation (201, 200, 204)
- Try-catch block for handling exceptions
- Error messages include error code and status code when available
- Graceful exit on failure

## Expected Status Codes

- **201**: Created (successful item creation)
- **200**: OK (successful read or replace)
- **204**: No Content (successful deletion)
