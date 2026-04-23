import { BulkError, SimpleString } from "../../helper";
import { Client } from "../../class";
import { ErrorMessages } from "../../error";

export function multi(arg: string[], client: Client) {
  if (arg.length != 0) {
    return BulkError(ErrorMessages.MUST_USE_ZERO_PARAMS);
  }
  client.isTransaction = true;

  return SimpleString("OK");
}
