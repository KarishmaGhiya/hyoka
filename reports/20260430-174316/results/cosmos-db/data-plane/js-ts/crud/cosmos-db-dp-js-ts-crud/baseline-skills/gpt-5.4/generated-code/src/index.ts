import { randomUUID } from "node:crypto";
import { CosmosClient } from "@azure/cosmos";

interface InventoryItem {
  id: string;
  category: string;
  name: string;
  quantity: number;
}

type CosmosError = Error & {
  statusCode?: number;
  code?: number | string;
  substatus?: number;
};

function getRequiredEnv(name: "COSMOS_ENDPOINT" | "COSMOS_KEY"): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function assertStatus(
  operation: string,
  actualStatusCode: number,
  expectedStatusCodes: readonly number[],
): void {
  if (!expectedStatusCodes.includes(actualStatusCode)) {
    throw new Error(
      `${operation} returned unexpected status code ${actualStatusCode}. Expected one of: ${expectedStatusCodes.join(", ")}`,
    );
  }
}

function logCosmosError(error: unknown): void {
  const cosmosError = error as CosmosError;

  switch (cosmosError.statusCode) {
    case 401:
      console.error("Authentication failed (401). Check COSMOS_ENDPOINT and COSMOS_KEY.");
      return;
    case 403:
      console.error("Access denied (403). The key does not have permission for this operation.");
      return;
    case 404:
      console.error("Requested Cosmos resource was not found (404).");
      return;
    case 409:
      console.error("A resource with the same id already exists (409).");
      return;
    case 429:
      console.error("Request was rate-limited (429). Retry after the server-provided delay.");
      return;
    default:
      if (error instanceof Error) {
        console.error(`Cosmos DB operation failed: ${error.message}`);
        return;
      }

      console.error("Cosmos DB operation failed with an unknown error.");
  }
}

async function main(): Promise<void> {
  const endpoint = getRequiredEnv("COSMOS_ENDPOINT");
  const key = getRequiredEnv("COSMOS_KEY");

  const client = new CosmosClient({ endpoint, key });

  const { database, statusCode: databaseStatusCode } =
    await client.databases.createIfNotExists({ id: "TestDB" });
  assertStatus("Create database", databaseStatusCode, [200, 201]);

  const { container, statusCode: containerStatusCode } =
    await database.containers.createIfNotExists({
      id: "Items",
      partitionKey: "/category",
    });
  assertStatus("Create container", containerStatusCode, [200, 201]);

  const item: InventoryItem = {
    id: randomUUID(),
    category: "electronics",
    name: "Noise-Cancelling Headphones",
    quantity: 5,
  };

  const { resource: createdItem, statusCode: createStatusCode } =
    await container.items.create<InventoryItem>(item);
  assertStatus("Create item", createStatusCode, [201]);

  console.log("Created item:", createdItem);

  const itemRef = container.item(item.id, item.category);

  const { resource: readItem, statusCode: readStatusCode } =
    await itemRef.read<InventoryItem>();
  assertStatus("Read item", readStatusCode, [200]);

  if (!readItem) {
    throw new Error("Read item returned no resource.");
  }

  console.log("Read item:", readItem);

  const querySpec = {
    query: "SELECT * FROM c WHERE c.category = @category",
    parameters: [{ name: "@category", value: "electronics" }],
  };

  const { resources: queriedItems } = await container.items
    .query<InventoryItem>(querySpec, { partitionKey: "electronics" })
    .fetchAll();

  console.log('Query results for category "electronics":', queriedItems);

  const updatedItem: InventoryItem = {
    ...readItem,
    quantity: readItem.quantity + 10,
  };

  const { resource: replacedItem, statusCode: replaceStatusCode } =
    await itemRef.replace<InventoryItem>(updatedItem);
  assertStatus("Replace item", replaceStatusCode, [200]);

  console.log("Replaced item:", replacedItem);

  const { statusCode: deleteStatusCode } = await itemRef.delete();
  assertStatus("Delete item", deleteStatusCode, [204]);

  console.log("Deleted item successfully.");
}

main().catch((error: unknown) => {
  logCosmosError(error);
  process.exitCode = 1;
});
