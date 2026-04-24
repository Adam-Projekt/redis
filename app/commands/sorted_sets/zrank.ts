import { getActiveMem, Mem, Score } from "../../class";
import { BulkError, BulkInteger, BulkString } from "../../helper";
import { mem } from "../../state";
import { markKeyModified } from "../../keyspace";
import { ErrorMessages } from "../../error";

export function zadd(arg: string[]) {
  if (arg.length < 2) {
    return BulkError(ErrorMessages.WRONG_ARG_COUNT("zrank", 2));
  }

  const key = arg[0];
  const valuee = arg[1];
  let argIndex = 1;
}
