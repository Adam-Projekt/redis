import { describe, expect, test, beforeEach } from "bun:test";
import { BulkError, BulkInteger } from "../helper";
import { incr } from "../commands/incr";
import { set } from "../commands/basic/set";
import { get } from "../commands/basic/get";
import { mem } from "../command-handler";
import { Mem } from "../class";

// Helper to clear the memory store before each test
function clearMem() {
  const keys = Array.from(mem.keys());
  keys.forEach((key) => {
    const entry = mem.get(key);
    if (entry) {
      entry.clearExpiry();
    }
    mem.delete(key);
  });
}

describe("INCR command", () => {
  beforeEach(clearMem);

  test("increments a non-existent key to 1", () => {
    expect(incr(["counter"])).toBe(BulkInteger(1));
    expect(get(["counter"])).toBe("$1\r\n1\r\n");
  });

  test("increments an existing integer value", () => {
    set(["counter", "5"]);
    expect(incr(["counter"])).toBe(BulkInteger(6));
    expect(get(["counter"])).toBe("$1\r\n6\r\n");
  });

  test("increments multiple times", () => {
    expect(incr(["counter"])).toBe(BulkInteger(1));
    expect(incr(["counter"])).toBe(BulkInteger(2));
    expect(incr(["counter"])).toBe(BulkInteger(3));
  });

  test("increments from negative values", () => {
    set(["counter", "-5"]);
    expect(incr(["counter"])).toBe(BulkInteger(-4));
  });

  test("increments to zero boundary", () => {
    set(["counter", "-1"]);
    expect(incr(["counter"])).toBe(BulkInteger(0));
  });

  test("increments from zero", () => {
    set(["counter", "0"]);
    expect(incr(["counter"])).toBe(BulkInteger(1));
  });

  test("increments large integers", () => {
    set(["counter", "9223372036854775800"]);
    expect(incr(["counter"])).toBe(BulkInteger(9223372036854775801));
  });

  test("increments with leading zeros", () => {
    set(["counter", "00005"]);
    expect(incr(["counter"])).toBe(BulkInteger(6));
  });

  test("returns error when given wrong number of arguments", () => {
    expect(incr([])).toBe(BulkError("ERR must use 1 parameters"));
    expect(incr(["key1", "key2"])).toBe(BulkError("ERR must use 1 parameters"));
  });

  test("returns error when value is not an integer", () => {
    set(["key", "notanumber"]);
    expect(incr(["key"])).toBe(
      BulkError("ERR value is not an integer or out of range"),
    );
  });

  test("returns error when value is a float", () => {
    set(["key", "3.14"]);
    expect(incr(["key"])).toBe(
      BulkError("ERR value is not an integer or out of range"),
    );
  });

  test("returns error when value contains spaces", () => {
    set(["key", "123 456"]);
    expect(incr(["key"])).toBe(
      BulkError("ERR value is not an integer or out of range"),
    );
  });

  test("returns error when trying to increment a list", () => {
    mem.set("mylist", new Mem(["a", "b"], 1));
    expect(incr(["mylist"])).toBe(BulkError("WRONGTYPE"));
  });

  test("treats empty string as zero and increments to 1", () => {
    set(["key", ""]);
    expect(incr(["key"])).toBe(BulkInteger(1));
  });

  test("handles expired values", async () => {
    const entry = new Mem(["10"], 0);
    mem.set("counter", entry);
    entry.scheduleExpiry("counter", mem, 10);

    await Bun.sleep(20);
    expect(incr(["counter"])).toBe(BulkInteger(1));
  });

  test("increments positive boundary values", () => {
    set(["counter", "2147483647"]); // Max 32-bit int
    expect(incr(["counter"])).toBe(BulkInteger(2147483648));
  });

  test("increments negative boundary values", () => {
    set(["counter", "-2147483648"]); // Min 32-bit int
    expect(incr(["counter"])).toBe(BulkInteger(-2147483647));
  });

  test("handles special numeric formats", () => {
    set(["key", "+42"]);
    expect(incr(["key"])).toBe(BulkInteger(43));
  });

  test("handles negative sign correctly", () => {
    set(["counter", "-999"]);
    expect(incr(["counter"])).toBe(BulkInteger(-998));
  });

  test("increments and stores the new value", () => {
    set(["counter", "10"]);
    incr(["counter"]);
    expect(get(["counter"])).toBe("$2\r\n11\r\n");
  });

  test("parses hex notation as valid numbers", () => {
    set(["key", "0x10"]);
    expect(incr(["key"])).toBe(BulkInteger(17));
  });

  test("parses scientific notation as valid numbers", () => {
    set(["key", "1e10"]);
    expect(incr(["key"])).toBe(BulkInteger(10000000001));
  });

  test("multiple increments on different keys", () => {
    expect(incr(["counter1"])).toBe(BulkInteger(1));
    expect(incr(["counter2"])).toBe(BulkInteger(1));
    expect(incr(["counter1"])).toBe(BulkInteger(2));
    expect(get(["counter1"])).toBe("$1\r\n2\r\n");
    expect(get(["counter2"])).toBe("$1\r\n1\r\n");
  });
});
