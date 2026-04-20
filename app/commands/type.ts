import { mem } from "../command-handler";
import { getActiveMem } from "../class";
import { BulkError, SimpleString } from "../helper";
export function type(arg: string[]) {
  if (arg.length != 1) {
    return BulkError("ERR must use 1 parameters");
  }
  const key = getActiveMem(mem, arg[0]);
  let type: string;

  switch (key?.WhatData) {
    case 0:
      type = "string";
      break;
    case 1:
      type = "list";
      break;
    default:
      type = "none";
      break;
  }
  return SimpleString(type);
}
