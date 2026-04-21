export enum Commands {
  Set = "SET",
  Get = "GET",
  Config = "CONFIG",
  Incr = "INCR",
  Multi = "MULTI",
  Exec = "EXEC",
  Discard = "DISCARD",
  Watch = "WATCH",
  Unwatch = "UNWATCH",
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
