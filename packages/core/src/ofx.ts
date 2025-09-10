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

export abstract class OFXFile {
  protected accountInfo: OFXBankAccountInfo;
  protected currency: string;
  protected transactions: OFXTransaction[] = [];
  protected dateServer: Date = new Date();
  protected dateStart: Date;
  protected dateEnd: Date;
  protected language: string = "POR";
  protected balance?: OFXLedgerBalance;

  protected constructor(
    accountInfo: OFXBankAccountInfo,
    currency: string,
    dateStart: Date,
    dateEnd: Date,
  ) {
    this.accountInfo = accountInfo;
    this.currency = currency;
    this.dateStart = dateStart;
    this.dateEnd = dateEnd;
  }

  abstract getSuggestedFileName(): string;
  abstract output(): string;

  getBankAccountInfo(): OFXBankAccountInfo {
    return this.accountInfo;
  }
  getTransactions(): OFXTransaction[] {
    return this.transactions;
  }

  addTx(tx: OFXTransaction) {
    this.transactions.push(tx);
  }
  setBalance(balance: number, date: Date) {
    this.balance = new OFXLedgerBalance(balance, date);
  }
  getBalance(): OFXLedgerBalance | undefined {
    return this.balance;
  }
}

export class OFXBankFile extends OFXFile {
  private accountType: BankAccountType;
  private accountName?: string;
  private accountNumber?: string;

  constructor(
    accountType: BankAccountType,
    accountInfo: OFXBankAccountInfo,
    currency: string,
    dateStart: Date,
    dateEnd: Date,
    accountName?: string,
    accountNumber?: string,
  ) {
    super(accountInfo, currency, dateStart, dateEnd);
    this.accountType = accountType;
    this.accountName = accountName;
    this.accountNumber = accountNumber;
  }

  override getSuggestedFileName(): string {
    const bankName = this.accountInfo.orgName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
    const accountType = this.accountType === "CHECKING" ? "checking" : this.accountType.toLowerCase();
    const accountSuffix = this.accountNumber ? `-${this.accountNumber.slice(-4)}` : '';
    const nameSuffix = this.accountName ? `-${this.accountName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 15)}` : '';
    
    return `${bankName}-${accountType}${accountSuffix}${nameSuffix}-${formatFileNameDate(this.dateStart)}-${formatFileNameDate(this.dateEnd)}.ofx`;
  }

  private outputBankMsg(): string {
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
          ${this.balance?.output()}
        </STMTRS>
      </STMTTRNRS>
    </BANKMSGSRSV1>
    `;
  }

  override output(): string {
    return outputOFXBase(
      this.accountInfo,
      this.dateServer,
      this.language,
      this.outputBankMsg(),
    );
  }
}

export class OFXCCFile extends OFXFile {
  private cardInfo: OFXCardInfo;
  private id: string;
  private accountName?: string;

  constructor(
    id: string,
    cardInfo: OFXCardInfo,
    accountInfo: OFXBankAccountInfo,
    currency: string,
    dateStart: Date,
    dateEnd: Date,
    accountName?: string,
  ) {
    super(accountInfo, currency, dateStart, dateEnd);
    this.id = id;
    this.cardInfo = cardInfo;
    this.accountName = accountName;
  }

  override getSuggestedFileName(): string {
    const bankName = this.accountInfo.orgName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
    const brand = this.cardInfo.brand.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
    const level = this.cardInfo.level.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
    const last4 = this.cardInfo.number.slice(-4);
    const nameSuffix = this.accountName ? `-${this.accountName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 15)}` : '';
    
    return `${bankName}-cc-${brand}-${level}-${last4}${nameSuffix}-${formatFileNameDate(this.dateStart)}-${formatFileNameDate(this.dateEnd)}.ofx`;
  }

  override addTx(tx: OFXTransaction) {
    tx.amount *= -1;
    this.transactions.push(tx);
  }

  getCardInfo() {
    return this.cardInfo;
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
          ${this.balance?.output()}
        </CCSTMTRS>
      </CCSTMTTRNRS>
    </CREDITCARDMSGSRSV1>
    `;
  }

  override output(): string {
    return outputOFXBase(
      this.accountInfo,
      this.dateServer,
      this.language,
      this.outputCCMsg(),
    );
  }
}
