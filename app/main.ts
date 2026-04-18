import * as net from "net";

console.log("Logs from your program will appear here!");

const CRLF = "\r\n";
const NULL_BULK_STRING = "$-1\r\n";

let responseData: any;
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
        mem.set(getArrayData(4), getArrayData(6)); // set the value

        if (getArrayData(8).toLowerCase() === "px")
          setTimeout(() => {
            mem.delete(getArrayData(4));
          }, +getArrayData(10));
        //set expiry in miliseconds
        else if (getArrayData(8).toLowerCase() === "ex")
          setTimeout(
            () => {
              mem.delete(getArrayData(4));
            },
            +getArrayData(10) * 1000,
          ); //set expiry in second

        connection.write("+OK" + "\r\n"); //return succes
        break;
      case "GET":
        const data = mem.get(getArrayData(4));
        connection.write(
          data !== undefined
            ? `$${data.length}\r\n${data}\r\n`
            : NULL_BULK_STRING,
        );
        break;
      case "ACL":
        const data2 = "default";
        responseData = "$7\r\ndefault\r\n";
        connection.write("$7\r\ndefault\r\n");
        break;
      case "ECHO":
        connection.write(`${getArrayData(3)}\r\n${getArrayData(4)}\r\n`);
        break;
      case "PING":
        connection.write("+PONG\r\n");
        break;
      default:
        connection.write("+Pong\r\n");
        break;
    }
  });
});
server.listen(6379, "127.0.0.1");
