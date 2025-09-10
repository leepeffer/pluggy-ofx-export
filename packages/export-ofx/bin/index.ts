import "dotenv/config";
import { Client } from "@pluggy-ofx-export/core";
import * as fs from "node:fs";
import * as path from "node:path";

const clientId = process.env.PLUGGY_CLIENT_ID!;
const clientSecret = process.env.PLUGGY_CLIENT_SECRET!;
const itemIds = process.env.PLUGGY_ITEM_IDS?.split(",")!;

const client = new Client({ clientId, clientSecret });

const MONTHS = 3;

// Create exports directory with today's date
const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
const exportDir = path.join('exports', today);
fs.mkdirSync(exportDir, { recursive: true });

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
        const filePath = path.join(exportDir, file.getSuggestedFileName());
        console.log(`Writing file ${filePath}`);
        fs.writeFileSync(filePath, file.output());
      }
    }
  }),
);
