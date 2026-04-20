import { get } from "./commands/get";

export enum Commands {
  Set = "",
  Get = "GET",
  Rpush = "RPUSH", //List thing
  Lpush = "LPUSH",
  Llen = "Llen",
  Lpop = "LPOP",
  Lrange = "LRAGE",
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
  Get: () => get,
};
