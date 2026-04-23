import { BulkError, SimpleString } from "../../helper";
import type { Client } from "../../class";
import { ErrorMessages } from "../../error";

export function watch(arg: string[], client: Client) {
  if (arg.length < 1) {
    return BulkError(ErrorMessages.MUST_USE_AT_LEAST_ONE);
  }
  client.watchKeys(arg);
  return SimpleString("OK");
}
