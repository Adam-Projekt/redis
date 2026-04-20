import { BulkArray } from "../../helper";
import { dbfilename, dir } from "../../main";

export function config(arg: string[]) {
  const arg1 = arg[0].toUpperCase();
  const arg2 = arg[1].toUpperCase();

  let key = "";
  let value = "";
  if (arg1 == "GET") {
    if (arg2 == "DIR") {
      key = "dir";
      value = dir;
    } else if (arg2 == "DBFILENAME") {
      key = "dbfilename";
      value = dbfilename;
    }
  }
  return BulkArray([key, value]);
}
