import { describe, expect, test } from "bun:test";
import {
  blockClient,
  cleanupBlockedClient,
  serveBlockedClients,
  tryBlpop,
} from "../blocking";
import { Client, Mem, User } from "../class";
import { NULLBULKARRAY } from "../helper";

function createClient(name = "default") {
  const writes: string[] = [];
  const socket = {
    write(data: string) {
      writes.push(data);
      return true;
    },
  } as any;

  return {
    client: new Client(socket, new User(name, ["nopass"], [])),
    writes,
  };
}

describe("blocking list operations", () => {
  test("pops the first available element from the first non-empty key", () => {
    const store = new Map<string, Mem>([
      ["jobs", new Mem(["a", "b"], 1)],
      ["fallback", new Mem(["x"], 1)],
    ]);

    expect(tryBlpop(store, ["jobs", "fallback"])).toEqual({
      status: "value",
      key: "jobs",
      value: "a",
    });
    expect(store.get("jobs")?.data).toEqual(["b"]);
  });

  test("returns wrongtype when a referenced key is not a list", () => {
    const store = new Map<string, Mem>([["jobs", new Mem(["text"], 0)]]);

    expect(tryBlpop(store, ["jobs"])).toEqual({ status: "wrongtype" });
  });

  test("skips missing keys until it finds a populated list", () => {
    const store = new Map<string, Mem>([["fallback", new Mem(["x"], 1)]]);

    expect(tryBlpop(store, ["missing", "fallback"])).toEqual({
      status: "value",
      key: "fallback",
      value: "x",
    });
  });

  test("times blocked clients out and writes a null array", async () => {
    const { client, writes } = createClient();

    blockClient(client, ["jobs"], 0.01);
    expect(client.blocked).toBe(true);

    await Bun.sleep(30);

    expect(client.blocked).toBe(false);
    expect(writes).toEqual([NULLBULKARRAY]);
  });

  test("serves blocked clients when a pushed item becomes available", () => {
    const store = new Map<string, Mem>([["jobs", new Mem(["task-1"], 1)]]);
    const { client, writes } = createClient();

    blockClient(client, ["jobs"], 0);
    serveBlockedClients(store, "jobs");

    expect(client.blocked).toBe(false);
    expect(writes).toEqual(["*2\r\n$4\r\njobs\r\n$6\r\ntask-1\r\n"]);
  });

  test("serves blocked clients in fifo order", () => {
    const store = new Map<string, Mem>([["jobs", new Mem(["task-1", "task-2"], 1)]]);
    const first = createClient("first");
    const second = createClient("second");

    blockClient(first.client, ["jobs"], 0);
    blockClient(second.client, ["jobs"], 0);
    serveBlockedClients(store, "jobs");

    expect(first.client.blocked).toBe(false);
    expect(second.client.blocked).toBe(false);
    expect(first.writes).toEqual(["*2\r\n$4\r\njobs\r\n$6\r\ntask-1\r\n"]);
    expect(second.writes).toEqual(["*2\r\n$4\r\njobs\r\n$6\r\ntask-2\r\n"]);
  });

  test("reblocking the same client replaces the previous timer", async () => {
    const { client, writes } = createClient();

    blockClient(client, ["jobs"], 0.01);
    blockClient(client, ["other"], 0.01);
    await Bun.sleep(30);

    expect(writes).toEqual([NULLBULKARRAY]);
  });

  test("cleanup removes blocked state without writing a response", () => {
    const { client, writes } = createClient();

    blockClient(client, ["jobs"], 0);
    cleanupBlockedClient(client);

    expect(client.blocked).toBe(false);
    expect(writes).toEqual([]);
  });
});
