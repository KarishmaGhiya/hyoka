# Azure Cosmos DB CRUD Operations Demo

This TypeScript program demonstrates CRUD (Create, Read, Update, Delete) operations on Azure Cosmos DB NoSQL container.

## Features

1. ✅ Create a CosmosClient using endpoint and key
2. ✅ Create a database "TestDB" and container "Items" with partition key "/category"
3. ✅ Create an item with properties: id, category, name, quantity
4. ✅ Read the item back using item().read()
5. ✅ Query items where category equals "electronics" using parameterized query
6. ✅ Replace the item with updated quantity using item().replace()
7. ✅ Delete the item using item().delete()

## Required NPM Package

```bash
npm install @azure/cosmos
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure your Azure Cosmos DB credentials:
   - Copy `.env.example` to `.env`
   - Update `COSMOS_ENDPOINT` and `COSMOS_KEY` with your actual values

3. Build the TypeScript code:
   ```bash
   npm run build
   ```

4. Run the program:
   ```bash
   npm start
   ```

## Environment Variables

- `COSMOS_ENDPOINT`: Your Azure Cosmos DB endpoint (e.g., https://your-account.documents.azure.com:443/)
- `COSMOS_KEY`: Your Azure Cosmos DB primary or secondary key

## Error Handling

The program includes comprehensive error handling:
- Status code checks for all operations (201, 200, 204)
- Detailed error messages including error code, status code, and body
- Graceful exit on errors

## Expected Status Codes

- **201**: Item created successfully
- **200**: Item read or replaced successfully
- **204**: Item deleted successfully
- **4xx/5xx**: Error codes with detailed error information
