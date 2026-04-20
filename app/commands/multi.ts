import { BulkString, BulkError, NULLBULKSTRING, SimpleString } from "../helper";
import { mem } from "../command-handler";
import { Client, getActiveMem } from "../class";

export function multi(arg: string[], client: Client) {
  if (arg.length != 0) {
    return BulkError("ERR must use 0 parameters");
  }
  if (!client.isTransaction) {
    return BulkError("ERR EXEC without MULTI");
  }

  return SimpleString("OK");
}
