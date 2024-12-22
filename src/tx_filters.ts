import { Transaction } from "pluggy-sdk";

export type TxFilter = (tx: Transaction) => Transaction | undefined;

export function getFilterForBank(fid: number): TxFilter | undefined {
  switch (fid) {
    case 1:
      return bbFilter;
    case 208:
      return btgFilter;
    default:
      return undefined;
  }
}

function bbFilter(tx: Transaction): Transaction | undefined {
  if (tx.description.match(/^(PGTO DEBITO CONTA|REND\.FACIL|RENDE FACIL)/g)) {
    return undefined;
  }
  return tx;
}

function btgFilter(tx: Transaction): Transaction | undefined {
  if (tx.paymentData?.paymentMethod === "PIX") {
    if (tx.type === "CREDIT" && tx.paymentData.payer?.name) {
      tx.description = `Pix de ${tx.paymentData.payer.name}`;
    } else if (tx.type === "DEBIT" && tx.paymentData.receiver?.name) {
      tx.description = `Pix para ${tx.paymentData.receiver.name}`;
    }
  }
  return tx;
}
