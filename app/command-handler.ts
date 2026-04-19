import * as net from "net";

//my things
import {
  BulkString,
  SimpleString,
  BulkArray,
  generateSHA256,
  BulkError,
} from "./helper";
import { Client } from "./client";
import { User } from "./user";

export const mem = new Map<string, any>();

export const users: User[] = [new User("default", ["nopass"], [])];

export async function handle(arrayData: string[], client: Client) {
  //helper function
  function getArrayData(index: number) {
    if (index < arrayData.length) {
      return arrayData[index];
    } else return "";
  }

  const command = getArrayData(2).toUpperCase();
  const subcommand = getArrayData(4).toLocaleUpperCase();
  let index;
  let username: string;
  let user;

  const allowedWithoutAuth = ["AUTH"];

  if (!client.authenticated && !allowedWithoutAuth.includes(command)) {
    client.socket.write(BulkError("NOAUTH Authentication required."));
    return;
  }

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

      client.socket.write(SimpleString("OK")); //return succes
      break;
    case "GET":
      const data = mem.get(getArrayData(4));
      client.socket.write(BulkString(data));
      break;
    case "ACL":
      //  //else {
      //   if (subcommand !== "GETUSER" || "SETUSER") {
      //     let data = client.user?.name;
      //     if (data == null) {
      //       data = "default";
      //     }

      //     client.socket.write(BulkString(data));
      //   } else {
      //     client.socket.write(BulkString("User not exist"));
      //   }
      //   break;
      // }

      switch (subcommand) {
        case "WHOAMI":
          const data = client.user?.name || "default";
          client.socket.write(BulkString(data));
          break;
        case "GETUSER":
          username = getArrayData(6);
          user;
          index = users.findIndex((person) => person.name === username);
          if (index >= 0) {
            user = users[index];
            console.log(user);
          } else {
            client.socket.write(SimpleString("User not found"));
            break;
          }
          const array = BulkArray(
            [
              BulkString("flags"),
              BulkArray(user.flagArray),
              BulkString("passwords"),
              BulkArray(user.passwordArray),
            ],
            false,
          );
          console.log(array + "dadss");
          client.socket.write(array);
          break;
        case "SETUSER":
          username = getArrayData(6);
          user;
          index = users.findIndex((person) => person.name === username);
          if (index >= 0) {
            user = users[index];
            console.log(user);
          } else {
            client.socket.write(SimpleString("User not found"));
            break;
          }
          let Parametrs: string = getArrayData(8);
          if (Parametrs.startsWith(">")) {
            let password = Parametrs.slice(1);
            password = await generateSHA256(password);
            user.passwordArray.push(password);

            let len = user.flagArray.findIndex((flag) => flag === "nopass");
            if (len !== -1) {
              user.flagArray.splice(len, 1);
            }
          }
          client.socket.write(SimpleString("OK"));
          break;
        default:
          client.socket.write(BulkString("Command not found"));
          break;
      }
      break;
    case "AUTH":
      username = getArrayData(4);
      user;
      index = users.findIndex((person) => person.name === username);
      if (index >= 0) {
        user = users[index];
        console.log(user);
      } else {
        client.socket.write(
          BulkError(
            "WRONGPASS invalid username-password pair or user is disabled.",
          ),
        ); //BulkError
        break;
      }
      let InputPassword = await generateSHA256(getArrayData(6));
      let PasswordArray = user.passwordArray;
      let result = PasswordArray.findIndex((a) => a === InputPassword);
      if (user.flagArray.includes("nopass")) {
        result = 1;
      }
      if (result == -1) {
        client.socket.write(
          BulkError(
            "WRONGPASS invalid username-password pair or user is disabled.",
          ),
        ); //BulkError
      } else {
        client.authenticated = true;
        client.user = user;
        client.socket.write(SimpleString("OK"));
      }
      break;
    case "ECHO":
      client.socket.write(BulkString(getArrayData(4)));
      break;
    case "PING":
      client.socket.write(SimpleString("PONG"));
      break;
    default:
      client.socket.write(SimpleString("PONG"));
      break;
  }
}
