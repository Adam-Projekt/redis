import { mem } from "../state";
import { getActiveMem } from "../class";
import { BulkError, SimpleString } from "../helper";
import { ErrorMessages } from "../error";

export function type(arg: string[]) {
  if (arg.length != 1) {
    return BulkError(ErrorMessages.MUST_USE_ONE_PARAM);
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
