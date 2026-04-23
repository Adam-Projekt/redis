import { getActiveMem } from "../../class";
import { BulkError, BulkInteger } from "../../helper";
import { ErrorMessages } from "../../error";
import { mem } from "../../state";

export function llen(arg: string[]) {
  const arr = getActiveMem(mem, arg[0]);
  if (arr == undefined) {
    return BulkInteger(0);
  }
  if (arr?.WhatData !== 1) {
    return BulkError(ErrorMessages.WRONG_TYPE);
  }

  return BulkInteger(arr.data.length);
}
