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
  const input: string = arg[0].toLocaleUpperCase();
  let command: Commands = Commands.Not;
  switch (input) {
    case "SET":
      command = Commands.Set;
      break;
    case "GET":
      command = Commands.Get;
      break;
    case "RPUSH":
      command = Commands.Rpush;
      break;
    case "ACL":
      command = Commands.Acl;
      break;
    case "AUTH":
      command = Commands.Auth;
      break;
    case "ECHO":
      command = Commands.Echo;
      break;
    case "PING":
      command = Commands.Ping;
      break;
    default:
      break;
  }

  arg.slice(1); //removes first element and shift

  const allowedWithoutAuth = [Commands.Auth];

  if (!client.authenticated && !allowedWithoutAuth.includes(command)) {
    client.socket.write(BulkError("NOAUTH Authentication required."));
    return;
  }
  console.log(command);
  if (command == Commands.Not) {
    client.socket.write(SimpleString("PONG")); //command unknown
    return;
  }
  handle(arg, command, client);
}
