import { BulkString, BulkError, NULLBULKSTRING, SimpleString } from "../helper";
import { mem } from "../command-handler";
import { Client, getActiveMem } from "../class";

export function multi(arg: string[], client: Client) {
  if (arg.length != 0) {
    return BulkError("ERR must use 0 parameters");
  }
  client.isTransaction = true;

  return SimpleString("OK");
}
