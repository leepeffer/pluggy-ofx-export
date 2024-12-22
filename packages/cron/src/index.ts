import { Client } from "@ofx-playground/core";
import * as actual from "@actual-app/api";

Deno.cron("Fetch transactions", "0 0 * * *", async () => {
  const client = new Client({
    clientId: process.env.PLUGGY_CLIENT_ID!,
    clientSecret: process.env.PLUGGY_CLIENT_SECRET!,
  });

  await actual.init({
    serverURL: process.env.ACTUAL_SERVER_URL!,
    password: process.env.ACTUAL_PASSWORD!,
  });

  const itemIds = process.env.PLUGGY_ITEM_IDS?.split(",")!;
  await Promise.all(
    itemIds.map(async (itemId) => {
      const now = new Date();

      const dateStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const dateEnd = new Date(
        dateStart.getFullYear(),
        dateStart.getMonth() + 1,
        0,
      );

      const files = await client.outputOFXFiles(itemId, dateStart, dateEnd);
      for (const file of files) {
      }
    }),
  );
});
