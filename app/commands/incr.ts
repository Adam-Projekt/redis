import { BulkString, BulkError, NULLBULKSTRING, BulkInteger } from "../helper";
import { mem } from "../command-handler";
import { getActiveMem, Mem } from "../class";

export function incr(arg: string[]) {
  if (arg.length != 1) {
    return BulkError("ERR must use 1 parameters");
  }
  const data = getActiveMem(mem, arg[0]);
  const key = arg[0];
  if (data == undefined) {
    //key doesnt exist
    mem.set(key, new Mem(["1"], 0));
    return BulkInteger(1);
  }
  if (data.WhatData != 0) {
    return BulkError("WRONGTYPE");
  }
  if (Number.isNaN(data.data[0])) {
    return BulkError("ERR value is not an integer or out of range");
  }
  let num = Number(data.data[0]);
  num++;
  data.data[0] = num.toString();
  return BulkInteger(num);
}
