import { describe, expect, test, beforeEach } from "bun:test";
import { SimpleString, BulkError } from "../helper";
import { type as typeCommand } from "../commands/type";
import { set } from "../commands/basic/set";
import { lpush } from "../commands/lists/lpush";
import { rpush } from "../commands/lists/rpush";
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

describe("TYPE command", () => {
  beforeEach(clearMem);

  test("returns 'string' for string keys", () => {
    set(["key", "value"]);
    expect(typeCommand(["key"])).toBe(SimpleString("string"));
  });

  test("returns 'string' for integer values", () => {
    set(["counter", "42"]);
    expect(typeCommand(["counter"])).toBe(SimpleString("string"));
  });

  test("returns 'string' for empty string values", () => {
    set(["empty", ""]);
    expect(typeCommand(["empty"])).toBe(SimpleString("string"));
  });

  test("returns 'list' for list keys created with LPUSH", () => {
    lpush(["mylist", "a", "b", "c"]);
    expect(typeCommand(["mylist"])).toBe(SimpleString("list"));
  });

  test("returns 'list' for list keys created with RPUSH", () => {
    rpush(["mylist", "a", "b", "c"]);
    expect(typeCommand(["mylist"])).toBe(SimpleString("list"));
  });

  test("returns 'list' for single element lists", () => {
    lpush(["mylist", "a"]);
    expect(typeCommand(["mylist"])).toBe(SimpleString("list"));
  });

  test("returns 'none' for non-existent keys", () => {
    expect(typeCommand(["nonexistent"])).toBe(SimpleString("none"));
  });

  test("returns 'none' for expired keys", async () => {
    const entry = new Mem(["value"], 0);
    mem.set("temporary", entry);
    entry.scheduleExpiry("temporary", mem, 10);

    await Bun.sleep(20);
    expect(typeCommand(["temporary"])).toBe(SimpleString("none"));
  });

  test("returns error when given wrong number of arguments", () => {
    expect(typeCommand([])).toBe(BulkError("ERR must use 1 parameters"));
    expect(typeCommand(["key1", "key2"])).toBe(
      BulkError("ERR must use 1 parameters")
    );
  });

  test("returns 'string' for keys with special characters", () => {
    set(["special", "hello\r\nworld"]);
    expect(typeCommand(["special"])).toBe(SimpleString("string"));
  });

  test("returns 'string' for keys with unicode characters", () => {
    set(["unicode", "你好"]);
    expect(typeCommand(["unicode"])).toBe(SimpleString("string"));
  });

  test("correctly identifies type after mixed operations", () => {
    set(["string_key", "value"]);
    rpush(["list_key", "a", "b"]);

    expect(typeCommand(["string_key"])).toBe(SimpleString("string"));
    expect(typeCommand(["list_key"])).toBe(SimpleString("list"));
    expect(typeCommand(["missing_key"])).toBe(SimpleString("none"));
  });

  test("returns 'string' after overwriting a list", () => {
    rpush(["key", "a", "b"]);
    set(["key", "value"]);
    expect(typeCommand(["key"])).toBe(SimpleString("string"));
  });

  test("returns 'list' after overwriting a string", () => {
    set(["key", "value"]);
    rpush(["key", "a", "b"]);
    expect(typeCommand(["key"])).toBe(SimpleString("list"));
  });

  test("handles numeric string keys", () => {
    set(["12345", "value"]);
    expect(typeCommand(["12345"])).toBe(SimpleString("string"));
  });

  test("returns 'none' for deleted keys", () => {
    set(["temp", "value"]);
    mem.delete("temp");
    expect(typeCommand(["temp"])).toBe(SimpleString("none"));
  });

  test("handles multiple type checks on same key", () => {
    set(["key", "value"]);
    expect(typeCommand(["key"])).toBe(SimpleString("string"));
    expect(typeCommand(["key"])).toBe(SimpleString("string"));
    expect(typeCommand(["key"])).toBe(SimpleString("string"));
  });

  test("returns 'list' for empty list", () => {
    mem.set("emptylist", new Mem([], 1));
    expect(typeCommand(["emptylist"])).toBe(SimpleString("list"));
  });

  test("distinguishes between string and list after multiple operations", () => {
    rpush(["mylist", "a"]);
    set(["mystring", "b"]);
    lpush(["anotherlist", "c"]);

    expect(typeCommand(["mylist"])).toBe(SimpleString("list"));
    expect(typeCommand(["mystring"])).toBe(SimpleString("string"));
    expect(typeCommand(["anotherlist"])).toBe(SimpleString("list"));
    expect(typeCommand(["nonexistent"])).toBe(SimpleString("none"));
  });

  test("handles large string values", () => {
    const largeValue = "x".repeat(10000);
    set(["large", largeValue]);
    expect(typeCommand(["large"])).toBe(SimpleString("string"));
  });

  test("handles large lists", () => {
    const args = ["biglist"];
    for (let i = 0; i < 100; i++) {
      args.push(`element${i}`);
    }
    rpush(args);
    expect(typeCommand(["biglist"])).toBe(SimpleString("list"));
  });
});
