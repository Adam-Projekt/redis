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
import { Commands } from "./commandEnum";
import { handle } from "./command";

export const mem = new Map<string, Mem>();

export const users: User[] = [new User("default", ["nopass"], [])];

export async function Manage(arg: string[], client: Client) {
  if (arg.length == 0) {
    client.socket.write(BulkError("ERR No parameters"));
  }
  const input: string = arg[0].toLocaleUpperCase();
  let command: Commands = Commands.Not;
  switch (input) {
    case "LLEN":
      if (arg.length > 1) {
        command = Commands.Llen;
      } else {
        client.socket.write(BulkError("ERR Not enough arguments"));
        return;
      }
      break;
    case "LPOP":
      if (arg.length > 1) {
        command = Commands.Lpop;
      } else {
        client.socket.write(BulkError("ERR Not enough arguments"));
        return;
      }
      break;
    case "LRANGE":
      if (arg.length > 2) {
        command = Commands.Lrange;
      } else {
        client.socket.write(BulkError("ERR Not enough arguments"));
        return;
      }
      break;
    case "LPUSH":
      if (arg.length > 2) {
        command = Commands.Lpush;
      } else {
        client.socket.write(BulkError("ERR Not enough arguments"));
        return;
      }
      break;
    case "SET":
      if (arg.length > 2) {
        command = Commands.Set;
      } else {
        client.socket.write(BulkError("ERR Not enough arguments"));
        return;
      }

      break;
    case "GET":
      if (arg.length > 1) {
        command = Commands.Get;
      } else {
        client.socket.write(BulkError("ERR Not enough arguments"));
        return;
      }

      break;
    case "RPUSH":
      if (arg.length > 2) {
        command = Commands.Rpush;
      } else {
        client.socket.write(BulkError("ERR Not enough arguments"));
        return;
      }
      break;
    case "ACL":
      if (arg.length > 1) {
        command = Commands.Acl;
      } else {
        client.socket.write(BulkError("ERR Not enough arguments"));
        return;
      }

      break;
    case "AUTH":
      if (arg.length > 2) {
        command = Commands.Auth;
      } else {
        client.socket.write(BulkError("ERR Not enough arguments"));
        return;
      }
      break;
    case "ECHO":
      if (arg.length > 1) {
        command = Commands.Echo;
      } else {
        client.socket.write(BulkError("ERR Not enough arguments"));
        return;
      }
      break;
    case "PING":
      command = Commands.Ping;
      break;
    default:
      break;
  }

  arg = arg.slice(1); //removes first element and shift

  console.log(command);
  if (command == Commands.Not) {
    client.socket.write(SimpleString("PONG")); //command unknown
    return;
  }
  await handle(arg, command, client);
}
