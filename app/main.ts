import * as net from "net";
import { Manage } from "./command-handler";
import { Client } from "./class";
import { users } from "./command-handler";
import { cleanupBlockedClient } from "./blocking";
import { argv } from "bun";
console.log(argv);
const port = Number(argv[1]) || 6379;

console.log("Logs from your program will appear here!");

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

server.listen(6379, "127.0.0.1");
