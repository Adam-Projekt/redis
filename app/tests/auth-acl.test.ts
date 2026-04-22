import { describe, expect, test, beforeEach } from "bun:test";
import { BulkString, SimpleString, generateSHA256 } from "../helper";
import { acl } from "../commands/auth/acl";
import { Client, User } from "../class";
import { mem, users } from "../state";
import * as net from "net";

// Helper to reset users to default state
function resetUsers() {
  users.length = 0;
  users.push(new User("default", ["nopass"], []));
}

// Helper to clear the memory store
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

// Helper to create a mock socket
function createMockSocket() {
  return {
    write: () => {},
    on: () => {},
    destroy: () => {},
  } as unknown as net.Socket;
}

// Helper to create a client with default user
function createClient(user?: User) {
  const socket = createMockSocket();
  const defaultUser = user || users[0];
  return new Client(socket, defaultUser);
}

describe("ACL Command - USERS", () => {
  beforeEach(() => {
    resetUsers();
    clearMem();
  });

  test("should return list of all users", async () => {
    users.push(new User("alice", [], []));
    users.push(new User("bob", ["nopass"], []));

    const client = createClient();
    const result = await acl(["USERS"], client);

    expect(result).toContain(BulkString("default"));
    expect(result).toContain(BulkString("alice"));
    expect(result).toContain(BulkString("bob"));
  });

  test("should return only default user initially", async () => {
    const client = createClient();
    const result = await acl(["USERS"], client);

    expect(result).toContain(BulkString("default"));
  });

  test("should be case-insensitive for subcommand", async () => {
    const client = createClient();
    const resultUpper = await acl(["USERS"], client);
    const resultLower = await acl(["users"], client);

    expect(resultUpper).toBe(resultLower);
  });
});

describe("ACL Command - WHOAMI", () => {
  beforeEach(() => {
    resetUsers();
    clearMem();
  });

  test("should return default user for new client", async () => {
    const client = createClient();
    const result = await acl(["WHOAMI"], client);

    expect(result).toBe(BulkString("default"));
  });

  test("should return current user when authenticated as different user", async () => {
    const alice = new User("alice", [], []);
    users.push(alice);

    const client = createClient(alice);
    const result = await acl(["WHOAMI"], client);

    expect(result).toBe(BulkString("alice"));
  });

  test("should be case-insensitive for subcommand", async () => {
    const client = createClient();
    const resultUpper = await acl(["WHOAMI"], client);
    const resultLower = await acl(["whoami"], client);

    expect(resultUpper).toBe(resultLower);
  });
});

describe("ACL Command - GETUSER", () => {
  beforeEach(() => {
    resetUsers();
    clearMem();
  });

  test("should return user details with flags and passwords", async () => {
    const client = createClient();
    const result = await acl(["GETUSER", "default"], client);

    expect(result).toContain(BulkString("flags"));
    expect(result).toContain(BulkString("passwords"));
  });

  test("should return user not found for non-existent user", async () => {
    const client = createClient();
    const result = await acl(["GETUSER", "nonexistent"], client);

    expect(result).toBe(SimpleString("User not found"));
  });

  test("should return user flags", async () => {
    const alice = new User("alice", ["allcommands", "admin"], []);
    users.push(alice);

    const client = createClient();
    const result = await acl(["GETUSER", "alice"], client);

    expect(result).toContain("allcommands");
    expect(result).toContain("admin");
  });

  test("should return user passwords in array", async () => {
    const bob = new User("bob", [], ["hashed_password_1", "hashed_password_2"]);
    users.push(bob);

    const client = createClient();
    const result = await acl(["GETUSER", "bob"], client);

    expect(result).toContain("hashed_password_1");
    expect(result).toContain("hashed_password_2");
  });

  test("should be case-insensitive for subcommand", async () => {
    const client = createClient();
    const resultUpper = await acl(["GETUSER", "default"], client);
    const resultLower = await acl(["getuser", "default"], client);

    expect(resultUpper).toBe(resultLower);
  });

  test("should return nopass flag for default user", async () => {
    const client = createClient();
    const result = await acl(["GETUSER", "default"], client);

    expect(result).toContain(BulkString("nopass"));
  });
});

describe("ACL Command - SETUSER", () => {
  beforeEach(() => {
    resetUsers();
    clearMem();
  });

  test("should create new user when it does not exist", async () => {
    const client = createClient();
    const result = await acl(["SETUSER", "newuser"], client);

    expect(result).toBe(SimpleString("OK"));
    expect(users.find((u) => u.name === "newuser")).toBeDefined();
  });

  test("should add password to user with > prefix", async () => {
    const client = createClient();
    await acl(["SETUSER", "alice", ">mysecret"], client);

    const alice = users.find((u) => u.name === "alice");
    expect(alice).toBeDefined();
    expect(alice!.passwordArray.length).toBe(1);
    expect(alice!.passwordArray[0]).toBe(await generateSHA256("mysecret"));
  });

  test("should remove password from user with < prefix", async () => {
    const password = await generateSHA256("mysecret");
    const alice = new User("alice", [], [password]);
    users.push(alice);

    const client = createClient();
    await acl(["SETUSER", "alice", "<mysecret"], client);

    expect(alice.passwordArray.length).toBe(0);
  });

  test("should remove nopass flag when password is added", async () => {
    const alice = new User("alice", ["nopass"], []);
    users.push(alice);

    const client = createClient();
    await acl(["SETUSER", "alice", ">mysecret"], client);

    expect(alice.flagArray.includes("nopass")).toBe(false);
  });

  test("should set NOPASS flag on user", async () => {
    const client = createClient();
    await acl(["SETUSER", "alice", "NOPASS"], client);

    const alice = users.find((u) => u.name === "alice");
    expect(alice!.flagArray.includes("nopass")).toBe(true);
  });

  test("should not add duplicate NOPASS flag", async () => {
    const alice = new User("alice", ["nopass"], []);
    users.push(alice);

    const client = createClient();
    await acl(["SETUSER", "alice", "NOPASS"], client);

    const nopassCount = alice.flagArray.filter((f) => f === "nopass").length;
    expect(nopassCount).toBe(1);
  });

  test("should enable user with ON flag", async () => {
    const alice = new User("alice", [], []);
    alice.enable = false;
    users.push(alice);

    const client = createClient();
    await acl(["SETUSER", "alice", "ON"], client);

    expect(alice.enable).toBe(true);
  });

  test("should disable user with OFF flag", async () => {
    const alice = new User("alice", [], []);
    users.push(alice);

    const client = createClient();
    await acl(["SETUSER", "alice", "OFF"], client);

    expect(alice.enable).toBe(false);
  });

  test("should reset user with RESET flag", async () => {
    const alice = new User(
      "alice",
      ["admin"],
      [await generateSHA256("secret")],
    );
    users.push(alice);

    const client = createClient();
    await acl(["SETUSER", "alice", "RESET"], client);

    expect(alice.passwordArray.length).toBe(0);
    expect(alice.flagArray.length).toBe(0);
  });

  test("should reset default user to nopass", async () => {
    const client = createClient();
    await acl(["SETUSER", "default", "RESET"], client);

    const defaultUser = users[0];
    expect(defaultUser.flagArray).toContain("nopass");
  });

  test("should return OK on successful setuser", async () => {
    const client = createClient();
    const result = await acl(["SETUSER", "testuser"], client);

    expect(result).toBe(SimpleString("OK"));
  });

  test("should modify existing user properties", async () => {
    const alice = new User("alice", [], []);
    users.push(alice);

    const client = createClient();
    await acl(["SETUSER", "alice", ">password1"], client);
    await acl(["SETUSER", "alice", ">password2"], client);

    expect(alice.passwordArray.length).toBe(2);
  });

  test("should be case-insensitive for subcommand", async () => {
    const client = createClient();
    const resultUpper = await acl(["SETUSER", "alice"], client);
    const resultLower = await acl(["setuser", "alice"], client);

    expect(resultUpper).toBe(resultLower);
  });

  test("should handle multiple passwords on same user", async () => {
    const client = createClient();
    await acl(["SETUSER", "alice", ">pass1"], client);
    await acl(["SETUSER", "alice", ">pass2"], client);
    await acl(["SETUSER", "alice", ">pass3"], client);

    const alice = users.find((u) => u.name === "alice");
    expect(alice!.passwordArray.length).toBe(3);
  });

  test("should remove nopass when < password is used", async () => {
    const pass = await generateSHA256("test");
    const user = new User("testuser", ["nopass"], [pass]);
    users.push(user);

    const client = createClient();
    await acl(["SETUSER", "testuser", "<test"], client);

    expect(user.flagArray.includes("nopass")).toBe(false);
  });
});

describe("ACL Command - Edge Cases", () => {
  beforeEach(() => {
    resetUsers();
    clearMem();
  });

  test("should return command not found for unknown subcommand", async () => {
    const client = createClient();
    const result = await acl(["UNKNOWN"], client);

    expect(result).toBe(BulkString("Command not found"));
  });

  test("should be case-insensitive for all flag values", async () => {
    const client = createClient();
    await acl(["SETUSER", "alice", "on"], client);
    await acl(["SETUSER", "alice", "OFF"], client);
    await acl(["SETUSER", "alice", "On"], client);

    const alice = users.find((u) => u.name === "alice");
    expect(alice!.enable).toBe(true);
  });

  test("should handle setuser without additional parameters", async () => {
    const client = createClient();
    const result = await acl(["SETUSER", "alice"], client);

    expect(result).toBe(SimpleString("OK"));
    const alice = users.find((u) => u.name === "alice");
    expect(alice).toBeDefined();
  });

  test("should handle password with special characters", async () => {
    const client = createClient();
    const specialPass = "p@ss!#$%^&*()word";
    await acl(["SETUSER", "special", ">" + specialPass], client);

    const special = users.find((u) => u.name === "special");
    expect(special!.passwordArray[0]).toBe(await generateSHA256(specialPass));
  });

  test("should handle empty password string", async () => {
    const client = createClient();
    await acl(["SETUSER", "emptypass", ">"], client);

    const emptypass = users.find((u) => u.name === "emptypass");
    expect(emptypass!.passwordArray[0]).toBe(await generateSHA256(""));
  });

  test("should handle long password", async () => {
    const client = createClient();
    const longPass = "a".repeat(1000);
    await acl(["SETUSER", "longpass", ">" + longPass], client);

    const user = users.find((u) => u.name === "longpass");
    expect(user!.passwordArray[0]).toBe(await generateSHA256(longPass));
  });

  test("should not fail when removing non-existent password", async () => {
    const alice = new User("alice", [], [await generateSHA256("pass1")]);
    users.push(alice);

    const client = createClient();
    const result = await acl(["SETUSER", "alice", "<nonexistent"], client);

    expect(result).toBe(SimpleString("OK"));
    expect(alice.passwordArray.length).toBe(1);
  });
});

describe("User Class Behavior", () => {
  beforeEach(() => {
    resetUsers();
    clearMem();
  });

  test("should start with empty flags and passwords", () => {
    const newUser = new User("test", [], []);

    expect(newUser.flagArray.length).toBe(0);
    expect(newUser.passwordArray.length).toBe(0);
  });

  test("should be enabled by default", () => {
    const newUser = new User("test", [], []);

    expect(newUser.enable).toBe(true);
  });

  test("should have correct name", () => {
    const newUser = new User("myname", [], []);

    expect(newUser.name).toBe("myname");
  });

  test("should initialize with provided flags", () => {
    const newUser = new User("test", ["flag1", "flag2"], []);

    expect(newUser.flagArray).toContain("flag1");
    expect(newUser.flagArray).toContain("flag2");
  });

  test("should initialize with provided passwords", () => {
    const newUser = new User("test", [], ["hash1", "hash2"]);

    expect(newUser.passwordArray).toContain("hash1");
    expect(newUser.passwordArray).toContain("hash2");
  });

  test("reset should clear passwords and flags for non-default user", async () => {
    const user = new User("alice", ["admin"], [await generateSHA256("secret")]);
    user.reset();

    expect(user.passwordArray.length).toBe(0);
    expect(user.flagArray.length).toBe(0);
  });

  test("reset should set nopass for default user", () => {
    const user = new User("default", ["admin"], []);
    user.reset();

    expect(user.flagArray).toContain("nopass");
  });
});

describe("ACL and User Interaction", () => {
  beforeEach(() => {
    resetUsers();
    clearMem();
  });

  test("should allow creating user, adding password, and viewing details", async () => {
    const client = createClient();

    // Create user
    await acl(["SETUSER", "bob", "ON"], client);
    expect(users.find((u) => u.name === "bob")).toBeDefined();

    // Add password
    await acl(["SETUSER", "bob", ">bobsecret"], client);
    const bob = users.find((u) => u.name === "bob");
    expect(bob!.passwordArray.length).toBe(1);

    // Get user info
    const info = await acl(["GETUSER", "bob"], client);
    expect(info).toContain(BulkString("flags"));
    expect(info).toContain(BulkString("passwords"));
  });

  test("should maintain user list correctly", async () => {
    const client = createClient();

    await acl(["SETUSER", "user1"], client);
    await acl(["SETUSER", "user2"], client);
    await acl(["SETUSER", "user3"], client);

    const usersList = await acl(["USERS"], client);

    expect(usersList).toContain(BulkString("default"));
    expect(usersList).toContain(BulkString("user1"));
    expect(usersList).toContain(BulkString("user2"));
    expect(usersList).toContain(BulkString("user3"));
  });

  test("should track enable/disable state correctly", async () => {
    const client = createClient();

    await acl(["SETUSER", "alice", "OFF"], client);
    let alice = users.find((u) => u.name === "alice");
    expect(alice!.enable).toBe(false);

    await acl(["SETUSER", "alice", "ON"], client);
    alice = users.find((u) => u.name === "alice");
    expect(alice!.enable).toBe(true);
  });
});
