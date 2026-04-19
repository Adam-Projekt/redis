//my things
import {
  BulkString,
  SimpleString,
  BulkArray,
  generateSHA256,
  BulkError,
  BulkInteger,
  NULLBULKSTRING,
} from "./helper";
import { Client } from "./client";
import { User } from "./user";
import { Mem } from "./data";

export const mem = new Map<string, Mem>();

export const users: User[] = [new User("default", ["nopass"], [])];

export async function handle(arg: string[], client: Client) {
  //helper function
  function getData(index: number) {
    if (index < arg.length) {
      return arg[index];
    } else return "";
  }

  const command = getData(0).toUpperCase();
  const subcommand = getData(1).toUpperCase();
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
      const include_px = arg.includes("px"); //expire in miliseconds
      const include_ex = arg.includes("ex"); //expire in seconds
      const include_nx = arg.includes("nx"); //create only if not exist

      if (arg.length < 3) {
        client.socket.write(SimpleString("Not enough parametrs"));
        break;
      }
      if (!(mem.has(getData(1)) && include_nx)) {
        //check if exist and create only if not exist is true
        mem.set(getData(1), new Mem([getData(2)], 0)); // set the value
      } else {
        client.socket.write(NULLBULKSTRING);
      }

      if (include_px) {
        const index = arg.findIndex((a) => a == "px");
        setTimeout(
          () => {
            mem.delete(getData(1));
          },
          +getData(index + 1),
        );
      }

      //set expiry in miliseconds
      else if (include_ex) {
        const index = arg.findIndex((a) => a == "ex");
        setTimeout(
          () => {
            mem.delete(getData(1));
          },
          +getData(index + 1) * 1000,
        );
      }

      client.socket.write(SimpleString("OK")); //return succes
      break;
    case "GET":
      if (arg.length < 2) {
        client.socket.write(SimpleString("Not enough parametrs"));
      }
      const data = mem.get(getData(1));
      if (data?.WhatData !== 0) {
        client.socket.write(BulkError("WRONGTYPE"));
        break;
      }
      client.socket.write(BulkString(data?.data[0] || undefined));
      break;
    case "RPUSH":
      const key = getData(1);
      const value = getData(2);
      if (arg.length < 3) {
        client.socket.write(SimpleString("Not enough parametrs"));
        break;
      }
      if (mem.has(key)) {
        if (mem.get(key)?.WhatData !== 1) {
          client.socket.write(BulkError("WRONGTYPE"));
          break;
        }
        mem.get(key)?.data.push(value);
        client.socket.write(BulkInteger(mem.get(key)?.data.length || 0));
      } else {
        mem.set(key, new Mem([value], 1));
      }
      break;
    case "ACL":
      if (arg.length < 2) {
        client.socket.write(SimpleString("Not enough parametrs"));
        break;
      }
      switch (subcommand) {
        case "WHOAMI":
          const data = client.user?.name || "default";
          client.socket.write(BulkString(data));
          break;
        case "GETUSER":
          username = getData(1);
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
          username = getData(1);
          user;
          index = users.findIndex((person) => person.name === username);
          if (index >= 0) {
            user = users[index];
            console.log(user);
          } else {
            client.socket.write(SimpleString("User not found"));
            break;
          }
          let Parametrs: string = getData(2);
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
      if (arg.length < 3) {
        client.socket.write(SimpleString("Not enough parametrs"));
        break;
      }
      username = getData(1);
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
      const InputPassword = await generateSHA256(getData(2));
      const PasswordArray = user.passwordArray;
      let result = PasswordArray.findIndex((a) => a === InputPassword);

      if (result !== -1 || user.flagArray.includes("nopass")) {
        client.authenticated = true;
        client.user = user;
        client.socket.write(SimpleString("OK"));
      } else {
        client.socket.write(
          BulkError(
            "WRONGPASS invalid username-password pair or user is disabled.",
          ),
        ); // BulkError
      }
      break;
    case "ECHO":
      if (arg.length < 1) {
        client.socket.write(SimpleString("Not enough parametrs"));
      }
      client.socket.write(BulkString(getData(1)));
      break;
    case "PING":
      client.socket.write(SimpleString("PONG"));
      break;
    default:
      client.socket.write(SimpleString("PONG"));
      break;
  }
}
