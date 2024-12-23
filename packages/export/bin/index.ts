import "dotenv/config";
import { Client } from "@ofx-playground/core";
import * as fs from "node:fs";

const clientId = process.env.PLUGGY_CLIENT_ID!;
const clientSecret = process.env.PLUGGY_CLIENT_SECRET!;
const itemIds = process.env.PLUGGY_ITEM_IDS?.split(",")!;

const client = new Client({ clientId, clientSecret });

const MONTHS = 3;

await Promise.all(
  itemIds.map(async (itemId) => {
    const now = new Date();

    for (let i = 0; i < MONTHS; i++) {
      const dateStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const dateEnd = new Date(
        dateStart.getFullYear(),
        dateStart.getMonth() + 1,
        0,
      );

      const files = await client.outputOFXFiles(itemId, dateStart, dateEnd);
      for (const file of files) {
        console.log(`Writing file ${file.getSuggestedFileName()}`);
        fs.writeFileSync(file.getSuggestedFileName(), file.output());
      }
    }
  }),
);
