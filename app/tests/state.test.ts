import { describe, expect, test } from "bun:test";
import { mem as handlerMem, users as handlerUsers } from "../command-handler";
import { mem, users } from "../state";

describe("shared state exports", () => {
  test("command handler re-exports the shared store and users", () => {
    expect(handlerMem).toBe(mem);
    expect(handlerUsers).toBe(users);
  });
});
