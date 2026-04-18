import * as net from "net";

console.log("Logs from your program will appear here!");

const CRLF = "\r\n";
const NULL_BULK_STRING = "$-1\r\n";

let responseData;
const mem = new Map<String, any>();

const server: net.Server = net.createServer((connection: net.Socket) => {
  // Handle connection
  connection.on("data", (data: Buffer) => {
    const stringifiedData = data.toString();
    const arrayData = stringifiedData.split(CRLF);
    console.log("arrayData", arrayData);
    const command = arrayData[2].toLocaleLowerCase();
    console.log("command", command);

    switch (command) {
      case "set":
        mem.set(arrayData[4], arrayData[6]);
        if (arrayData[8] === "px")
          setTimeout(() => {
            console.log("key has expire");
            mem.delete(arrayData[4]);
          }, +arrayData[10]);
        responseData = "+OK" + CRLF;

        connection.write(responseData);
        break;
      case "get":
        let data: string = mem.get(arrayData[4]);
        let len: number = data.length;
        responseData = "$" + len + CRLF + data + CRLF;
        if (data == undefined) {
          data = "";
          len = -1;
          responseData = NULL_BULK_STRING;
        }
        connection.write(responseData);
        break;
      case "echo":
        responseData = `${arrayData[3]}\r\n${arrayData[4]}\r\n`;
        connection.write(responseData);
        break;
      case "ping":
        connection.write("+PONG\r\n");
        break;
      default:
        connection.write("+PONG\r\n");
        break;
    }
    // connection.write("+PONG\r\n");
  });
});
server.listen(6379, "127.0.0.1");
