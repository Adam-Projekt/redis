import { ErrorMessages } from "../../error";
import { BulkArray, BulkString } from "../../helper";

export function subscribe(arg: string[]) {
  if (arg.length != 1) {
    return BulkString(ErrorMessages.WRONG_ARG_COUNT("subscribe", 1));
  }
  const key = arg[0];
  return BulkArray([BulkString("subscribe"), BulkString(key)], false);
}
