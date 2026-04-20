import { Client } from "../class";
import { BulkArray, BulkError, SimpleString } from "../helper";

export function exec(arg: string[], client: Client) {
  if (arg.length != 0) {
    return BulkError("ERR must use 0 parameters");
  }
  if (!client.isTransaction) {
    return BulkError("ERR EXEC without MULTI");
  }
  if (client.TransactionArray.length == 0) {
    return BulkArray(client.TransactionArray);
  }

  return SimpleString("ok");
}
