import { Account, PluggyClient } from "pluggy-sdk";
import {
  OFXBankAccountInfo,
  OFXBankFile,
  OFXCCFile,
  type OFXFile,
  OFXTransaction,
} from "./ofx";

const client = new PluggyClient({
  clientId: Bun.env.PLUGGY_CLIENT_ID!,
  clientSecret: Bun.env.PLUGGY_CLIENT_SECRET!,
});

const PAGE_SIZE = 200;

const itemIds = Bun.env.PLUGGY_ITEM_IDS!.split(",");

function findBankInfo(accounts: Account[]): OFXBankAccountInfo | undefined {
  const bankAcc = accounts.find((acc) => acc.type === "BANK");
  if (!bankAcc) return undefined;

  const transferNumber = bankAcc.bankData?.transferNumber?.split("/");
  if (!transferNumber) {
    return undefined;
  }
  const fid = transferNumber[0];
  const branch = transferNumber[1];
  const accountNumber = transferNumber[2];
  return {
    orgName: bankAcc.name,
    fid: parseInt(fid),
    accountNumber,
    branch,
  };
}

async function outputOFXFiles(
  itemId: string,
  dateStart: Date,
  dateEnd: Date,
): Promise<OFXFile[]> {
  const accounts = await client.fetchAccounts(itemId);

  const bankInfo = findBankInfo(accounts.results);

  if (!bankInfo) {
    throw new Error("Bank info not found");
  }

  return await Promise.all(
    accounts.results.map(async (acc) => {
      console.log(acc);

      let ofxFile;
      switch (acc.type) {
        case "BANK":
          ofxFile = new OFXBankFile(
            bankInfo,
            "CHECKING",
            acc.currencyCode,
            dateStart,
            dateEnd,
          );
          break;
        case "CREDIT":
          ofxFile = new OFXCCFile(
            bankInfo,
            acc.id,
            acc.currencyCode,
            dateStart,
            dateEnd,
          );
          break;
        default:
          throw new Error("Account type not supported");
      }

      const txs = await client.fetchTransactions(acc.id, {
        from: dateStart.toISOString(),
        to: dateEnd.toISOString(),
        pageSize: PAGE_SIZE,
      });
      if (txs.totalPages != 1) {
        throw new Error(
          `Pagination not supported, total pages: ${txs.totalPages}, total: ${txs.total}`,
        );
      }
      for (const tx of txs.results) {
        ofxFile.addTx(
          new OFXTransaction(
            tx.id,
            tx.type,
            tx.amount,
            tx.description,
            tx.date,
          ),
        );
        console.log(tx);
      }

      return ofxFile;
    }),
  );
}

if (import.meta.main) {
  const dateStart = new Date("2024-01-01");
  const dateEnd = new Date("2024-01-31");
  await outputOFXFiles(itemIds[2], dateStart, dateEnd);
}
