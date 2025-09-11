import { Account, PluggyClient } from "pluggy-sdk";
import {
  OFXBankAccountInfo,
  OFXBankFile,
  OFXCCFile,
  OFXInvestmentFile,
  type OFXFile,
  OFXTransaction,
} from "./ofx.js";
import { getFilterForBank } from "./tx_filters.js";

const PAGE_SIZE = 300;

export interface Credentials {
  clientId: string;
  clientSecret: string;
}

export class Client {
  private client: PluggyClient;

  constructor(credentials: Credentials) {
    this.client = new PluggyClient(credentials);
  }

  private findBankInfo(accounts: Account[]): OFXBankAccountInfo | undefined {
    // First try to find a BANK account with transferNumber
    const bankAcc = accounts.find((acc) => acc.type === "BANK");
    if (bankAcc) {
      const transferNumber = bankAcc.bankData?.transferNumber?.split("/");
      if (transferNumber) {
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
    }

    // If no BANK account with transferNumber, try to use any available account
    // This handles credit card only items and investment only items
    const anyAcc = accounts.find((acc) => acc.type === "BANK" || acc.type === "CREDIT" || acc.type === "INVESTMENT");
    if (anyAcc) {
      // For credit card only items, create a generic bank info
      // Use a default FID and derive other info from the account
      const orgName = anyAcc.name;
      const fid = 9999; // Default FID for credit card only items
      const branch = "0001"; // Default branch
      const accountNumber = anyAcc.number || anyAcc.id.slice(-8); // Use account number or last 8 chars of ID
      
      return {
        orgName,
        fid,
        accountNumber,
        branch,
      };
    }

    return undefined;
  }

  async outputOFXFiles(
    itemId: string,
    dateStart: Date,
    dateEnd: Date,
  ): Promise<OFXFile[]> {
    const accounts = await this.client.fetchAccounts(itemId);
    if (accounts.results.length === 0) {
      console.log(`No accounts found for itemId: ${itemId}`);
      return [];
    }

    const bankInfo = this.findBankInfo(accounts.results);

    if (!bankInfo) {
      throw new Error(
        `Bank info not found for the accounts of itemId ${itemId}: ${accounts.results}`,
      );
    }

    return await Promise.all(
      accounts.results.map(async (acc) => {
        let ofxFile;
        // Determine account type based on name and type
        let accountType: "CHECKING" | "$AVING$" | "MONEYMRKT" = "CHECKING";
        if (acc.name.toLowerCase().includes("poupança") || acc.name.toLowerCase().includes("savings")) {
          accountType = "$AVING$";
        } else if (acc.name.toLowerCase().includes("fundo") || acc.name.toLowerCase().includes("fund") || 
                   acc.name.toLowerCase().includes("investimento") || acc.name.toLowerCase().includes("investment")) {
          accountType = "MONEYMRKT";
        }

        switch (acc.type) {
          case "BANK":
            ofxFile = new OFXBankFile(
              accountType,
              bankInfo,
              acc.currencyCode,
              dateStart,
              dateEnd,
              acc.name,
              acc.number,
            );
            break;
          case "CREDIT":
            ofxFile = new OFXCCFile(
              acc.id,
              {
                brand: acc.creditData!.brand ?? "Unknown",
                level: acc.creditData!.level ?? "Unknown",
                number: acc.number,
              },
              bankInfo,
              acc.currencyCode,
              dateStart,
              dateEnd,
              acc.name,
            );
            break;
          case "INVESTMENT":
            ofxFile = new OFXInvestmentFile(
              bankInfo,
              acc.currencyCode,
              dateStart,
              dateEnd,
              acc.name,
              acc.number,
            );
            break;
          default:
            throw new Error(`Account type ${acc.type} not supported`);
        }

        const txs = await this.fetchTransactions(acc.id, {
          from: dateStart.toISOString(),
          to: dateEnd.toISOString(),
        });
        if (txs.totalPages != 1) {
          throw new Error(
            `Pagination not supported, total pages: ${txs.totalPages}, total: ${txs.total}`,
          );
        }

        const txFilter = getFilterForBank(bankInfo.fid);

        for (let tx of txs.results) {
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

        if (dateEnd.toDateString() === new Date().toDateString()) {
          ofxFile.setBalance(
            acc.type === "CREDIT" ? -acc.balance : acc.balance,
            dateEnd,
          );
        }

        return ofxFile;
      }),
    );
  }

  async fetchTransactions(accountId: string, options: { from: string, to: string }) {
    return this.client.fetchTransactions(accountId, options);
  }

  async fetchAccounts(itemId: string) {
    return this.client.fetchAccounts(itemId);
  }
}

export * from './logger';
export * from './models';
export * from './ynab-client';
export * from './sync';