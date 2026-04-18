import * as net from "net";
import { handle } from "./command-handler";

console.log("Logs from your program will appear here!");

const CRLF = "\r\n";

const server: net.Server = net.createServer((connection: net.Socket) => {
  // Handle connection
  connection.on("data", (data: Buffer) => {
    const stringifiedData = data.toString();
    const arrayData = stringifiedData.split(CRLF);
    console.log("arrayData", arrayData);

    handle(arrayData, connection);
  });
});
server.listen(6379, "127.0.0.1");
