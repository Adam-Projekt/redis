import type { Client } from "../../class";
import { BulkError, SimpleString } from "../../helper";

export function unwatch(arg: string[], client: Client) {
  client.clearWatch();
  return SimpleString("OK");
}
