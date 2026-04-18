import * as net from "net";
import { mem } from "./mem";
import { BulkString, SimpleString, BulkArray } from "./helper";

const CRLF = "\r\n";
const NULL_BULK_STRING = "$-1\r\n";

export function handle(data: Buffer, connection: net.Socket) {
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

      connection.write(SimpleString("OK")); //return succes
      break;
    case "GET":
      const data = mem.get(getArrayData(4));
      connection.write(BulkString(data));
      break;
    case "ACL":
      if (getArrayData(4).toLocaleUpperCase() == "WHOAMI") {
        const data = "default";
        connection.write(BulkString(data));
      } else if (getArrayData(4).toLocaleUpperCase() == "GETUSER") {
        const data = "flags";
        const response = BulkString(data);
        const response2 = BulkArray([]);
        const array = BulkArray([response, response2]);
        connection.write(array);
      } else {
        connection.write(BulkString("Command not found"));
      }
      break;
    case "ECHO":
      connection.write(BulkString(getArrayData(4)));
      break;
    case "PING":
      connection.write(SimpleString("PONG"));
      break;
    default:
      connection.write(SimpleString("PONG"));
      break;
  }
}
