import { Client } from "../class";
import { handle } from "../command";
import { BulkArray, BulkError, SimpleString } from "../helper";

export async function exec(arg: string[], client: Client) {
  if (arg.length != 0) {
    return BulkError("ERR must use 0 parameters");
  }
  if (!client.isTransaction) {
    return BulkError("ERR EXEC without MULTI");
  }
  if (client.TransactionArray.length == 0) {
    client.isTransaction = false;
    return BulkArray([], false);
  }
  client.isTransaction = false;
  let response: string[] = [];
  for (let i = 0; i < client.TransactionArray.length; i++) {
    response.push(
      (await handle(
        client.TransactionArray[i].arg,
        client.TransactionArray[i].command,
        client,
      )) || "",
    );
  }

  return SimpleString(BulkArray(response, false));
}
