import { describe, expect, test, beforeEach } from "bun:test";
import { BulkString, SimpleString, generateSHA256 } from "../helper";
import { handle } from "../command";
import { Commands } from "../enum";
import { Client, User } from "../class";
import { mem, users } from "../state";
import * as net from "net";
import { ErrorMessages } from "../error";

// Helper to reset state
function resetState() {
  users.length = 0;
  users.push(new User("default", ["nopass"], []));

  const keys = Array.from(mem.keys());
  keys.forEach((key) => {
    const entry = mem.get(key);
    if (entry) {
      entry.clearExpiry();
    }
    mem.delete(key);
  });
}

// Helper to create mock socket
function createMockSocket(): net.Socket {
  return {
    write: () => {},
  } as unknown as net.Socket;
}

// Helper to create test client
function createTestClient(user?: User): Client {
  const socket = createMockSocket();
  const defaultUser = user || users[0];
  return new Client(socket, defaultUser);
}

describe("AUTH Command - Basic Authentication", () => {
  beforeEach(resetState);

  test("should authenticate default user with nopass flag", async () => {
    const client = createTestClient();
    client.authenticated = false;

    const result = await handle(["default"], Commands.Auth, client);

    expect(result).toBe(SimpleString("OK"));
    expect(client.authenticated).toBe(true);
    expect(client.user?.name).toBe("default");
  });

  test("should authenticate with correct password", async () => {
    const password = "mypassword";
    const hashedPassword = await generateSHA256(password);
    const alice = new User("alice", [], [hashedPassword]);
    users.push(alice);

    const client = createTestClient();
    client.user = alice;
    client.authenticated = false;

    const result = await handle(["alice", password], Commands.Auth, client);

    expect(result).toBe(SimpleString("OK"));
    expect(client.authenticated).toBe(true);
    expect(client.user?.name).toBe("alice");
  });

  test("should authenticate user with nopass flag regardless of password", async () => {
    const bob = new User("bob", ["nopass"], []);
    users.push(bob);

    const client = createTestClient();
    client.user = bob;
    client.authenticated = false;

    const result = await handle(["bob", "anypassword"], Commands.Auth, client);

    expect(result).toBe(SimpleString("OK"));
    expect(client.authenticated).toBe(true);
  });
});

describe("AUTH Command - Failures", () => {
  beforeEach(resetState);

  test("should reject non-existent user", async () => {
    const client = createTestClient();
    client.authenticated = false;

    const result = await handle(
      ["nonexistent", "password"],
      Commands.Auth,
      client,
    );

    expect(result).toContain(ErrorMessages.INVALID_USERNAME);
    expect(client.authenticated).toBe(false);
  });

  test("should reject wrong password", async () => {
    const hashedPassword = await generateSHA256("correctpassword");
    const alice = new User("alice", [], [hashedPassword]);
    users.push(alice);

    const client = createTestClient();
    client.user = alice;
    client.authenticated = false;

    const result = await handle(
      ["alice", "wrongpassword"],
      Commands.Auth,
      client,
    );

    expect(result).toContain(ErrorMessages.INVALID_PASSWORD);
    expect(client.authenticated).toBe(false);
  });

  test("should reject disabled user even with correct password", async () => {
    const hashedPassword = await generateSHA256("password");
    const alice = new User("alice", [], [hashedPassword]);
    alice.enable = false;
    users.push(alice);

    const client = createTestClient();
    client.user = alice;
    client.authenticated = false;

    const result = await handle(["alice", "password"], Commands.Auth, client);

    expect(result).toContain(ErrorMessages.WRONGPASS);
    expect(client.authenticated).toBe(false);
  });

  test("should reject empty password when user has passwords set", async () => {
    const hashedPassword = await generateSHA256("password");
    const alice = new User("alice", [], [hashedPassword]);
    users.push(alice);

    const client = createTestClient();
    client.user = alice;
    client.authenticated = false;

    const result = await handle(["alice", ""], Commands.Auth, client);

    expect(result).toContain(ErrorMessages.WRONGPASS);
    expect(client.authenticated).toBe(false);
  });
});

describe("AUTH Command - Multiple Passwords", () => {
  beforeEach(resetState);

  test("should authenticate with any valid password from multiple", async () => {
    const password1 = "password1";
    const password2 = "password2";
    const password3 = "password3";

    const hashedPassword1 = await generateSHA256(password1);
    const hashedPassword2 = await generateSHA256(password2);
    const hashedPassword3 = await generateSHA256(password3);

    const alice = new User(
      "alice",
      [],
      [hashedPassword1, hashedPassword2, hashedPassword3],
    );
    users.push(alice);

    const client = createTestClient();
    client.user = alice;
    client.authenticated = false;

    // Try with first password
    let result = await handle(["alice", password1], Commands.Auth, client);
    expect(result).toBe(SimpleString("OK"));
    expect(client.authenticated).toBe(true);

    // Reset and try with second password
    client.authenticated = false;
    result = await handle(["alice", password2], Commands.Auth, client);
    expect(result).toBe(SimpleString("OK"));
    expect(client.authenticated).toBe(true);

    // Reset and try with third password
    client.authenticated = false;
    result = await handle(["alice", password3], Commands.Auth, client);
    expect(result).toBe(SimpleString("OK"));
    expect(client.authenticated).toBe(true);
  });

  test("should reject password not in user's password list", async () => {
    const password1 = "password1";
    const hashedPassword1 = await generateSHA256(password1);
    const alice = new User("alice", [], [hashedPassword1]);
    users.push(alice);

    const client = createTestClient();
    client.user = alice;
    client.authenticated = false;

    const result = await handle(
      ["alice", "nonexistentpassword"],
      Commands.Auth,
      client,
    );

    expect(result).toContain(ErrorMessages.WRONGPASS);
    expect(client.authenticated).toBe(false);
  });
});

describe("AUTH Command - User Switching", () => {
  beforeEach(resetState);

  test("should switch authenticated user", async () => {
    const alice = new User("alice", ["nopass"], []);
    const bob = new User("bob", ["nopass"], []);
    users.push(alice);
    users.push(bob);

    const client = createTestClient();

    // Authenticate as alice
    client.authenticated = false;
    client.user = alice;
    let result = await handle(["alice"], Commands.Auth, client);
    expect(result).toBe(SimpleString("OK"));
    expect(client.user?.name).toBe("alice");

    // Switch to bob
    client.authenticated = false;
    client.user = bob;
    result = await handle(["bob"], Commands.Auth, client);
    expect(result).toBe(SimpleString("OK"));
    expect(client.user?.name).toBe("bob");
  });

  test("should allow re-authentication with same user", async () => {
    const alice = new User("alice", ["nopass"], []);
    users.push(alice);

    const client = createTestClient();
    client.user = alice;

    // First authentication
    client.authenticated = false;
    let result = await handle(["alice"], Commands.Auth, client);
    expect(result).toBe(SimpleString("OK"));

    // Second authentication
    client.authenticated = false;
    result = await handle(["alice"], Commands.Auth, client);
    expect(result).toBe(SimpleString("OK"));
  });
});

describe("AUTH Command - Edge Cases", () => {
  beforeEach(resetState);

  test("should handle password with special characters", async () => {
    const password = "p@$$w0rd!#%^&*()_+-=[]{}|;:',.<>?/";
    const hashedPassword = await generateSHA256(password);
    const alice = new User("alice", [], [hashedPassword]);
    users.push(alice);

    const client = createTestClient();
    client.user = alice;
    client.authenticated = false;

    const result = await handle(["alice", password], Commands.Auth, client);

    expect(result).toBe(SimpleString("OK"));
    expect(client.authenticated).toBe(true);
  });

  test("should handle unicode characters in password", async () => {
    const password = "你好世界🌍";
    const hashedPassword = await generateSHA256(password);
    const alice = new User("alice", [], [hashedPassword]);
    users.push(alice);

    const client = createTestClient();
    client.user = alice;
    client.authenticated = false;

    const result = await handle(["alice", password], Commands.Auth, client);

    expect(result).toBe(SimpleString("OK"));
    expect(client.authenticated).toBe(true);
  });

  test("should handle very long password", async () => {
    const password = "a".repeat(10000);
    const hashedPassword = await generateSHA256(password);
    const alice = new User("alice", [], [hashedPassword]);
    users.push(alice);

    const client = createTestClient();
    client.user = alice;
    client.authenticated = false;

    const result = await handle(["alice", password], Commands.Auth, client);

    expect(result).toBe(SimpleString("OK"));
    expect(client.authenticated).toBe(true);
  });

  test("should be case-sensitive for username", async () => {
    const hashedPassword = await generateSHA256("password");
    const alice = new User("alice", [], [hashedPassword]);
    users.push(alice);

    const client = createTestClient();
    client.authenticated = false;

    // Try with different case
    const result = await handle(["ALICE", "password"], Commands.Auth, client);

    expect(result).toContain(ErrorMessages.WRONGPASS);
    expect(client.authenticated).toBe(false);
  });

  test("should be case-sensitive for password", async () => {
    const password = "MyPassword";
    const hashedPassword = await generateSHA256(password);
    const alice = new User("alice", [], [hashedPassword]);
    users.push(alice);

    const client = createTestClient();
    client.user = alice;
    client.authenticated = false;

    // Try with different case
    const result = await handle(["alice", "mypassword"], Commands.Auth, client);

    expect(result).toContain(ErrorMessages.WRONGPASS);
    expect(client.authenticated).toBe(false);
  });

  test("should handle whitespace in password exactly", async () => {
    const password = "pass word with spaces";
    const hashedPassword = await generateSHA256(password);
    const alice = new User("alice", [], [hashedPassword]);
    users.push(alice);

    const client = createTestClient();
    client.user = alice;
    client.authenticated = false;

    // Should fail with extra space
    let result = await handle(
      ["alice", "pass  word with spaces"],
      Commands.Auth,
      client,
    );
    expect(result).toContain(ErrorMessages.WRONGPASS);

    // Should succeed with exact match
    client.authenticated = false;
    result = await handle(
      ["alice", "pass word with spaces"],
      Commands.Auth,
      client,
    );
    expect(result).toBe(SimpleString("OK"));
  });
});

describe("AUTH Command - State Management", () => {
  beforeEach(resetState);

  test("should only update authenticated flag on success", async () => {
    const hashedPassword = await generateSHA256("password");
    const alice = new User("alice", [], [hashedPassword]);
    users.push(alice);

    const client = createTestClient();
    client.user = alice;
    client.authenticated = false;

    // Try wrong password
    let result = await handle(["alice", "wrongpass"], Commands.Auth, client);
    expect(result).toContain(ErrorMessages.WRONGPASS);
    expect(client.authenticated).toBe(false);

    // Try correct password
    result = await handle(["alice", "password"], Commands.Auth, client);
    expect(result).toBe(SimpleString("OK"));
    expect(client.authenticated).toBe(true);
  });

  test("should set client.user correctly", async () => {
    const alice = new User("alice", ["nopass"], []);
    const bob = new User("bob", ["nopass"], []);
    users.push(alice);
    users.push(bob);

    const client = createTestClient();
    client.user = alice;

    // Authenticate as bob
    const result = await handle(["bob"], Commands.Auth, client);

    expect(result).toBe(SimpleString("OK"));
    expect(client.user).toBe(bob);
    expect(client.user?.name).toBe("bob");
  });
});

describe("AUTH Command - Default User", () => {
  beforeEach(resetState);

  test("should authenticate default user with no password", async () => {
    const client = createTestClient();
    client.authenticated = false;

    const result = await handle(
      ["default", "anypassword"],
      Commands.Auth,
      client,
    );

    expect(result).toBe(SimpleString("OK"));
    expect(client.authenticated).toBe(true);
  });

  test("should authenticate default user with empty password", async () => {
    const client = createTestClient();
    client.authenticated = false;

    const result = await handle(["default", ""], Commands.Auth, client);

    expect(result).toBe(SimpleString("OK"));
    expect(client.authenticated).toBe(true);
  });
});
