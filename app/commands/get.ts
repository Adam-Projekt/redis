import { BulkString, BulkError, NULLBULKSTRING } from "../helper";
import { mem } from "../command-handler";
import { getActiveMem } from "../class";

export function get(arg: string[]) {
  if (arg.length != 1) {
    return BulkError("ERR must use 1 parameters");
  }
  const data = getActiveMem(mem, arg[0]);
  if (!data) {
    return NULLBULKSTRING;
  }

  if (data.WhatData !== 0) {
    return BulkError("WRONGTYPE");
  }
  return BulkString(data.data[0] || undefined);
}
