//my things
import { SimpleString, BulkError, NULLBULKSTRING } from "./helper";
import { User, Mem, Client, query } from "./class";
import { Commands } from "./commandEnum";
import { handle } from "./command";

export const mem = new Map<string, Mem>();

export const users: User[] = [new User("default", ["nopass"], [])];

export async function Manage(arg: string[], client: Client) {
  if (arg.length == 0) {
    client.socket.write(BulkError("ERR No parameters"));
    return;
  }

  if (client.blocked) {
    client.socket.write(await BulkError("ERR client is blocked"));
    return;
  }

  const input: string = arg[0].toLocaleUpperCase();
  let command: Commands = Commands.Not;

  switch (input) {
    case "DISCARD":
      command = Commands.Discard;
      break;
    case "EXEC":
      command = Commands.Exec;
      break;
    case "MULTI":
      command = Commands.Multi;
      break;
    case "INCR":
      if (arg.length > 1) {
        command = Commands.Incr;
      } else {
        client.socket.write(BulkError("ERR Not enough arguments"));
        return;
      }
      break;
    case "WATCH":
      if (arg.length > 1) {
        command = Commands.Watch;
      } else {
        client.socket.write(BulkError("ERR Not enough arguments"));
        return;
      }
      break;
    case "TYPE":
      if (arg.length > 1) {
        command = Commands.Type;
      } else {
        client.socket.write(BulkError("ERR Not enough arguments"));
        return;
      }
      break;
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
    case "BLPOP":
      if (arg.length > 2) {
        command = Commands.Blpop;
      } else {
        client.socket.write(BulkError("ERR Not enough arguments"));
        return;
      }
      break;
    case "LRANGE":
      if (arg.length > 3) {
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

  if (client.isTransaction && command != Commands.Exec) {
    client.TransactionArray.push(new query(command, arg));
    client.socket.write(SimpleString("QUEUED"));
  } else {
    client.socket.write(handle(arg, command, client));
  }
}
