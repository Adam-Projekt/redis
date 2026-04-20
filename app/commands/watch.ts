import { mem } from "../command-handler";
import { getActiveMem } from "../class";
import { BulkError, SimpleString } from "../helper";
export function watch(arg: string[]) {
  if (arg.length != 1) {
    return BulkError("ERR must use 1 parameters");
  }
  return SimpleString("OK");
}
