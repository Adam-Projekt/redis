import * as net from "net";

console.log("Logs from your program will appear here!");

const server: net.Server = net.createServer((connection: net.Socket) => {
  // Handle connection
  connection.on("data", (data: Buffer) => {
    const stringifiedData = data.toString();
    const arrayData = stringifiedData.split("\r\n");
    console.log("arrayData", arrayData);
    const command = arrayData[2].toLocaleLowerCase();
    console.log("command", command);

    switch (command) {
      case "echo":
        const responseData = `${arrayData[3]}\r\n${arrayData[4]}\r\n`;
        connection.write(responseData);
        break;

      default:
        connection.write("+PONG\r\n");
        break;
    }
    // connection.write("+PONG\r\n");
  });
});
server.listen(6379, "127.0.0.1");
