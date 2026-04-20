import { BulkError, NULLBULKSTRING, SimpleString } from "../../helper";
import { mem } from "../../command-handler";
import { getActiveMem, Mem } from "../../class";
import { markKeyModified } from "../../keyspace";

export function set(arg: string[]) {
  if (arg.length < 2) {
    return BulkError("ERR not enough parameters");
  }
  const key = arg[0];
  const value = arg[1];

  let px_index = -1; //expire in miliseconds
  let ex_index = -1; //expire in seconds
  let include_nx = false; //create only if not exist

  for (let i = 0; i < arg.length; i++) {
    if (arg[i].toUpperCase() == "PX" && i > 1) {
      px_index = i;
    } else if (arg[i].toUpperCase() == "EX" && i > 1) {
      ex_index = i;
    } else if (arg[i].toUpperCase() == "NX" && i > 1) {
      include_nx = true;
    }
  }

  let ttlMs: number | null = null;
  if (px_index != -1) {
    ttlMs = Number(arg[px_index + 1]);
  } else if (ex_index != -1) {
    ttlMs = Number(arg[ex_index + 1]) * 1000;
  }

  if (ttlMs !== null && (!Number.isFinite(ttlMs) || ttlMs <= 0)) {
    return BulkError("ERR invalid expire time");
  }

  const existing = getActiveMem(mem, key);
  if (existing && include_nx) {
    //check if exist and create only if not exist is true
    return NULLBULKSTRING;
  }

  existing?.clearExpiry();

  const entry = new Mem([value], 0);
  if (ttlMs !== null) {
    entry.scheduleExpiry(key, mem, ttlMs);
  }

  mem.set(key, entry); // set the value
  markKeyModified(key);

  return SimpleString("OK");
}
