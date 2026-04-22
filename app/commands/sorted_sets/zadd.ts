import { getActiveMem, Mem, Score } from "../../class";
import { BulkError, BulkInteger } from "../../helper";
import { mem, users } from "../../state";

export function zaad(arg: string[]) {
  if (arg.length < 3) {
    return BulkError("ERR must use 1 parameters");
  }
  let number = 1;
  const key = arg[0];
  const score = Number(arg[1]);
  const value = arg[2];
  if (getActiveMem(mem, key) == undefined) {
    const MemValue = new Mem(undefined, 2, [new Score(score, value)]);
    mem.set(key, MemValue);
    number++;
  }

  return BulkInteger(number);
}
