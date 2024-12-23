import { Client } from "@pluggy-actual-export/core";
import * as actual from "@actual-app/api";
import { APIAccountEntity } from "@actual-app/api/@types/loot-core/server/api-models";
import { OFXBankFile, OFXCCFile, OFXFile } from "@pluggy-actual-export/core/src/ofx";
import * as fs from "node:fs";

export function rankBestAccounts(file: OFXFile, actualAccounts: APIAccountEntity[]): [string, number][] {
  if (actualAccounts.length === 0) {
    return [];
  }

  const scores = new Map<string, number>();
  for (const acc of actualAccounts) {
    scores.set(acc.id, 0);
  }

  for (const acc of actualAccounts) {
    const lowercaseName = acc.name.toLowerCase();

    const orgNameWords = file.getBankAccountInfo().orgName.toLowerCase().split(" ");
    for (const word of orgNameWords) {
      if (lowercaseName.includes(word)) {
        scores.set(acc.id, scores.get(acc.id)! + 1);
      }
    }

    if (lowercaseName.includes(file.getBankAccountInfo().fid.toString().padStart(4, "0"))) {
      scores.set(acc.id, scores.get(acc.id)! + 4);
    } else if (lowercaseName.includes(file.getBankAccountInfo().fid.toString().padStart(3, "0"))){
      scores.set(acc.id, scores.get(acc.id)! + 3);
    } else if (lowercaseName.includes(file.getBankAccountInfo().fid.toString())){
      scores.set(acc.id, scores.get(acc.id)! + 1);
    }

    const checkingRegex = /\b(checking)\b/g;
    const ccRegex = /\b(cc|credit|card)\b/g;
    if (file instanceof OFXBankFile) {
      if (lowercaseName.match(checkingRegex)) {
        scores.set(acc.id, scores.get(acc.id)! + 3);
      }
      if (lowercaseName.match(ccRegex)) {
        scores.set(acc.id, scores.get(acc.id)! - 10);
      }
    }
    if (file instanceof OFXCCFile) {
      if (lowercaseName.match(ccRegex)) {
        scores.set(acc.id, scores.get(acc.id)! + 3);
      }
      if (lowercaseName.match(checkingRegex)) {
        scores.set(acc.id, scores.get(acc.id)! - 10);
      }
      if (lowercaseName.includes(file.getCardInfo().brand)) {
        scores.set(acc.id, scores.get(acc.id)! + 2);
      }
      if (lowercaseName.includes(file.getCardInfo().level)) {
        scores.set(acc.id, scores.get(acc.id)! + 2);
      }
      if (lowercaseName.includes(file.getCardInfo().number)) {
        scores.set(acc.id, scores.get(acc.id)! + 4);
      }
    }
  }

  const sortedEntries = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  return sortedEntries;
}

export function findBestMatchingActualAccount(file: OFXFile, actualAccounts: APIAccountEntity[]): string | undefined {
  const sortedEntries = rankBestAccounts(file, actualAccounts);
  if (sortedEntries.length > 1) {
    if (sortedEntries[0][1] === sortedEntries[1][1]) {
      return undefined;
    }
  }
  return sortedEntries[0]?.[0];
}

export async function updateActualBudget() {
  if (!process.env.PLUGGY_CLIENT_ID) {
    throw new Error(`Missing environment variable PLUGGY_CLIENT_ID`);
  }
  if (!process.env.ACTUAL_BUDGET_URL) {
    throw new Error(`Missing environment variable ACTUAL_BUDGET_URL`);
  }
  if (!process.env.ACTUAL_BUDGET_SYNC_ID) {
    throw new Error(`Missing environment variable ACTUAL_BUDGET_SYNC_ID`);
  }

  const dataDir = "/tmp/pluggy-actual-export-actual";
  fs.mkdirSync(dataDir, { recursive: true });

  await actual.init({
    serverURL: process.env.ACTUAL_BUDGET_URL!,
    password: process.env.ACTUAL_BUDGET_PASSWORD!,
    dataDir: dataDir,
  });

  try {
    const client = new Client({
      clientId: process.env.PLUGGY_CLIENT_ID!,
      clientSecret: process.env.PLUGGY_CLIENT_SECRET!,
    });

    const itemIds = process.env.PLUGGY_ITEM_IDS?.split(",")!;

    await actual.downloadBudget(process.env.ACTUAL_BUDGET_SYNC_ID!);

    await Promise.all(
      itemIds.map(async (itemId) => {
        const now = new Date();

        const dateStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const dateEnd = new Date(dateStart.getFullYear(), dateStart.getMonth() + 1, 0);

        const actualAccounts = await actual.getAccounts();

        const files = await client.outputOFXFiles(itemId, dateStart, dateEnd);
        for (const file of files) {
          const actualAccountID = findBestMatchingActualAccount(file, actualAccounts);
          if (!actualAccountID) {
            console.error(`Could not find account for file ${file.getSuggestedFileName()}`);
            continue;
          }

          const actualAccount = actualAccounts.find(acc => acc.id === actualAccountID)!;
          console.log(`Found matching account for ${file.getSuggestedFileName()}: ${actualAccount}`)

          await actual.importTransactions(actualAccountID, file.getTransactions().map(tx => ({
            account: actualAccountID,
            date: tx.date,
            imported_id: tx.id,
            payee_name: tx.memo,
            imported_payee: tx.memo,
            amount: Math.trunc(tx.amount * 100),
          })));
        }
      }),
    );
  } catch(err) {
    console.error(err);
  }

  await actual.shutdown();
}
