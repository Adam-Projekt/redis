import { BulkString, BulkError, NULLBULKSTRING, BulkInteger } from "../helper";
import { mem } from "../state";
import { getActiveMem, Mem } from "../class";
import { markKeyModified } from "../keyspace";

export function incr(arg: string[]) {
  if (arg.length != 1) {
    return BulkError("ERR must use 1 parameters");
  }
  const data = getActiveMem(mem, arg[0]);
  const key = arg[0];
  if (data == undefined) {
    //key doesnt exist
    mem.set(key, new Mem(["1"], 0));
    markKeyModified(key);
    return BulkInteger(1);
  }
  if (data.WhatData != 0) {
    return BulkError("WRONGTYPE");
  }

  let num = Number(data.data[0]);
  if (!Number.isInteger(num)) {
    return BulkError("ERR value is not an integer or out of range");
  }
  num++;
  data.data[0] = num.toString();
  markKeyModified(key);
  return BulkInteger(num);
}
