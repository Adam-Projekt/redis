import type { Client } from "../../class";
import { ErrorMessages } from "../../error";
import { BulkArray, BulkInteger, BulkString } from "../../helper";

export function subscribe(arg: string[], client: Client) {
  if (arg.length != 1) {
    return BulkString(ErrorMessages.WRONG_ARG_COUNT("subscribe", 1));
  }
  const key = arg[0];
  if (!client.subscribeTo.includes(key)) {
    client.subscribeTo.push(key);
  }
  client.subscribeMode = true;

  return BulkArray(
    [
      BulkString("subscribe"),
      BulkString(key),
      BulkInteger(client.subscribeTo.length),
    ],
    false,
  );
}
