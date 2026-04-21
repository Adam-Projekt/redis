import { describe, expect, test } from "bun:test";
import {
  BulkArray,
  BulkError,
  BulkInteger,
  BulkString,
  Contain,
  generateSHA256,
  GetIndex,
  SimpleString,
} from "../helper";

describe("RESP helpers", () => {
  test("encodes bulk strings and null bulk strings", () => {
    expect(BulkString("hello")).toBe("$5\r\nhello\r\n");
    expect(BulkString(undefined)).toBe("$-1\r\n");
  });

  test("encodes arrays in both joined and raw modes", () => {
    expect(BulkArray(["hello", "world"])).toBe(
      "*2\r\n$5\r\nhello\r\n$5\r\nworld\r\n",
    );
    expect(BulkArray(["$5\r\nhello\r\n", "$5\r\nworld\r\n"], false)).toBe(
      "*2\r\n$5\r\nhello\r\n$5\r\nworld\r\n",
    );
  });

  test("encodes integers and errors", () => {
    expect(BulkInteger(42)).toBe(":42\r\n");
    expect(BulkError("ERR boom")).toBe("-ERR boom\r\n");
    expect(SimpleString("OK")).toBe("+OK\r\n");
  });

  test("encodes an empty array correctly", () => {
    expect(BulkArray([])).toBe("*0\r\n");
  });

  test("matches values case-insensitively", () => {
    const values = ["PING", "Echo", "set"];

    expect(Contain("echo", values)).toBe(true);
    expect(Contain("auth", values)).toBe(false);
    expect(GetIndex("SET", values)).toBe(2);
    expect(GetIndex("missing", values)).toBe(-1);
  });

  test("hashes passwords deterministically", async () => {
    expect(await generateSHA256("secret")).toBe(
      "2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b",
    );
  });
});
