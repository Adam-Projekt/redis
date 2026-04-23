import { mem } from "../../state";
import { getActiveMem, Mem } from "../../class";
import { BulkError, BulkInteger } from "../../helper";
import { ErrorMessages } from "../../error";
import { markKeyModified } from "../../keyspace";
import { serveBlockedClients } from "../../blocking";

export function lpush(arg: string[]) {
  if (arg.length < 1) {
    return BulkError(ErrorMessages.NOT_ENOUGH_PARAMS);
  }
  const key = arg[0];
  let list4 = getActiveMem(mem, key);

  for (let i = 1; i < arg.length; i++) {
    const value = arg[i];
    if (list4) {
      if (list4.WhatData !== 1) {
        return BulkError(ErrorMessages.WRONG_TYPE);
      }
      list4.data.unshift(value);
    } else {
      list4 = new Mem([value], 1, undefined);
      mem.set(key, list4);
    }
  }
  const lpushLength = getActiveMem(mem, key)?.data.length || 0;
  markKeyModified(key);
  serveBlockedClients(mem, key);
  console.log("finish");
  return BulkInteger(lpushLength);
}
