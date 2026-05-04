# Azure Cosmos DB CRUD Operations Demo

This TypeScript program demonstrates all CRUD operations on Azure Cosmos DB NoSQL API.

## Features

✓ Create CosmosClient with endpoint and key  
✓ Create database "TestDB" and container "Items" with partition key "/category"  
✓ Create item with id, category, name, quantity  
✓ Read item using item().read()  
✓ Query items using parameterized queries  
✓ Update item using item().replace()  
✓ Delete item using item().delete()  
✓ Proper error handling with status code checks  

## Required Package

```json
{
  "dependencies": {
    "@azure/cosmos": "^4.0.0"
  }
}
```

## Installation

```bash
npm install
```

## Configuration

Set your Azure Cosmos DB credentials as environment variables:

```bash
# Windows (PowerShell)
$env:COSMOS_ENDPOINT="https://your-account.documents.azure.com:443/"
$env:COSMOS_KEY="your-cosmos-db-key"

# Windows (CMD)
set COSMOS_ENDPOINT=https://your-account.documents.azure.com:443/
set COSMOS_KEY=your-cosmos-db-key

# Linux/macOS
export COSMOS_ENDPOINT="https://your-account.documents.azure.com:443/"
export COSMOS_KEY="your-cosmos-db-key"
```

Or modify the default values directly in `cosmos-crud.ts`.

## Running the Program

```bash
# Run with ts-node (development)
npm run dev

# Or compile and run
npm run build
npm start
```

## Expected Output

```
1. Creating CosmosClient...

2. Creating database and container...
   Database 'TestDB' ready
   Container 'Items' ready with partition key '/category'

3. Creating item...
   ✓ Item created successfully (Status: 201)

4. Reading item by id and partition key...
   ✓ Item read successfully (Status: 200)

5. Querying items with category='electronics'...
   ✓ Found 1 item(s)

6. Updating item quantity...
   ✓ Item updated successfully (Status: 200)
   Updated quantity: 15 → 25

7. Deleting item...
   ✓ Item deleted successfully (Status: 204)

8. Verifying deletion...
   ✓ Confirmed: Item no longer exists

✓ All CRUD operations completed successfully!
```

## Status Codes

- **201**: Created
- **200**: OK (read/replace successful)
- **204**: No Content (delete successful)
- **404**: Not Found
