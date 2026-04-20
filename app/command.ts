//my things
import {
  BulkString,
  SimpleString,
  BulkArray,
  generateSHA256,
  BulkError,
  BulkInteger,
  Contain,
  GetIndex,
  NULLBULKSTRING,
} from "./helper";
import { Client } from "./client";
import { User, Mem } from "./class";
import { mem, users } from "./command-handler";
import { Commands } from "./commandEnum";

export async function handle(arg: string[], command: Commands, client: Client) {
  //helper function
  function getData(index: number) {
    if (index < arg.length) {
      return arg[index];
    } else return "";
  }

  const subcommand = getData(0).toUpperCase();
  let index;
  let username: string;
  let user;

  if (!client.authenticated && !(command == Commands.Auth)) {
    client.socket.write(BulkError("NOAUTH Authentication required."));
    return;
  }

  switch (command) {
    case Commands.Set:
      const key2 = getData(0);

      let px_index = -1; //expire in miliseconds
      let ex_index = -1; //expire in seconds
      let include_nx = false; //create only if not exist

      for (let i = 0; i < arg.length; i++) {
        if (arg[i].toUpperCase() == "PX" && i > 1) {
          px_index = i;
        } else if (arg[i].toUpperCase() == "EX" && i > 1) {
          ex_index = i;
        } else if (arg[i].toUpperCase() == "NX" && i > 1) {
          include_nx = true;
        }
      }

      if (mem.has(key2) && include_nx) {
        //check if exist and create only if not exist is true
        client.socket.write(NULLBULKSTRING);
        return;
      }
      mem.set(key2, new Mem([getData(1)], 0)); // set the value

      if (px_index != -1) {
        setTimeout(
          () => {
            mem.delete(key2);
          },
          +getData(px_index + 1),
        );
      }

      //set expiry in miliseconds
      else if (ex_index != -1) {
        setTimeout(
          () => {
            mem.delete(key2);
          },
          +getData(ex_index + 1) * 1000,
        );
      }

      client.socket.write(SimpleString("OK")); //return succes
      break;
    case Commands.Get:
      const data = mem.get(getData(0));
      if (!data) {
        client.socket.write(NULLBULKSTRING);
        return;
      }

      if (data.WhatData !== 0) {
        client.socket.write(BulkError("WRONGTYPE"));
        break;
      }
      client.socket.write(BulkString(data?.data[0] || undefined));
      break;
    case Commands.Lpush:
      const key4 = getData(0);

      for (let i = 1; i < arg.length; i++) {
        const value = arg[i];
        if (mem.has(key4)) {
          if (mem.get(key4)?.WhatData !== 1) {
            client.socket.write(BulkError("WRONGTYPE"));
            return;
          }
          mem.get(key4)?.data.unshift(value);
        } else {
          mem.set(key4, new Mem([value], 1));
        }
      }
      console.log("finish");
      client.socket.write(BulkInteger(mem.get(key4)?.data.length || 0));
      break; //lpush
    case Commands.Rpush:
      const key = getData(0);

      for (let i = 1; i < arg.length; i++) {
        const value = arg[i];
        if (mem.has(key)) {
          if (mem.get(key)?.WhatData !== 1) {
            client.socket.write(BulkError("WRONGTYPE"));
            return;
          }
          mem.get(key)?.data.push(value);
        } else {
          mem.set(key, new Mem([value], 1));
        }
      }
      console.log("finish");
      client.socket.write(BulkInteger(mem.get(key)?.data.length || 0));
      break; //Rpush
    case Commands.Lrange:
      const key3 = mem.get(getData(0));
      if (key3 == undefined) {
        client.socket.write(BulkArray([], false)); //empty bulk array
        return;
      }
      if (key3?.WhatData !== 1) {
        client.socket.write(BulkError("WRONGTYPE"));
        return;
      }
      const array = key3.data;

      let start: number = Number(getData(1));
      let stop: number = Number(getData(2));

      if (start < 0) {
        //implement neginative index
        start += array.length;
      }
      if (stop < 0) {
        //implement neginative index
        stop += array.length;
      }
      if (start >= array.length) {
        client.socket.write(BulkArray([], false)); //empty bulk array
        return;
      }
      if (start > stop) {
        client.socket.write(BulkArray([], false)); //empty bulk array
        return;
      }
      if (stop >= array.length) {
        stop = array.length - 1;
      }
      let response: string[] = [];
      for (let i = 0; i < array.length; i++) {
        if (i >= start && i <= stop) {
          response.push(array[i]);
        }
      }
      client.socket.write(BulkArray(response));

      break;
    case Commands.Acl:
      username = getData(1);
      switch (subcommand) {
        case "WHOAMI":
          const data = client.user?.name || "default";
          client.socket.write(BulkString(data));
          break;
        case "GETUSER":
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

            const len = GetIndex("nopass", user.flagArray);
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
      break; //ACL
    case Commands.Auth:
      username = getData(0);
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
      const InputPassword = await generateSHA256(getData(1));
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
      break; //AUTH
    case Commands.Echo:
      client.socket.write(BulkString(getData(0)));
      break; //Echo
    case Commands.Ping:
      client.socket.write(SimpleString("PONG"));
      break; //PING //PING
    default:
      break;
  }
}
