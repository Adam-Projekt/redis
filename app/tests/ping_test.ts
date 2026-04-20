import { expect, test } from "bun:test";
import { handle } from "../command";

test("g", () => {
  expect(2 + 2).toBe(4);
});

const server = net.createServer((connection) => {
  const client = new Client(connection, users[0]);

  connection.on("data", (data) => {
    const arrayData = data.toString().split("\r\n");
    const UserData = [];
    for (let i = 0; i < arrayData.length; i++) {
      if (i % 2 == 0 && i > 1) {
        UserData.push(arrayData[i]);
      }
    }
    console.log(UserData);
    Manage(UserData, client);
  });

  connection.on("close", () => {
    cleanupBlockedClient(client);
  });
});
