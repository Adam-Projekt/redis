//my things
import { SimpleString, BulkError, BulkArray } from "./helper";
import { Client, query } from "./class";
import { Commands } from "./enum";
import { handle } from "./command";
import { ErrorMessages } from "./error";
export { mem, users } from "./state";

export async function Manage(arg: string[], client: Client) {
  if (arg.length == 0) {
    client.socket.write(BulkError(ErrorMessages.SYNTAX_ERROR));
    return;
  }
  if (client.blocked) {
    client.socket.write(BulkError(ErrorMessages.BLOCKED_CLIENT));
    return;
  }
  if (!client.user?.enable) {
    client.socket.write(BulkError(ErrorMessages.USER_DISABLED));
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
        client.socket.write(
          BulkError(ErrorMessages.WRONG_ARG_COUNT("incr", 1)),
        );
        return;
      }
      break;
    case "SUBSCRIBE":
      if (arg.length > 1) {
        command = Commands.Subscribe;
      } else {
        client.socket.write(
          BulkError(ErrorMessages.WRONG_ARG_COUNT("Subscribe", 1)),
        );
        return;
      }
      break;
    case "WATCH":
      if (arg.length > 1) {
        command = Commands.Watch;
      } else {
        client.socket.write(
          BulkError(ErrorMessages.WRONG_ARG_COUNT("watch", 1)),
        );
        return;
      }
      break;
    case "TYPE":
      if (arg.length > 1) {
        command = Commands.Type;
      } else {
        client.socket.write(
          BulkError(ErrorMessages.WRONG_ARG_COUNT("type", 1)),
        );
        return;
      }
      break;
    case "LLEN":
      if (arg.length > 1) {
        command = Commands.Llen;
      } else {
        client.socket.write(
          BulkError(ErrorMessages.WRONG_ARG_COUNT("llen", 1)),
        );
        return;
      }
      break;
    case "LPOP":
      if (arg.length > 1) {
        command = Commands.Lpop;
      } else {
        client.socket.write(
          BulkError(ErrorMessages.WRONG_ARG_COUNT("lpop", 1)),
        );
        return;
      }
      break;
    case "BLPOP":
      if (arg.length > 2) {
        command = Commands.Blpop;
      } else {
        client.socket.write(
          BulkError(ErrorMessages.WRONG_ARG_COUNT("blpop", 2)),
        );
        return;
      }
      break;
    case "LRANGE":
      if (arg.length > 3) {
        command = Commands.Lrange;
      } else {
        client.socket.write(
          BulkError(ErrorMessages.WRONG_ARG_COUNT("lrange", 3)),
        );
        return;
      }
      break;
    case "LPUSH":
      if (arg.length > 2) {
        command = Commands.Lpush;
      } else {
        client.socket.write(
          BulkError(ErrorMessages.WRONG_ARG_COUNT("lpush", 2)),
        );
        return;
      }
      break;
    case "SET":
      if (arg.length > 2) {
        command = Commands.Set;
      } else {
        client.socket.write(BulkError(ErrorMessages.WRONG_ARG_COUNT("set", 2)));
        return;
      }

      break;
    case "GET":
      if (arg.length > 1) {
        command = Commands.Get;
      } else {
        client.socket.write(BulkError(ErrorMessages.WRONG_ARG_COUNT("get", 1)));
        return;
      }

      break;
    case "RPUSH":
      if (arg.length > 2) {
        command = Commands.Rpush;
      } else {
        client.socket.write(
          BulkError(ErrorMessages.WRONG_ARG_COUNT("rpush", 2)),
        );
        return;
      }
      break;
    case "ACL":
      if (arg.length > 1) {
        command = Commands.Acl;
      } else {
        client.socket.write(BulkError(ErrorMessages.WRONG_ARG_COUNT("acl", 1)));
        return;
      }

      break;
    case "AUTH":
      if (arg.length > 1) {
        command = Commands.Auth;
      } else {
        client.socket.write(
          BulkError(ErrorMessages.WRONG_ARG_COUNT("auth", 2)),
        );
        return;
      }
      break;
    case "UNWATCH":
      command = Commands.Unwatch;
      break;
    case "ECHO":
      if (arg.length > 1) {
        command = Commands.Echo;
      } else {
        client.socket.write(
          BulkError(ErrorMessages.WRONG_ARG_COUNT("echo", 1)),
        );
        return;
      }
      break;
    case "CONFIG":
      if (arg.length > 2) {
        command = Commands.Config;
      } else {
        client.socket.write(
          BulkError(ErrorMessages.WRONG_ARG_COUNT("config", 2)),
        );
        return;
      }
      break;
    case "ZADD":
      if (arg.length > 3) {
        command = Commands.Zadd;
      } else {
        client.socket.write(
          BulkError(ErrorMessages.WRONG_ARG_COUNT("zadd", 3)),
        );
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
  const allowInSubscribeMode = [Commands.Subscribe, Commands.Ping];
  const allowInTransaction = [Commands.Exec, Commands.Discard];
  if (
    client.isTransaction &&
    !allowInTransaction.includes(command) &&
    !client.subscribeMode
  ) {
    if (command == Commands.Watch) {
      client.socket.write(BulkError(ErrorMessages.WATCH_IN_MULTI));
    } else {
      client.TransactionArray.push(new query(command, arg));
      if (client.TransactionArray.length >= 5) {
        client.TransactionArray = [];
        client.isTransaction = false;
        client.clearWatch();
        client.socket.write(BulkError(ErrorMessages.TOO_BIG_TRANSATION));
      } else {
        client.socket.write(SimpleString("QUEUED"));
      }
    }
  } else if (client.subscribeMode) {
    if (allowInSubscribeMode.includes(command)) {
      if (command == Commands.Ping) {
        client.socket.write(BulkArray(["pong", ""]));
      } else {
        client.socket.write(await handle(arg, command, client));
      }
    } else {
      client.socket.write(
        BulkError(
          "ERR Can't execute '" +
            command +
            "': only (P|S)SUBSCRIBE / (P|S)UNSUBSCRIBE / PING / QUIT / RESET are allowed in this context ",
        ),
        );
    }
  } else {
    client.socket.write(await handle(arg, command, client));
  }
}
