import { CosmosClient, type Container, type Database } from "@azure/cosmos";

type InventoryItem = {
  id: string;
  category: string;
  name: string;
  quantity: number;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function expectStatus(
  operation: string,
  statusCode: number | undefined,
  expected: number[],
): void {
  if (statusCode === undefined || !expected.includes(statusCode)) {
    throw new Error(
      `${operation} failed. Expected status ${expected.join(" or ")}, received ${statusCode ?? "unknown"}.`,
    );
  }
}

async function ensureResources(client: CosmosClient): Promise<{
  database: Database;
  container: Container;
}> {
  const databaseResponse = await client.databases.createIfNotExists({
    id: "TestDB",
  });
  expectStatus("Create database", databaseResponse.statusCode, [200, 201]);

  const containerResponse = await databaseResponse.database.containers.createIfNotExists({
    id: "Items",
    partitionKey: {
      paths: ["/category"],
    },
  });
  expectStatus("Create container", containerResponse.statusCode, [200, 201]);

  return {
    database: databaseResponse.database,
    container: containerResponse.container,
  };
}

async function run(): Promise<void> {
  const endpoint = getRequiredEnv("COSMOS_ENDPOINT");
  const key = getRequiredEnv("COSMOS_KEY");

  const client = new CosmosClient({ endpoint, key });
  const { database, container } = await ensureResources(client);

  console.log(`Using database "${database.id}" and container "${container.id}".`);

  const item: InventoryItem = {
    id: `item-${Date.now()}`,
    category: "electronics",
    name: "Wireless Mouse",
    quantity: 10,
  };

  const createResponse = await container.items.create(item);
  expectStatus("Create item", createResponse.statusCode, [201]);
  console.log("Created item:", createResponse.resource);

  const itemRef = container.item(item.id, item.category);

  const readResponse = await itemRef.read<InventoryItem>();
  expectStatus("Read item", readResponse.statusCode, [200]);
  console.log("Read item:", readResponse.resource);

  const querySpec = {
    query: "SELECT * FROM c WHERE c.category = @category",
    parameters: [
      {
        name: "@category",
        value: "electronics",
      },
    ],
  };

  const queryResponse = await container.items
    .query<InventoryItem>(querySpec)
    .fetchAll();
  console.log("Queried items:", queryResponse.resources);

  if (!readResponse.resource) {
    throw new Error("Read item response did not include a resource.");
  }

  const updatedItem: InventoryItem = {
    ...readResponse.resource,
    quantity: readResponse.resource.quantity + 5,
  };

  const replaceResponse = await itemRef.replace<InventoryItem>(updatedItem);
  expectStatus("Replace item", replaceResponse.statusCode, [200]);
  console.log("Updated item:", replaceResponse.resource);

  const deleteResponse = await itemRef.delete();
  expectStatus("Delete item", deleteResponse.statusCode, [204]);
  console.log(`Deleted item "${item.id}".`);
}

run().catch((error: unknown) => {
  const statusCode =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "number"
      ? (error as { code: number }).code
      : typeof error === "object" &&
          error !== null &&
          "statusCode" in error &&
          typeof (error as { statusCode?: unknown }).statusCode === "number"
        ? (error as { statusCode: number }).statusCode
        : undefined;

  if (statusCode === 401 || statusCode === 403) {
    console.error("Authentication or authorization failed. Check COSMOS_ENDPOINT and COSMOS_KEY.");
  } else if (statusCode === 404) {
    console.error("A Cosmos DB resource was not found.");
  } else if (statusCode === 409) {
    console.error("A conflicting Cosmos DB resource already exists.");
  } else {
    console.error("Cosmos DB CRUD sample failed.");
  }

  console.error(error);
  process.exitCode = 1;
});
