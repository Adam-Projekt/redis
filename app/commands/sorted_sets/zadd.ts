import { Mem } from "../../class";
import { BulkInteger } from "../../helper";
import { mem, users } from "../../state";

export function zaad(arg: string[]) {
  const key = arg[0];
  const score = Number(arg[1]);
  const value = arg[2];
  const memValue = new Mem()
  let number = 1;
  return BulkInteger(number);
}
