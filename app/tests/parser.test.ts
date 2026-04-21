import { describe, expect, test } from "bun:test";
import { parseRESP } from "../parser";

describe("RESP parser", () => {
  test("returns an empty array for an empty payload", () => {
    expect(parseRESP(Buffer.alloc(0))).toEqual([]);
  });

  test("parses a simple RESP array", () => {
    const payload = Buffer.from("*2\r\n$4\r\nECHO\r\n$5\r\nhello\r\n");

    expect(parseRESP(payload)).toEqual(["ECHO", "hello"]);
  });

  test("preserves embedded CRLF inside bulk strings", () => {
    const payload = Buffer.from("*2\r\n$4\r\nECHO\r\n$10\r\nhello\r\nbye\r\n");

    expect(parseRESP(payload)).toEqual(["ECHO", "hello\r\nbye"]);
  });

  test("does not leak RESP metadata when two commands arrive together", () => {
    const payload = Buffer.from(
      "*1\r\n$4\r\nPING\r\n*1\r\n$4\r\nPING\r\n",
    );

    expect(parseRESP(payload)).toEqual(["PING", "PING"]);
  });

  test("does not emit incomplete bulk string data", () => {
    const payload = Buffer.from("*2\r\n$4\r\nECHO\r\n$5\r\nhe");

    expect(parseRESP(payload)).toEqual([]);
  });
});
