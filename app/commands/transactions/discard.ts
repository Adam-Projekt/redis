import type { Client } from "../../class";
import { BulkError, SimpleString } from "../../helper";
import { ErrorMessages } from "../../error";

export function discard(arg: string[], client: Client): string {
  if (arg.length != 0) {
    return BulkError(ErrorMessages.MUST_USE_ZERO_PARAMS);
  }
  if (!client.isTransaction) {
    return BulkError(ErrorMessages.DISCARD_WITHOUT_MULTI);
  }
  client.isTransaction = false;
  client.TransactionArray = [];
  client.clearWatch();
  return SimpleString("OK");
}
