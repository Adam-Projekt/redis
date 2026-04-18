import * as net from "net";

//my things
import { BulkString, SimpleString, BulkArray, generateSHA256 } from "./helper";
import { User } from "./user";

const mem = new Map<string, any>();

const users: User[] = [new User("default", [BulkString("nopass")], [])];

export async function handle(arrayData: string[], connection: net.Socket) {
  //helper function
  function getArrayData(index: number) {
    if (index < arrayData.length) {
      return arrayData[index];
    } else return "";
  }

  const command = getArrayData(2).toLocaleUpperCase();
  const subcommand = getArrayData(4).toLocaleUpperCase();

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
      let username = getArrayData(6);
      let user;
      let index = users.findIndex((person) => person.name === username);
      if (index >= 0) {
        user = users[index];
        console.log(user);
      } else {
        if (subcommand == "WHOAMI") {
          const data = "default";
          connection.write(BulkString(data));
        } else {
          connection.write(BulkString("User not exist"));
        }
        break;
      }

      switch (subcommand) {
        case "WHOAMI":
          const data = "default";
          connection.write(BulkString(data));
          break;
        case "GETUSER":
          const array = BulkArray([
            BulkString("flags"),
            BulkArray(user.flagArray),
            BulkString("passwords"),
            BulkArray(user.passwordArray),
          ]);
          console.log(array);
          connection.write(array);
          break;
        case "SETUSER":
          let Parametrs: string = getArrayData(8);
          if (Parametrs.startsWith(">")) {
            let password = Parametrs.slice(1);
            console.log(password);
            password = await generateSHA256(password);
            console.log(password);
            user.passwordArray.push(BulkString(password));

            let len = user.flagArray.findIndex(
              (flag) => flag === BulkString("nopass"),
            );
            user.flagArray.splice(len, 1);
          }
          connection.write(SimpleString("OK"));
          break;
        default:
          connection.write(BulkString("Command not found"));
          break;
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
