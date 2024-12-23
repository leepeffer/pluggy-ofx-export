import { expect, test } from "vitest";
import { APIAccountEntity } from "@actual-app/api/@types/loot-core/server/api-models";
import { rankBestAccounts } from "@ofx-playground/actual";
import { OFXBankAccountInfo, OFXBankFile, OFXCCFile } from "@ofx-playground/core/src/ofx";

test("account ranking", () => {
  const actualAccounts: APIAccountEntity[] = [
    { id: "1", name: "Nubank card", closed: false, offbudget: false },
    { id: "2", name: "BB (001)", closed: false, offbudget: false },
    { id: "3", name: "Nubank checking", closed: false, offbudget: false },
  ];

  const nubankAccountInfo: OFXBankAccountInfo = {
    orgName: "Nu Pagamentos S.A.",
    fid: 206,
    accountNumber: "123456",
    branch: "0001",
  };

  const bbAccountInfo: OFXBankAccountInfo = {
    orgName: "Banco do Brasil S.A.",
    fid: 1,
    accountNumber: "12345-6",
    branch: "1234-5",
  };

  expect(rankBestAccounts(new OFXBankFile("CHECKING", nubankAccountInfo, "BRL", new Date(), new Date()), actualAccounts).map(e => e[0])).toStrictEqual(["3", "2", "1"]);
  expect(rankBestAccounts(new OFXBankFile("CHECKING", bbAccountInfo, "BRL", new Date(), new Date()), actualAccounts).map(e => e[0])).toStrictEqual(["2", "3", "1"]);
  expect(rankBestAccounts(new OFXCCFile("9999", {
    brand: "Visa",
    level: "Gold",
    number: "1234",
  }, nubankAccountInfo, "BRL", new Date(), new Date()), actualAccounts).map(e => e[0])).toStrictEqual(["1", "2", "3"]);
});
