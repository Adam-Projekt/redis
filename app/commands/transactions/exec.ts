import { Client } from "../../class";
import { Commands } from "../../enum";
import { BulkArray, BulkError, NULLBULKARRAY } from "../../helper";
import { ErrorMessages } from "../../error";

export async function exec(
  arg: string[],
  client: Client,
  runCommand: (
    arg: string[],
    command: Commands,
    client: Client,
  ) => Promise<string>,
) {
  if (arg.length != 0) {
    return BulkError(ErrorMessages.MUST_USE_ZERO_PARAMS);
  }
  if (!client.isTransaction) {
    return BulkError(ErrorMessages.EXEC_WITHOUT_MULTI);
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
      (await runCommand(queue[i].arg, queue[i].command, client)) || "",
    );
  }
  client.clearWatch();

  return BulkArray(response, false);
}
