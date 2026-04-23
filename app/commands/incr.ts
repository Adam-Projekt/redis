import { BulkString, BulkError, NULLBULKSTRING, BulkInteger } from "../helper";
import { mem } from "../state";
import { getActiveMem, Mem } from "../class";
import { markKeyModified } from "../keyspace";
import { ErrorMessages } from "../error";
import { DataType } from "../enum";

export function incr(arg: string[]) {
  if (arg.length != 1) {
    return BulkError(ErrorMessages.WRONG_ARG_COUNT("incr", 1));
  }
  const data = getActiveMem(mem, arg[0]);
  const key = arg[0];
  if (data == undefined) {
    //key doesnt exist
    mem.set(key, new Mem(["1"], 0));
    markKeyModified(key);
    return BulkInteger(1);
  }
  if (data.WhatData != DataType.STRING) {
    return BulkError(ErrorMessages.WRONG_TYPE);
  }

  let num = Number(data.data[0]);
  if (!Number.isInteger(num)) {
    return BulkError(ErrorMessages.NOT_INTEGER);
  }
  num++;
  data.data[0] = num.toString();
  markKeyModified(key);
  return BulkInteger(num);
}
