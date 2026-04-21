import { describe, expect, test } from "bun:test";
import { Client, getActiveMem, Mem, User } from "../class";
import { markKeyModified } from "../keyspace";

function createSocket() {
  const writes: string[] = [];

  return {
    writes,
    socket: {
      write(data: string) {
        writes.push(data);
        return true;
      },
    } as any,
  };
}

describe("class and keyspace behavior", () => {
  test("clients inherit nopass authentication from the default user", () => {
    const { socket } = createSocket();

    const nopassClient = new Client(socket, new User("default", ["nopass"], []));
    const passwordClient = new Client(socket, new User("locked", [], ["hashed"]));

    expect(nopassClient.authenticated).toBe(true);
    expect(passwordClient.authenticated).toBe(false);
  });

  test("expires entries lazily when accessed after ttl", async () => {
    const store = new Map<string, Mem>();
    const entry = new Mem(["value"]);
    store.set("session", entry);

    entry.scheduleExpiry("session", store, 10);
    await Bun.sleep(25);

    expect(getActiveMem(store, "session")).toBeUndefined();
    expect(store.has("session")).toBe(false);
  });

  test("clearExpiry cancels scheduled deletion", async () => {
    const store = new Map<string, Mem>();
    const entry = new Mem(["value"]);
    store.set("session", entry);

    entry.scheduleExpiry("session", store, 10);
    entry.clearExpiry();
    await Bun.sleep(25);

    expect(getActiveMem(store, "session")).toBe(entry);
    expect(store.get("session")).toBe(entry);
  });

  test("tracks watched key versions on clients", () => {
    const { socket } = createSocket();
    const client = new Client(socket, new User("default", ["nopass"], []));

    client.watchKeys(["alpha"]);
    expect(client.hasDirtyWatchedKeys()).toBe(false);

    markKeyModified("alpha");
    expect(client.hasDirtyWatchedKeys()).toBe(true);

    client.clearWatch();
    expect(client.hasDirtyWatchedKeys()).toBe(false);
  });

  test("unwatched keys do not dirty the watch state", () => {
    const { socket } = createSocket();
    const client = new Client(socket, new User("default", ["nopass"], []));

    client.watchKeys(["alpha", "beta"]);
    markKeyModified("gamma");

    expect(client.hasDirtyWatchedKeys()).toBe(false);
  });

  test("reset does not rename non-default users", () => {
    const user = new User("alice", ["on", "allcommands"], ["hashed"]);

    user.reset();

    expect(user.name).toBe("alice");
    expect(user.passwordArray).toEqual([]);
  });
});
