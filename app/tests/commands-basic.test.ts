import { describe, expect, test, beforeEach } from "bun:test";
import { BulkString, BulkError, SimpleString, NULLBULKSTRING } from "../helper";
import { get } from "../commands/basic/get";
import { set } from "../commands/basic/set";
import { mem } from "../command-handler";
import { Mem } from "../class";
import { ErrorMessages } from "../error";

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

describe("GET command", () => {
  beforeEach(clearMem);

  test("returns a bulk string when the key exists", () => {
    mem.set("greeting", new Mem(["hello"], 0, undefined));
    expect(get(["greeting"])).toBe(BulkString("hello"));
  });

  test("returns null bulk string when the key does not exist", () => {
    expect(get(["nonexistent"])).toBe(NULLBULKSTRING);
  });

  test("returns null bulk string when the key has expired", async () => {
    const entry = new Mem(["hello"], 0);
    mem.set("temporary", entry);
    entry.scheduleExpiry("temporary", mem, 10);

    await Bun.sleep(20);
    expect(get(["temporary"])).toBe(NULLBULKSTRING);
  });

  test("returns error when given wrong number of arguments", () => {
    expect(get([])).toBe(BulkError(ErrorMessages.WRONG_ARG_COUNT("get", 1)));
    expect(get(["key1", "key2"])).toBe(
      BulkError(ErrorMessages.WRONG_ARG_COUNT("get", 1)),
    );
  });

  test("returns error when trying to get a list", () => {
    mem.set("mylist", new Mem(["a", "b", "c"], 1));
    expect(get(["mylist"])).toBe(BulkError(ErrorMessages.WRONG_TYPE));
  });

  test("returns null for empty string values stored", () => {
    mem.set("empty", new Mem([""], 0));
    expect(get(["empty"])).toBe(NULLBULKSTRING);
  });

  test("handles special characters in values", () => {
    mem.set("special", new Mem(["hello\r\nworld"], 0));
    expect(get(["special"])).toBe(BulkString("hello\r\nworld"));
  });

  test("handles unicode characters in values", () => {
    mem.set("unicode", new Mem(["你好"], 0));
    expect(get(["unicode"])).toBe(BulkString("你好"));
  });

  test("handles numeric string values", () => {
    mem.set("number", new Mem(["42"], 0));
    expect(get(["number"])).toBe(BulkString("42"));
  });

  test("handles long string values", () => {
    const longValue = "x".repeat(1000);
    mem.set("long", new Mem([longValue], 0));
    expect(get(["long"])).toBe(BulkString(longValue));
  });
});

describe("SET command", () => {
  beforeEach(clearMem);

  test("sets a simple key-value pair", () => {
    expect(set(["key", "value"])).toBe(SimpleString("OK"));
    expect(get(["key"])).toBe(BulkString("value"));
  });

  test("overwrites existing values", () => {
    set(["key", "value1"]);
    expect(set(["key", "value2"])).toBe(SimpleString("OK"));
    expect(get(["key"])).toBe(BulkString("value2"));
  });

  test("sets empty string values", () => {
    expect(set(["empty", ""])).toBe(SimpleString("OK"));
    expect(get(["empty"])).toBe(NULLBULKSTRING);
  });

  test("sets values with special characters", () => {
    expect(set(["special", "hello\r\nworld"])).toBe(SimpleString("OK"));
    expect(get(["special"])).toBe(BulkString("hello\r\nworld"));
  });

  test("sets values with unicode characters", () => {
    expect(set(["unicode", "你好"])).toBe(SimpleString("OK"));
    expect(get(["unicode"])).toBe(BulkString("你好"));
  });

  test("returns error when given insufficient arguments", () => {
    expect(set([])).toBe(BulkError(ErrorMessages.WRONG_ARG_COUNT("set", 2)));
    expect(set(["key"])).toBe(
      BulkError(ErrorMessages.WRONG_ARG_COUNT("set", 2)),
    );
  });

  test("sets with EX (expire in seconds)", async () => {
    expect(set(["key", "value", "EX", "1"])).toBe(SimpleString("OK"));
    expect(get(["key"])).toBe(BulkString("value"));

    await Bun.sleep(1100);
    expect(get(["key"])).toBe(NULLBULKSTRING);
  });

  test("sets with PX (expire in milliseconds)", async () => {
    expect(set(["key", "value", "PX", "100"])).toBe(SimpleString("OK"));
    expect(get(["key"])).toBe(BulkString("value"));

    await Bun.sleep(150);
    expect(get(["key"])).toBe(NULLBULKSTRING);
  });

  test("returns error for invalid EX time", () => {
    expect(set(["key", "value", "EX", "0"])).toBe(
      BulkError(ErrorMessages.INVALID_EXPIRE_TIME),
    );
    expect(set(["key", "value", "EX", "-1"])).toBe(
      BulkError(ErrorMessages.INVALID_EXPIRE_TIME),
    );
    expect(set(["key", "value", "EX", "notanumber"])).toBe(
      BulkError(ErrorMessages.INVALID_EXPIRE_TIME),
    );
  });

  test("returns error for invalid PX time", () => {
    expect(set(["key", "value", "PX", "0"])).toBe(
      BulkError(ErrorMessages.INVALID_EXPIRE_TIME),
    );
    expect(set(["key", "value", "PX", "-100"])).toBe(
      BulkError(ErrorMessages.INVALID_EXPIRE_TIME),
    );
  });

  test("sets with NX (only if not exist)", () => {
    expect(set(["key", "value", "NX"])).toBe(SimpleString("OK"));
    expect(set(["key", "value2", "NX"])).toBe(NULLBULKSTRING);
    expect(get(["key"])).toBe(BulkString("value"));
  });

  test("sets with NX and EX options", async () => {
    expect(set(["key", "value", "NX", "EX", "1"])).toBe(SimpleString("OK"));
    expect(get(["key"])).toBe(BulkString("value"));

    await Bun.sleep(1100);
    expect(get(["key"])).toBe(NULLBULKSTRING);
  });

  test("sets with NX and PX options", async () => {
    expect(set(["key", "value", "NX", "PX", "100"])).toBe(SimpleString("OK"));
    expect(get(["key"])).toBe(BulkString("value"));

    await Bun.sleep(150);
    expect(get(["key"])).toBe(NULLBULKSTRING);
  });

  test("case-insensitive option parsing", () => {
    expect(set(["key", "value", "ex", "10"])).toBe(SimpleString("OK"));
    expect(get(["key"])).toBe(BulkString("value"));
    mem.clear();
  });

  test("clears existing expiry when overwriting", async () => {
    const entry = new Mem(["value1"], 0);
    mem.set("key", entry);
    entry.scheduleExpiry("key", mem, 100);

    set(["key", "value2"]);
    await Bun.sleep(150);

    expect(get(["key"])).toBe(BulkString("value2"));
  });

  test("handles large values", () => {
    const largeValue = "x".repeat(10000);
    expect(set(["large", largeValue])).toBe(SimpleString("OK"));
    expect(get(["large"])).toBe(BulkString(largeValue));
  });

  test("multiple consecutive sets", () => {
    set(["key", "value1"]);
    set(["key", "value2"]);
    set(["key", "value3"]);
    expect(get(["key"])).toBe(BulkString("value3"));
  });

  test("sets multiple different keys", () => {
    set(["key1", "value1"]);
    set(["key2", "value2"]);
    set(["key3", "value3"]);

    expect(get(["key1"])).toBe(BulkString("value1"));
    expect(get(["key2"])).toBe(BulkString("value2"));
    expect(get(["key3"])).toBe(BulkString("value3"));
  });

  test("overwrites list with string", () => {
    mem.set("key", new Mem(["a", "b"], 1));
    expect(set(["key", "value"])).toBe(SimpleString("OK"));
    expect(get(["key"])).toBe(BulkString("value"));
  });

  test("NX fails when key exists as list", () => {
    mem.set("key", new Mem(["a", "b"], 1));
    expect(set(["key", "value", "NX"])).toBe(NULLBULKSTRING);
  });

  test("handles numeric string values", () => {
    expect(set(["number", "42"])).toBe(SimpleString("OK"));
    expect(get(["number"])).toBe(BulkString("42"));
  });
});
