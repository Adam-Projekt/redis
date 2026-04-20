import type { Client } from "../class";
import { BulkError, SimpleString } from "../helper";

export function discard(arg: string[], client: Client): string {
  if (arg.length != 0) {
    return BulkError("ERR must use 0 parameters");
  }
  if (!client.isTransaction) {
    return BulkError("ERR DISCARD without MULTI");
  }
  client.isTransaction = false;
  client.TransactionArray = [];
  return SimpleString("OK");
}
