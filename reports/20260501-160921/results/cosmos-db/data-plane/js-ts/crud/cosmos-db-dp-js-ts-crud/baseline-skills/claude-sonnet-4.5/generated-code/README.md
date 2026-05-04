# Azure Cosmos DB CRUD Operations - TypeScript Example

This TypeScript program demonstrates all CRUD operations with Azure Cosmos DB NoSQL API.

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
# Using ts-node (development)
npm run dev

# Or compile and run
npm run build
npm start
```

## Operations Demonstrated

1. **Create CosmosClient** - Initialize client with endpoint and key
2. **Create Database & Container** - Create "TestDB" database and "Items" container with partition key "/category"
3. **Create Item** - Insert an item with id, category, name, and quantity
4. **Read Item** - Retrieve item using `item().read()`
5. **Query Items** - Parameterized query for items where category = "electronics"
6. **Update Item** - Replace item with updated quantity using `item().replace()`
7. **Delete Item** - Remove item using `item().delete()`

## Expected Status Codes

- **201**: Item created successfully
- **200**: Read/Replace successful
- **204**: Delete successful
- **404**: Item not found (expected after deletion)

## Error Handling

The program includes comprehensive error handling with status code checks after each operation to ensure reliability.
