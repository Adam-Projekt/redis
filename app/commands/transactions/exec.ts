import { Client } from "../../class";
import { handle } from "../../command";
import { BulkArray, BulkError, NULLBULKARRAY } from "../../helper";

export async function exec(arg: string[], client: Client) {
  if (arg.length != 0) {
    return BulkError("ERR must use 0 parameters");
  }
  if (!client.isTransaction) {
    return BulkError("ERR EXEC without MULTI");
  }
  client.isTransaction = false;
  if (client.hasDirtyWatchedKeys()) {
    client.TransactionArray = [];
    client.clearWatch();
    return NULLBULKARRAY;
  }

  const queue = client.TransactionArray;
  client.TransactionArray = [];

  if (queue.length == 0) {
    client.clearWatch();
    return BulkArray([], false);
  }

  let response: string[] = [];
  for (let i = 0; i < queue.length; i++) {
    response.push(
      await handle(
        queue[i].arg,
        queue[i].command,
        client,
      ) || "",
    );
  }
  client.clearWatch();

  return BulkArray(response, false);
}
