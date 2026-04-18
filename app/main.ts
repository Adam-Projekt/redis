import { strict } from "assert";
import * as net from "net";

console.log("Logs from your program will appear here!");

const CRLF = "\r\n";
const NULL_BULK_STRING = "$-1\r\n";

let responseData;
const mem = new Map<string, any>();

const server: net.Server = net.createServer((connection: net.Socket) => {
  // Handle connection
  connection.on("data", (data: Buffer) => {
    const stringifiedData = data.toString();
    const arrayData = stringifiedData.split(CRLF);
    console.log("arrayData", arrayData);

    //helper function
    function getArrayData(index: number) {
      if (index < arrayData.length) {
        return arrayData[index];
      } else return "";
    }

    const command = getArrayData(2).toLocaleUpperCase();

    switch (command) {
      case "SET":
        mem.set(getArrayData(4), getArrayData(6));

        if (getArrayData(8).toLowerCase() === "px")
          setTimeout(() => {
            mem.delete(getArrayData(4));
          }, +getArrayData(10));
        else if (getArrayData(8).toLowerCase() === "ex")
          setTimeout(
            () => {
              mem.delete(getArrayData(4));
            },
            +getArrayData(10) * 1000,
          );

        connection.write("+OK" + "\r\n");
        break;
      case "GET":
        let data = mem.get(getArrayData(4));
        responseData =
          data !== undefined
            ? `$${data.length}\r\n${data}\r\n`
            : NULL_BULK_STRING;

        connection.write(responseData);
        break;
      case "ECHO":
        responseData = `${getArrayData(3)}\r\n${getArrayData(4)}\r\n`;
        connection.write(responseData);
        break;
      case "PING":
        connection.write("+PONG\r\n");
        break;
      default:
        connection.write("+Pong\r\n");
        break;
    }
    // connection.write("+PONG\r\n");
  });
});
server.listen(6379, "127.0.0.1");
