import { Account, PluggyClient } from "pluggy-sdk";
import {
  OFXBankAccountInfo,
  OFXBankFile,
  OFXCCFile,
  type OFXFile,
  OFXTransaction,
} from "./ofx";
import { getFilterForBank } from "./tx_filters";

const client = new PluggyClient({
  clientId: Bun.env.PLUGGY_CLIENT_ID!,
  clientSecret: Bun.env.PLUGGY_CLIENT_SECRET!,
});

const PAGE_SIZE = 300;

const itemIds = Bun.env.PLUGGY_ITEM_IDS!.split(",");

function findBankInfo(accounts: Account[]): OFXBankAccountInfo | undefined {
  const bankAcc = accounts.find((acc) => acc.type === "BANK");
  if (!bankAcc) return undefined;

  const transferNumber = bankAcc.bankData?.transferNumber?.split("/");
  if (!transferNumber) {
    return undefined;
  }
  const fid = transferNumber[0];
  const branch = transferNumber[1].replace("-", "");
  const accountNumber = transferNumber[2].replace("-", "");
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
            {
              brand: acc.creditData!.brand ?? "Unknown",
              level: acc.creditData!.level ?? "Unknown",
              number: acc.number,
            },
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

      const txFilter = getFilterForBank(bankInfo.fid);

      for (let tx of txs.results) {
        console.log(tx);
        if (txFilter) {
          const newTx = txFilter(tx);
          if (newTx) {
            tx = newTx;
          } else {
            continue;
          }
        }

        const ofxTx = new OFXTransaction(
          tx.id,
          tx.type,
          tx.amount,
          tx.description,
          tx.date,
        );
        ofxFile.addTx(ofxTx);
      }

      return ofxFile;
    }),
  );
}

if (import.meta.main) {
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

        const files = await outputOFXFiles(itemId, dateStart, dateEnd);
        for (const file of files) {
          console.log(file.getSuggestedFileName());
          Bun.write(file.getSuggestedFileName(), file.output());
        }
      }
    }),
  );
}
