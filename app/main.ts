import * as net from "net";
import { handle } from "./command-handler";
import { Client } from "./client";
import { users } from "./command-handler";

console.log("Logs from your program will appear here!");

const server = net.createServer((connection) => {
  const client = new Client(connection, users[0]);

  connection.on("data", (data) => {
    const arrayData = data.toString().split("\r\n");
    handle(arrayData, client);
  });
});

server.listen(6379, "127.0.0.1");
