import { BulkString, BulkError, NULLBULKSTRING, BulkInteger } from "../helper";
import { mem } from "../command-handler";
import { getActiveMem } from "../class";

export function incr(arg: string[]) {
  if (arg.length != 1) {
    return BulkError("ERR must use 1 parameters");
  }
  const key = getActiveMem(mem, arg[0]);
  if (key == undefined) {
    //key doesnt exist
    return;
  }
  if (key.WhatData != 0) {
    return BulkError("WRONGTYPE");
  }
  let num = Number(key.data[0]);
  num++;
  key.data[0] = num.toString();
  return BulkInteger(num);
}
