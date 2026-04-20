import { Client } from "../class";
import { BulkError } from "../helper";

export function exec(arg: string[], client: Client) {
  if (arg.length != 0) {
    return BulkError("ERR must use 0 parameters");
  }
  if (client.isTransaction) {
  }
  client.isTransaction = true;

  return S;
}
