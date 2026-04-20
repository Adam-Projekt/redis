import { Client } from "../class";
import { BulkError, SimpleString } from "../helper";

export function exec(arg: string[], client: Client) {
  if (arg.length != 0) {
    return BulkError("ERR must use 0 parameters");
  }
  if (client.isTransaction) {
    return BulkError("ERR EXEC without MULTI");
  }

  return SimpleString("ok");
}
