# Azure Cosmos DB CRUD Operations Example

This TypeScript program demonstrates all CRUD operations on Azure Cosmos DB NoSQL containers.

## Features

1. ✅ Create CosmosClient using endpoint and key
2. ✅ Create database "TestDB" and container "Items" with partition key "/category"
3. ✅ Create an item with id, category, name, quantity properties
4. ✅ Read the item using item().read()
5. ✅ Query items with parameterized query (category = "electronics")
6. ✅ Replace item with updated quantity using item().replace()
7. ✅ Delete item using item().delete()
8. ✅ Comprehensive error handling with status code checks

## Required Package

```bash
npm install @azure/cosmos @azure/identity
```

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set environment variables:**
   ```bash
   # Windows PowerShell
   $env:COSMOS_ENDPOINT="https://<your-account>.documents.azure.com:443/"
   $env:COSMOS_KEY="<your-primary-or-secondary-key>"

   # Linux/macOS
   export COSMOS_ENDPOINT="https://<your-account>.documents.azure.com:443/"
   export COSMOS_KEY="<your-primary-or-secondary-key>"
   ```

## Run

```bash
# Using ts-node
npm start

# Or compile and run
npm run build
node dist/cosmos-crud.js
```

## Expected Output

```
✓ CosmosClient created
✓ Database 'TestDB' created or already exists
✓ Container 'Items' created with partition key '/category'
✓ Item created (Status: 201): { id: 'item-001', category: 'electronics', name: 'Laptop', quantity: 10 }
✓ Item read (Status: 200): { id: 'item-001', category: 'electronics', name: 'Laptop', quantity: 10 }
✓ Query results (found 1 items): [...]
✓ Item replaced with updated quantity (Status: 200): { id: 'item-001', category: 'electronics', name: 'Laptop', quantity: 25 }
✓ Item deleted (Status: 204)
✓ Verified: Item no longer exists
✓ CosmosClient disposed
```

## Error Handling

The program handles common Cosmos DB errors:
- **400**: Bad request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not found
- **409**: Conflict
- **412**: Precondition failed (ETag mismatch)
- **429**: Rate limited (includes retry-after time)
- **500**: Internal server error
- **503**: Service unavailable

## Notes

- Uses key-based authentication (recommended to use Microsoft Entra token credentials in production)
- Container uses partition key `/category` for optimal distribution
- All operations include status code checks
- Parameterized queries prevent injection attacks
- Client is properly disposed in finally block
