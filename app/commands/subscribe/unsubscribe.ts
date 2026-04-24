import type { Client } from "../../class";
import { ErrorMessages } from "../../error";
import { BulkArray, BulkInteger, BulkString } from "../../helper";



export function unsubscribe(arg: string[], client: Client) {
    if (arg.length != 1) {
      return BulkString(ErrorMessages.WRONG_ARG_COUNT("subscribe", 1));
    }
    const key = arg[0];
    if (!client.subscribeTo.includes(key)) {
      const index = client.subscribeTo.indexOf(key);
      client.subscribeTo.splice(index,1)
    }
    client.subscribeMode = true;

    return BulkArray(
      [
        BulkString("unsubscribe"),
        BulkString(key),
        BulkInteger(client.subscribeTo.length),
      ],
      false,
    );
  }
}
