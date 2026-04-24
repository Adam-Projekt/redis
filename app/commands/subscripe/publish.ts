import type { Client } from "../../class";
import { clients } from "../../clients";
import { ErrorMessages } from "../../error";
import { BulkInteger, BulkString } from "../../helper";

export function publish(arg: string[], client: Client): string {
  if (arg.length != 2) {
    return BulkString(ErrorMessages.WRONG_ARG_COUNT("subscribe", 1));
  }
  const channel = arg[0];
  const message = arg[1];
  let count = 0;
  for (let i = 0; i < clients.length; i++) {
    let c = clients[i];
    if (c.subscribeTo.includes(channel)) {
      count++;
    }
  }
  return BulkInteger(count);
}
