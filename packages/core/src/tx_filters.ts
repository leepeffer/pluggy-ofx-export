import { Transaction } from "pluggy-sdk";

export type TxFilter = (tx: Transaction) => Transaction | undefined;

export function getFilterForBank(fid: number): TxFilter {
  switch (fid) {
    case 1:
      return bbFilter(pixFilter(identityFilter));
    case 260:
      return pixFilter(identityFilter);
    case 208:
      return pixFilter(identityFilter);
    default:
      return identityFilter;
  }
}

function bbFilter(next: TxFilter): TxFilter {
  return (tx) => {
    if (tx.description.match(/^(PGTO DEBITO CONTA|REND\.FACIL|RENDE FACIL)/g)) {
      return undefined;
    }
    return next(tx);
  }
}

function pixFilter(next: TxFilter): TxFilter {
  return (tx) => {
    const newTx = { ...tx };

    if (tx.paymentData) {
      const isTransfer = tx.paymentData.paymentMethod === "PIX" || tx.paymentData.paymentMethod === "TEF";
      const transferType = tx.paymentData.paymentMethod;

      if (isTransfer) {
        if (tx.type === "CREDIT" && tx.paymentData.payer) {
          const hasAccountInfo = tx.paymentData.payer.routingNumber && tx.paymentData.payer.accountNumber && tx.paymentData.payer.branchNumber;

          if ((tx.paymentData.payer.name || tx.paymentData.payer.documentNumber?.value) && hasAccountInfo) {
            newTx.description = `${transferType} de ${tx.paymentData.payer.name ?? tx.paymentData.payer.documentNumber?.value}`;
            if (hasAccountInfo) {
              newTx.description += ` (${tx.paymentData.payer.routingNumber}/${tx.paymentData.payer.branchNumber}/${tx.paymentData.payer.accountNumber})`;
            }
          }
        } else if (tx.type === "DEBIT" && tx.paymentData.receiver) {
          const hasAccountInfo = tx.paymentData.receiver.routingNumber && tx.paymentData.receiver.accountNumber && tx.paymentData.receiver.branchNumber;

          if ((tx.paymentData.receiver.name || tx.paymentData.receiver.documentNumber?.value) && hasAccountInfo) {
            newTx.description = `${transferType} para ${tx.paymentData.receiver.name ?? tx.paymentData.receiver.documentNumber?.value}`;
            if (hasAccountInfo) {
              newTx.description += ` (${tx.paymentData.receiver.routingNumber}/${tx.paymentData.receiver.branchNumber}/${tx.paymentData.receiver.accountNumber})`;
            }
          }
        }
      } else {
        if (tx.paymentData?.receiver?.routingNumber) {
          console.log(tx);
        }
      }
    }

    return next(newTx);
  };
}

function identityFilter(tx: Transaction): Transaction { return tx; }
