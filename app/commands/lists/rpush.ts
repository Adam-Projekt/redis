import { serveBlockedClients } from "../../blocking";
import { getActiveMem, Mem } from "../../class";
import { mem } from "../../state";
import { BulkError, BulkInteger } from "../../helper";
import { markKeyModified } from "../../keyspace";
import { ErrorMessages } from "../../error";

export function rpush(arg: string[]) {
  if (arg.length < 1) {
    return BulkError(ErrorMessages.NOT_ENOUGH_PARAMS);
  }
  const key = arg[0];
  let list = getActiveMem(mem, key);

  for (let i = 1; i < arg.length; i++) {
    const value = arg[i];
    if (list) {
      if (list.WhatData !== 1) {
        return BulkError(ErrorMessages.WRONG_TYPE);
      }
      list.data.push(value);
    } else {
      list = new Mem([value], 1);
      mem.set(key, list);
    }
  }
  const rpushLength = getActiveMem(mem, key)?.data.length || 0;
  markKeyModified(key);
  serveBlockedClients(mem, key);
  return BulkInteger(rpushLength); //Rpush
}
