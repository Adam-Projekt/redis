import { BulkString, BulkError, NULLBULKSTRING } from "../../helper";
import { mem } from "../../state";
import { getActiveMem } from "../../class";
import { DataType } from "../../enum";
import { ErrorMessages } from "../../error";

export function get(arg: string[]) {
  if (arg.length != 1) {
    return BulkError(ErrorMessages.WRONG_ARG_COUNT("get", 1));
  }
  const data = getActiveMem(mem, arg[0]);
  if (!data) {
    return NULLBULKSTRING;
  }

  if (data.WhatData !== DataType.STRING) {
    return BulkError(ErrorMessages.WRONG_TYPE);
  }
  return BulkString(data.data[0] || undefined);
}
