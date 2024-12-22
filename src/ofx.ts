type BankAccountType = "CHECKING" | "$AVING$" | "MONEYMRKT";
type TransactionType = "DEBIT" | "CREDIT";

export function formatOFXDate(date: Date): string {
  return date
    .toISOString()
    .replace(/\.\d\d\d/, "")
    .replace(/[-:.]/g, "")
    .replace("T", "")
    .replace("Z", "[0:GMT]");
}

export function formatFileNameDate(date: Date): string {
  return date.toISOString().split("T")[0].replace(/-/g, "");
}

export class OFXTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  memo: string;
  date: Date;

  constructor(
    id: string,
    type: TransactionType,
    amount: number,
    memo: string,
    date: Date,
  ) {
    this.id = id;
    this.type = type;
    this.amount = amount;
    this.memo = memo;
    this.date = date;
  }

  output(): string {
    return `
    <STMTTRN>
      <TRNTYPE>${this.type}</TRNTYPE>
      <DTPOSTED>${formatOFXDate(this.date)}</DTPOSTED>
      <TRNAMT>${this.amount}</TRNAMT>
      <FITID>${this.id}</FITID>
      <MEMO>${this.memo}</MEMO>
    </STMTTRN>
    `;
  }
}

export class OFXLedgerBalance {
  balance: number;
  date: Date;

  constructor(balance: number, date: Date) {
    this.balance = balance;
    this.date = date;
  }

  output(): string {
    return `
    <LEDGERBAL>
      <BALAMT>${this.balance}</BALAMT>
      <DTASOF>${formatOFXDate(this.date)}</DTASOF>
    </LEDGERBAL>
    `;
  }
}

export interface OFXBankAccountInfo {
  orgName: string;
  fid: number;
  accountNumber: string;
  branch: string;
}

export interface OFXCardInfo {
  brand: string;
  level: string;
  number: string;
}

function outputOFXBase(
  accountInfo: OFXBankAccountInfo,
  date: Date,
  language: string,
  msg: string,
): string {
  return `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:UTF-8
CHARSET:NONE
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE
<OFX>
  <SIGNONMSGSRSV1>
    <SONRS>
      <STATUS>
        <CODE>0</CODE>
        <SEVERITY>INFO</SEVERITY>
      </STATUS>
      <DTSERVER>${formatOFXDate(date)}</DTSERVER>
      <LANGUAGE>${language}</LANGUAGE>
      <FI>
        <ORG>${accountInfo.orgName}</ORG>
        <FID>${accountInfo.fid}</FID>
      </FI>
    </SONRS>
  </SIGNONMSGSRSV1>
  ${msg}
</OFX>`;
}

export interface OFXFile {
  getSuggestedFileName(): string;
  output(): string;
  addTx(tx: OFXTransaction): void;
}

export class OFXBankFile {
  private accountInfo: OFXBankAccountInfo;
  private accountType: BankAccountType;
  private currency: string;
  private transactions: OFXTransaction[] = [];
  private dateServer: Date = new Date();
  private dateStart: Date;
  private dateEnd: Date;
  private language: string = "POR";
  private balance: OFXLedgerBalance = new OFXLedgerBalance(0, new Date());

  constructor(
    accountInfo: OFXBankAccountInfo,
    accountType: BankAccountType,
    currency: string,
    dateStart: Date,
    dateEnd: Date,
  ) {
    this.accountInfo = accountInfo;
    this.currency = currency;
    this.accountType = accountType;
    this.dateStart = dateStart;
    this.dateEnd = dateEnd;
  }

  getSuggestedFileName(): string {
    return `statement-${this.accountInfo.fid}-${this.accountInfo.accountNumber}-${formatFileNameDate(this.dateStart)}-${formatFileNameDate(this.dateEnd)}.ofx`;
  }

  addTx(tx: OFXTransaction) {
    this.transactions.push(tx);
  }

  outputBankMsg(): string {
    return `
    <BANKMSGSRSV1>
      <STMTTRNRS>
        <TRNUID>1</TRNUID>
        <STATUS>
          <CODE>0</CODE>
          <SEVERITY>INFO</SEVERITY>
        </STATUS>
        <STMTRS>
          <CURDEF>${this.currency}</CURDEF>
          <BANKACCTFROM>
            <BANKID>${this.accountInfo.fid}</BANKID>
            <BRANCHID>${this.accountInfo.branch}</BRANCHID>
            <ACCTID>${this.accountInfo.accountNumber}</ACCTID>
            <ACCTTYPE>${this.accountType}</ACCTTYPE>
          </BANKACCTFROM>
          <BANKTRANLIST>
            <DTSTART>${formatOFXDate(this.dateStart)}</DTSTART>
            <DTEND>${formatOFXDate(this.dateEnd)}</DTEND>
            ${this.transactions.map((tx) => tx.output()).join("\n")}
          </BANKTRANLIST>
          ${this.balance.output()}
        </STMTRS>
      </STMTTRNRS>
    </BANKMSGSRSV1>
    `;
  }

  output(): string {
    return outputOFXBase(
      this.accountInfo,
      this.dateServer,
      this.language,
      this.outputBankMsg(),
    );
  }
}

export class OFXCCFile implements OFXFile {
  private accountInfo: OFXBankAccountInfo;
  private cardInfo: OFXCardInfo;
  private id: string;
  private currency: string;
  private transactions: OFXTransaction[] = [];
  private dateServer: Date = new Date();
  private dateStart: Date;
  private dateEnd: Date;
  private language: string = "POR";
  private balance: OFXLedgerBalance = new OFXLedgerBalance(0, new Date());

  constructor(
    accountInfo: OFXBankAccountInfo,
    cardInfo: OFXCardInfo,
    id: string,
    currency: string,
    dateStart: Date,
    dateEnd: Date,
  ) {
    this.accountInfo = accountInfo;
    this.id = id;
    this.cardInfo = cardInfo;
    this.currency = currency;
    this.dateStart = dateStart;
    this.dateEnd = dateEnd;
  }

  getSuggestedFileName(): string {
    return `cc-${this.accountInfo.fid}-${this.cardInfo.brand}-${this.cardInfo.level}-${this.cardInfo.number}-${formatFileNameDate(this.dateStart)}-${formatFileNameDate(this.dateEnd)}.ofx`;
  }

  addTx(tx: OFXTransaction) {
    tx.amount *= -1;
    this.transactions.push(tx);
  }

  outputCCMsg(): string {
    return `
    <CREDITCARDMSGSRSV1>
      <CCSTMTTRNRS>
        <TRNUID>1001</TRNUID>
        <STATUS>
          <CODE>0</CODE>
          <SEVERITY>INFO</SEVERITY>
        </STATUS>
        <CCSTMTRS>
          <CURDEF>${this.currency}</CURDEF>
          <CCACCTFROM>
            <ACCTID>${this.id}</ACCTID>
          </CCACCTFROM>
          <BANKTRANLIST>
            <DTSTART>${formatOFXDate(this.dateStart)}</DTSTART>
            <DTEND>${formatOFXDate(this.dateEnd)}</DTEND>
            ${this.transactions.map((tx) => tx.output()).join("\n")}
          </BANKTRANLIST>
          ${this.balance.output()}
        </CCSTMTRS>
      </CCSTMTTRNRS>
    </CREDITCARDMSGSRSV1>
    `;
  }

  output(): string {
    return outputOFXBase(
      this.accountInfo,
      this.dateServer,
      this.language,
      this.outputCCMsg(),
    );
  }
}
