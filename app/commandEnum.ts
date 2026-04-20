import { get } from "./commands/get";
import { incr } from "./commands/incr";
import { multi } from "./commands/multi";
import { set } from "./commands/set";
import { type } from "./commands/type";
import { watch } from "./commands/watch";

export enum Commands {
  Set = "SET",
  Get = "GET",
  Incr = "INCR",
  Multi = "MULTI",
  Exec = "EXEC",
  Watch = "WATCH",
  Rpush = "RPUSH", //List thing
  Lpush = "LPUSH",
  Llen = "Llen",
  Lpop = "LPOP",
  Blpop = "BLPOP",
  Lrange = "LRAGE",
  Type = "TYPE",
  Auth = "AUTH", //auth/manage thing
  Acl = "ACL",
  Ping = "PING",
  Echo = "ECHO",
  Not = "NOT",
}
//export enum ArgRequider {
//   Set = 2,
//   Get = 1,
//   Acl = 1,
//   Rpush = 2,
//   Auth = 2,
//   Ping = 0,
//   Echo = 1,
// }
//
export const CommandTable = {
  Set: () => get,
  Get: () => set,
  Type: () => type,
  Watch: () => watch,
  Incr: () => incr,
  Multi: () => multi,
};
