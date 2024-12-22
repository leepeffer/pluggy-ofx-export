import { expect, test } from "bun:test";
import { formatOFXDate } from "../src/ofx";

test("ofx date format", () => {
  expect(formatOFXDate(new Date("2014-04-07T13:58:10.104Z"))).toBe(
    "20140407135810[0:GMT]",
  );
});
