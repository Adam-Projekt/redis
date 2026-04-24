export enum Commands {
  Set = "SET",
  Get = "GET",
  Config = "CONFIG",
  Publish = "PUBLISH",
  Subscribe = "SUBSCRIBE",
  Unsubscribe = "UNSUBSCRIBE",
  Zadd = "ZADD",
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
  Lrange = "LRANGE",
  Type = "TYPE",
  Auth = "AUTH", //auth/manage thing
  Acl = "ACL",
  Ping = "PING",
  Echo = "ECHO",
  Not = "NOT",
}

export enum DataType {
  STRING = 0,
  LIST = 1,
  SORTED_SET = 2,
  HASH = 3,
  SET = 4,
  STREAM = 5,
}
export const DataTypeNames: Record<DataType, string> = {
  [DataType.STRING]: "string",
  [DataType.LIST]: "list",
  [DataType.SORTED_SET]: "zset",
  [DataType.HASH]: "hash",
  [DataType.SET]: "set",
  [DataType.STREAM]: "stream",
};
