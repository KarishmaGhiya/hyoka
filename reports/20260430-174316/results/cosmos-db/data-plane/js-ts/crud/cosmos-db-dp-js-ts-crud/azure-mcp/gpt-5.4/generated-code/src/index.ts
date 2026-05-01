import { CosmosClient, type ErrorResponse, type SqlQuerySpec } from "@azure/cosmos";

type ItemDocument = {
  id: string;
  category: string;
  name: string;
  quantity: number;
};

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;

const databaseId = "TestDB";
const containerId = "Items";
const partitionKey = "/category";

function requireSetting(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function assertStatus(statusCode: number | undefined, allowed: readonly number[], operation: string): void {
  if (statusCode === undefined || !allowed.includes(statusCode)) {
    throw new Error(
      `${operation} returned unexpected status code ${statusCode ?? "unknown"}. Expected one of: ${allowed.join(", ")}.`,
    );
  }
}

function isCosmosError(error: unknown): error is ErrorResponse {
  return typeof error === "object" && error !== null && "code" in error;
}

function describeCosmosError(error: ErrorResponse): string {
  switch (error.code) {
    case 401:
      return "Authentication failed. Check COSMOS_ENDPOINT and COSMOS_KEY.";
    case 403:
      return "Access was denied by Cosmos DB.";
    case 404:
      return "The requested Cosmos DB resource was not found.";
    case 409:
      return "A resource with the same id already exists.";
    case 429:
      return "The request was rate-limited by Cosmos DB. Retry after the suggested delay.";
    default:
      return error.message;
  }
}

async function main(): Promise<void> {
  const client = new CosmosClient({
    endpoint: requireSetting(endpoint, "COSMOS_ENDPOINT"),
    key: requireSetting(key, "COSMOS_KEY"),
  });

  const { database, statusCode: databaseStatusCode } = await client.databases.createIfNotExists({
    id: databaseId,
  });
  assertStatus(databaseStatusCode, [200, 201], "Create database");

  const { container, statusCode: containerStatusCode } = await database.containers.createIfNotExists({
    id: containerId,
    partitionKey,
  });
  assertStatus(containerStatusCode, [200, 201], "Create container");

  const item: ItemDocument = {
    id: "item-1",
    category: "electronics",
    name: "Wireless Mouse",
    quantity: 10,
  };

  const { resource: createdItem, statusCode: createStatusCode } = await container.items.create<ItemDocument>(item);
  assertStatus(createStatusCode, [201], "Create item");
  console.log("Created item:", createdItem);

  const itemRef = container.item(item.id, item.category);

  const { resource: readItem, statusCode: readStatusCode } = await itemRef.read<ItemDocument>();
  assertStatus(readStatusCode, [200], "Read item");
  console.log("Read item:", readItem);

  const querySpec: SqlQuerySpec = {
    query: "SELECT * FROM c WHERE c.category = @category",
    parameters: [{ name: "@category", value: "electronics" }],
  };

  const { resources: queriedItems, statusCode: queryStatusCode } = await container.items
    .query<ItemDocument>(querySpec)
    .fetchAll();
  assertStatus(queryStatusCode, [200], "Query items");
  console.log('Queried items in category "electronics":', queriedItems);

  const replacement: ItemDocument = {
    ...(readItem ?? item),
    quantity: 15,
  };

  const { resource: replacedItem, statusCode: replaceStatusCode } = await itemRef.replace<ItemDocument>(replacement);
  assertStatus(replaceStatusCode, [200], "Replace item");
  console.log("Replaced item:", replacedItem);

  const { statusCode: deleteStatusCode } = await itemRef.delete();
  assertStatus(deleteStatusCode, [204], "Delete item");
  console.log("Deleted item successfully.");
}

main().catch((error: unknown) => {
  if (isCosmosError(error)) {
    console.error(`Cosmos DB error (${error.code}): ${describeCosmosError(error)}`);
    process.exitCode = 1;
    return;
  }

  if (error instanceof Error) {
    console.error(`Unexpected error: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  console.error("Unexpected non-error exception thrown.");
  process.exitCode = 1;
});
