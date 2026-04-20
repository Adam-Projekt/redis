import type { Client } from "../class";
import { BulkError, SimpleString } from "../helper";

export function unwatch(arg: string[], client: Client) {
  if (arg.length < 1) {
    return BulkError("ERR must use at least 1 parameter");
  }

  client.clearWatch();
  return SimpleString("OK");
}
