# Azure Cosmos DB CRUD Operations in TypeScript

This program demonstrates all basic CRUD operations on Azure Cosmos DB NoSQL API.

## Required Package

```bash
npm install @azure/cosmos
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set environment variables:
```bash
# Windows (PowerShell)
$env:COSMOS_ENDPOINT="https://your-account.documents.azure.com:443/"
$env:COSMOS_KEY="your-cosmos-key"

# Windows (CMD)
set COSMOS_ENDPOINT=https://your-account.documents.azure.com:443/
set COSMOS_KEY=your-cosmos-key

# Linux/Mac
export COSMOS_ENDPOINT="https://your-account.documents.azure.com:443/"
export COSMOS_KEY="your-cosmos-key"
```

## Run

```bash
npm start
```

Or compile and run:
```bash
npx tsc cosmos-crud.ts
node cosmos-crud.js
```

## Operations Performed

1. **Create CosmosClient** - Initializes connection using endpoint and key
2. **Create Database & Container** - Creates "TestDB" database and "Items" container with partition key "/category"
3. **Create Item** - Inserts an item with id, category, name, and quantity
4. **Read Item** - Retrieves the item using item().read()
5. **Query Items** - Queries items using parameterized query (category = "electronics")
6. **Replace Item** - Updates the item's quantity using item().replace()
7. **Delete Item** - Removes the item using item().delete()

## Status Codes

- **201**: Resource created
- **200**: Success (read/replace)
- **204**: Success (delete)
- **404**: Resource not found
- **409**: Resource already exists

## Error Handling

The program includes comprehensive error handling that checks:
- HTTP status codes from operations
- Error messages and codes
- Verification of successful deletion (404 expected)
