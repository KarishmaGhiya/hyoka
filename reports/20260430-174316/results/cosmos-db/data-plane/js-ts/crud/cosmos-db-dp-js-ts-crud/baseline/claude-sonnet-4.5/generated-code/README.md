# Azure Cosmos DB CRUD Operations - TypeScript Example

This TypeScript program demonstrates all CRUD operations on Azure Cosmos DB NoSQL container.

## Required Package

```bash
npm install @azure/cosmos
```

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

## Run

```bash
npm start
```

Or with TypeScript compiler:
```bash
npx tsc
node dist/cosmosdb-crud.js
```

## Operations Performed

1. **CREATE** - Creates CosmosClient, database "TestDB", and container "Items"
2. **CREATE** - Inserts an item with id, category, name, and quantity
3. **READ** - Reads the item using item().read()
4. **QUERY** - Queries items by category using parameterized query
5. **UPDATE** - Updates item quantity using item().replace()
6. **DELETE** - Deletes the item using item().delete()

## Error Handling

- Status code 201: Item created successfully
- Status code 200: Item read/replaced successfully
- Status code 204: Item deleted successfully
- Status code 404: Item not found
- All errors are caught and displayed with details
