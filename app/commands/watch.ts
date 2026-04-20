import { BulkError, SimpleString } from "../helper";
import type { Client } from "../class";

export function watch(arg: string[], client: Client) {
  if (arg.length < 1) {
    return BulkError("ERR must use at least 1 parameter");
  }

  client.watchKeys(arg);
  return SimpleString("OK");
}
