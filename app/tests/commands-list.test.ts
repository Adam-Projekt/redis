import { describe, expect, test, beforeEach } from "bun:test";
import {
  BulkError,
  BulkInteger,
  BulkArray,
  BulkString,
  NULLBULKSTRING,
} from "../helper";
import { lpush } from "../commands/lists/lpush";
import { rpush } from "../commands/lists/rpush";
import { set } from "../commands/basic/set";
import { mem } from "../command-handler";
import { Mem, getActiveMem, Client, User } from "../class";
import { handle } from "../command";
import { Commands } from "../enum";

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

// Helper to create a mock client for testing
function createMockClient() {
  const writes: string[] = [];
  const socket = {
    write(data: string) {
      writes.push(data);
      return true;
    },
  } as any;
  return new Client(socket, new User("default", ["nopass"], []));
}

describe("LPUSH command", () => {
  beforeEach(clearMem);

  test("creates a new list with a single value", () => {
    expect(lpush(["mylist", "a"])).toBe(BulkInteger(1));
    const list = getActiveMem(mem, "mylist");
    expect(list?.data).toEqual(["a"]);
  });

  test("pushes multiple values at once", () => {
    expect(lpush(["mylist", "a", "b", "c"])).toBe(BulkInteger(3));
    const list = getActiveMem(mem, "mylist");
    expect(list?.data).toEqual(["c", "b", "a"]);
  });

  test("pushes values to the left of the list", () => {
    lpush(["mylist", "a"]);
    expect(lpush(["mylist", "b"])).toBe(BulkInteger(2));
    const list = getActiveMem(mem, "mylist");
    expect(list?.data).toEqual(["b", "a"]);
  });

  test("returns the length of the list after push", () => {
    lpush(["mylist", "a"]);
    lpush(["mylist", "b"]);
    expect(lpush(["mylist", "c"])).toBe(BulkInteger(3));
  });

  test("returns 0 when given only key with no values", () => {
    expect(lpush(["mylist"])).toBe(BulkInteger(0));
  });

  test("returns error when trying to push to a string", () => {
    set(["key", "value"]);
    expect(lpush(["key", "item"])).toBe(BulkError("WRONGTYPE"));
  });

  test("handles empty string values", () => {
    expect(lpush(["mylist", ""])).toBe(BulkInteger(1));
    const list = getActiveMem(mem, "mylist");
    expect(list?.data).toEqual([""]);
  });

  test("handles special characters", () => {
    expect(lpush(["mylist", "hello\r\nworld"])).toBe(BulkInteger(1));
    const list = getActiveMem(mem, "mylist");
    expect(list?.data).toEqual(["hello\r\nworld"]);
  });

  test("pushes unicode characters", () => {
    expect(lpush(["mylist", "你好"])).toBe(BulkInteger(1));
    const list = getActiveMem(mem, "mylist");
    expect(list?.data).toEqual(["你好"]);
  });

  test("multiple lpush operations append left", () => {
    lpush(["list", "first"]);
    lpush(["list", "second"]);
    lpush(["list", "third"]);
    const list = getActiveMem(mem, "list");
    expect(list?.data).toEqual(["third", "second", "first"]);
  });

  test("lpush with many values maintains order", () => {
    expect(lpush(["list", "a", "b", "c", "d", "e"])).toBe(BulkInteger(5));
    const list = getActiveMem(mem, "list");
    expect(list?.data).toEqual(["e", "d", "c", "b", "a"]);
  });
});

describe("RPUSH command", () => {
  beforeEach(clearMem);

  test("creates a new list with a single value", () => {
    expect(rpush(["mylist", "a"])).toBe(BulkInteger(1));
    const list = getActiveMem(mem, "mylist");
    expect(list?.data).toEqual(["a"]);
  });

  test("pushes multiple values at once", () => {
    expect(rpush(["mylist", "a", "b", "c"])).toBe(BulkInteger(3));
    const list = getActiveMem(mem, "mylist");
    expect(list?.data).toEqual(["a", "b", "c"]);
  });

  test("pushes values to the right of the list", () => {
    rpush(["mylist", "a"]);
    expect(rpush(["mylist", "b"])).toBe(BulkInteger(2));
    const list = getActiveMem(mem, "mylist");
    expect(list?.data).toEqual(["a", "b"]);
  });

  test("returns the length of the list after push", () => {
    rpush(["mylist", "a"]);
    rpush(["mylist", "b"]);
    expect(rpush(["mylist", "c"])).toBe(BulkInteger(3));
  });

  test("returns 0 when given only key with no values", () => {
    expect(rpush(["mylist"])).toBe(BulkInteger(0));
  });

  test("returns error when trying to push to a string", () => {
    set(["key", "value"]);
    expect(rpush(["key", "item"])).toBe(BulkError("WRONGTYPE"));
  });

  test("handles empty string values", () => {
    expect(rpush(["mylist", ""])).toBe(BulkInteger(1));
    const list = getActiveMem(mem, "mylist");
    expect(list?.data).toEqual([""]);
  });

  test("alternating lpush and rpush", () => {
    lpush(["mylist", "a"]);
    rpush(["mylist", "b"]);
    lpush(["mylist", "c"]);
    const list = getActiveMem(mem, "mylist");
    expect(list?.data).toEqual(["c", "a", "b"]);
  });

  test("rpush with many values maintains order", () => {
    expect(rpush(["list", "a", "b", "c", "d", "e"])).toBe(BulkInteger(5));
    const list = getActiveMem(mem, "list");
    expect(list?.data).toEqual(["a", "b", "c", "d", "e"]);
  });

  test("multiple rpush operations append right", () => {
    rpush(["list", "first"]);
    rpush(["list", "second"]);
    rpush(["list", "third"]);
    const list = getActiveMem(mem, "list");
    expect(list?.data).toEqual(["first", "second", "third"]);
  });

  test("rpush handles unicode characters", () => {
    expect(rpush(["list", "你好"])).toBe(BulkInteger(1));
    const list = getActiveMem(mem, "list");
    expect(list?.data).toEqual(["你好"]);
  });
});

describe("LRANGE command", () => {
  beforeEach(clearMem);

  test("returns elements within range", async () => {
    rpush(["mylist", "a", "b", "c", "d"]);
    const client = createMockClient();
    const result = await handle(["mylist", "0", "1"], Commands.Lrange, client);
    expect(result).toBe(BulkArray(["a", "b"]));
  });

  test("returns all elements when range is larger than list", async () => {
    rpush(["mylist", "a", "b", "c"]);
    const client = createMockClient();
    const result = await handle(
      ["mylist", "0", "100"],
      Commands.Lrange,
      client,
    );
    expect(result).toBe(BulkArray(["a", "b", "c"]));
  });

  test("handles negative start index", async () => {
    rpush(["mylist", "a", "b", "c", "d"]);
    const client = createMockClient();
    const result = await handle(
      ["mylist", "-2", "-1"],
      Commands.Lrange,
      client,
    );
    expect(result).toBe(BulkArray(["c", "d"]));
  });

  test("handles negative stop index", async () => {
    rpush(["mylist", "a", "b", "c", "d"]);
    const client = createMockClient();
    const result = await handle(["mylist", "0", "-1"], Commands.Lrange, client);
    expect(result).toBe(BulkArray(["a", "b", "c", "d"]));
  });

  test("returns empty array when start > stop", async () => {
    rpush(["mylist", "a", "b", "c"]);
    const client = createMockClient();
    const result = await handle(["mylist", "2", "1"], Commands.Lrange, client);
    expect(result).toBe(BulkArray([], false));
  });

  test("returns empty array for non-existent key", async () => {
    const client = createMockClient();
    const result = await handle(
      ["nonexistent", "0", "1"],
      Commands.Lrange,
      client,
    );
    expect(result).toBe(BulkArray([], false));
  });

  test("returns error for non-list key", async () => {
    set(["key", "value"]);
    const client = createMockClient();
    const result = await handle(["key", "0", "1"], Commands.Lrange, client);
    expect(result).toBe(BulkError("WRONGTYPE"));
  });

  test("handles single element", async () => {
    rpush(["mylist", "a"]);
    const client = createMockClient();
    const result = await handle(["mylist", "0", "0"], Commands.Lrange, client);
    expect(result).toBe(BulkArray(["a"]));
  });

  test("handles start index at list boundary", async () => {
    rpush(["mylist", "a", "b", "c"]);
    const client = createMockClient();
    const result = await handle(["mylist", "3", "5"], Commands.Lrange, client);
    expect(result).toBe(BulkArray([], false));
  });

  test("handles full range 0 to -1", async () => {
    rpush(["mylist", "x", "y", "z"]);
    const client = createMockClient();
    const result = await handle(["mylist", "0", "-1"], Commands.Lrange, client);
    expect(result).toBe(BulkArray(["x", "y", "z"]));
  });

  test("handles middle range", async () => {
    rpush(["mylist", "a", "b", "c", "d", "e"]);
    const client = createMockClient();
    const result = await handle(["mylist", "1", "3"], Commands.Lrange, client);
    expect(result).toBe(BulkArray(["b", "c", "d"]));
  });

  test("handles negative indices", async () => {
    rpush(["mylist", "a", "b", "c", "d", "e"]);
    const client = createMockClient();
    const result = await handle(
      ["mylist", "-3", "-1"],
      Commands.Lrange,
      client,
    );
    expect(result).toBe(BulkArray(["c", "d", "e"]));
  });

  test("handles partial negative range", async () => {
    rpush(["mylist", "a", "b", "c", "d"]);
    const client = createMockClient();
    const result = await handle(["mylist", "1", "-2"], Commands.Lrange, client);
    expect(result).toBe(BulkArray(["b", "c"]));
  });
});

describe("LLEN command", () => {
  beforeEach(clearMem);

  test("returns length of existing list", async () => {
    rpush(["mylist", "a", "b", "c"]);
    const client = createMockClient();
    const result = await handle(["mylist"], Commands.Llen, client);
    expect(result).toBe(BulkInteger(3));
  });

  test("returns 0 for non-existent key", async () => {
    const client = createMockClient();
    const result = await handle(["nonexistent"], Commands.Llen, client);
    expect(result).toBe(BulkInteger(0));
  });

  test("returns error for non-list key", async () => {
    set(["key", "value"]);
    const client = createMockClient();
    const result = await handle(["key"], Commands.Llen, client);
    expect(result).toBe(BulkError("WRONGTYPE"));
  });

  test("returns updated length after push", async () => {
    rpush(["mylist", "a", "b"]);
    let client = createMockClient();
    let result = await handle(["mylist"], Commands.Llen, client);
    expect(result).toBe(BulkInteger(2));

    rpush(["mylist", "c"]);
    client = createMockClient();
    result = await handle(["mylist"], Commands.Llen, client);
    expect(result).toBe(BulkInteger(3));
  });

  test("returns 0 for empty list", async () => {
    mem.set("emptylist", new Mem([], 1));
    const client = createMockClient();
    const result = await handle(["emptylist"], Commands.Llen, client);
    expect(result).toBe(BulkInteger(0));
  });

  test("returns 1 for single element", async () => {
    rpush(["mylist", "a"]);
    const client = createMockClient();
    const result = await handle(["mylist"], Commands.Llen, client);
    expect(result).toBe(BulkInteger(1));
  });

  test("returns correct length after lpush", async () => {
    lpush(["mylist", "a", "b", "c", "d", "e"]);
    const client = createMockClient();
    const result = await handle(["mylist"], Commands.Llen, client);
    expect(result).toBe(BulkInteger(5));
  });
});

describe("LPOP command", () => {
  beforeEach(clearMem);

  test("pops the first element from the list", async () => {
    rpush(["mylist", "a", "b", "c"]);
    const client = createMockClient();
    const result = await handle(["mylist"], Commands.Lpop, client);
    expect(result).toBe(BulkString("a"));

    const list = getActiveMem(mem, "mylist");
    expect(list?.data).toEqual(["b", "c"]);
  });

  test("returns null when popping from non-existent key", async () => {
    const client = createMockClient();
    const result = await handle(["nonexistent"], Commands.Lpop, client);
    expect(result).toBe(NULLBULKSTRING);
  });

  test("returns error for non-list key", async () => {
    set(["key", "value"]);
    const client = createMockClient();
    const result = await handle(["key"], Commands.Lpop, client);
    expect(result).toBe(BulkError("WRONGTYPE"));
  });

  test("pops multiple elements", async () => {
    rpush(["mylist", "a", "b", "c", "d"]);
    const client = createMockClient();
    const result = await handle(["mylist", "2"], Commands.Lpop, client);
    expect(result).toBe(BulkArray(["a", "b"]));

    const list = getActiveMem(mem, "mylist");
    expect(list?.data).toEqual(["c", "d"]);
  });

  test("handles popping more elements than exist pads with nulls", async () => {
    rpush(["mylist", "a", "b"]);
    const client = createMockClient();
    const result = await handle(["mylist", "5"], Commands.Lpop, client);
    expect(result).toBe(BulkArray(["a", "b", undefined, undefined, undefined]));

    const list = getActiveMem(mem, "mylist");
    expect(list?.data).toEqual([]);
  });

  test("returns null from empty list", async () => {
    mem.set("emptylist", new Mem([], 1));
    const client = createMockClient();
    const result = await handle(["emptylist"], Commands.Lpop, client);
    expect(result).toBe(NULLBULKSTRING);
  });

  test("handles single element pop", async () => {
    rpush(["mylist", "a"]);
    const client = createMockClient();
    const result = await handle(["mylist"], Commands.Lpop, client);
    expect(result).toBe(BulkString("a"));

    const list = getActiveMem(mem, "mylist");
    expect(list?.data).toEqual([]);
  });

  test("pops with count of 0", async () => {
    rpush(["mylist", "a", "b", "c"]);
    const client = createMockClient();
    const result = await handle(["mylist", "0"], Commands.Lpop, client);
    expect(result).toBe(BulkString("a"));
  });

  test("pops all elements one by one", async () => {
    rpush(["mylist", "x", "y", "z"]);
    const client1 = createMockClient();
    const client2 = createMockClient();
    const client3 = createMockClient();

    expect(await handle(["mylist"], Commands.Lpop, client1)).toBe(
      BulkString("x"),
    );
    expect(await handle(["mylist"], Commands.Lpop, client2)).toBe(
      BulkString("y"),
    );
    expect(await handle(["mylist"], Commands.Lpop, client3)).toBe(
      BulkString("z"),
    );

    const list = getActiveMem(mem, "mylist");
    expect(list?.data).toEqual([]);
  });

  test("handles popping with empty string element", async () => {
    rpush(["mylist", "", "b"]);
    const client = createMockClient();
    const result = await handle(["mylist"], Commands.Lpop, client);
    expect(result).toBe(BulkString(""));
  });

  test("pops and returns multiple with count", async () => {
    rpush(["mylist", "first", "second", "third", "fourth"]);
    const client = createMockClient();
    const result = await handle(["mylist", "3"], Commands.Lpop, client);
    expect(result).toBe(BulkArray(["first", "second", "third"]));
  });
});
