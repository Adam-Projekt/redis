//my things
import {
  BulkString,
  SimpleString,
  BulkArray,
  generateSHA256,
  BulkError,
  BulkInteger,
  Contain,
  GetIndex,
  NULLBULKSTRING,
} from "./helper";
import { User, Mem, getActiveMem, Client } from "./class";
import { mem, users } from "./command-handler";
import { Commands } from "./commandEnum";
import { get } from "./commands/basic/get";
import { set } from "./commands/basic/set";
import { blockClient, serveBlockedClients, tryBlpop } from "./blocking";
import { type } from "./commands/type";
import { watch } from "./commands/transactions/watch";
import { incr } from "./commands/incr";
import { multi } from "./commands/transactions/multi";
import { exec } from "./commands/transactions/exec";
import { discard } from "./commands/transactions/discard";
import { unwatch } from "./commands/transactions/unwatch";
import { markKeyModified } from "./keyspace";
import { lpush } from "./commands/lists/lpush";
import { rpush } from "./commands/lists/rpush";
import { acl } from "./commands/auth/acl";

export async function handle(
  arg: string[],
  command: Commands,
  client: Client,
): Promise<string> {
  //helper function
  function getData(index: number) {
    if (index < arg.length) {
      return arg[index];
    } else return "";
  }

  let index;
  let username: string;
  let user;

  if (!client.authenticated && !(command == Commands.Auth)) {
    return BulkError("NOAUTH Authentication required.");
  }

  switch (command) {
    case Commands.Unwatch:
      return unwatch(arg, client);
    case Commands.Exec:
      return exec(arg, client);
    case Commands.Multi:
      return multi(arg, client);
    case Commands.Incr:
      return incr(arg);
    case Commands.Watch:
      return watch(arg, client);
    case Commands.Set:
      return set(arg);
    case Commands.Get:
      return get(arg);
    case Commands.Lpush:
      return lpush(arg);
    case Commands.Rpush:
      return rpush(arg);
    case Commands.Lrange:
      const key3 = getActiveMem(mem, getData(0));
      if (key3 == undefined) {
        return BulkArray([], false); //empty bulk array
      }
      if (key3?.WhatData !== 1) {
        return BulkError("WRONGTYPE");
      }
      const array = key3.data;

      let start: number = Number(getData(1));
      let stop: number = Number(getData(2));

      if (start < 0) {
        //implement neginative index
        start += array.length;
      }
      if (stop < 0) {
        //implement neginative index
        stop += array.length;
      }
      if (start >= array.length) {
        return BulkArray([], false); //empty bulk array
      }
      if (start > stop) {
        return BulkArray([], false); //empty bulk array
      }
      if (stop >= array.length) {
        stop = array.length - 1;
      }
      let response: string[] = [];
      for (let i = 0; i < array.length; i++) {
        if (i >= start && i <= stop) {
          response.push(array[i]);
        }
      }
      return BulkArray(response);
    case Commands.Llen:
      const arr = getActiveMem(mem, getData(0));
      if (arr == undefined) {
        return BulkInteger(0);
      }
      if (arr?.WhatData !== 1) {
        return BulkError("WRONGTYPE");
      }

      return BulkInteger(arr.data.length);

      break;
    case Commands.Lpop:
      const arra = getActiveMem(mem, getData(0));
      if (arra == undefined) {
        return NULLBULKSTRING;
      }
      if (arra?.WhatData !== 1) {
        return BulkError("WRONGTYPE");
      }

      if (arra.data.length == 0) {
        return NULLBULKSTRING;
      }
      let vari = 1;
      let response2: string[] = [];
      if (arg.length > 1) {
        vari = Number(arg[1]);
        for (let i = 0; i < vari; i++) {
          response2.push(arra.data[i]);
        }
      }
      response2[0] = arra.data[0];

      arra.data = arra.data.slice(vari);
      markKeyModified(getData(0));
      if (response2.length == 1) {
        return BulkString(response2[0]);
      } else {
        return BulkArray(response2);
      }

      break;
    case Commands.Blpop:
      const keys = arg.slice(0, arg.length - 1);
      const timeoutSeconds = Number(arg[arg.length - 1]);

      if (!Number.isFinite(timeoutSeconds) || timeoutSeconds < 0) {
        return BulkError("ERR timeout is not a float or out of range");
      }

      const blpopResult = tryBlpop(mem, keys);
      if (blpopResult.status === "wrongtype") {
        return BulkError("WRONGTYPE");
      }

      if (blpopResult.status === "value") {
        return BulkArray([blpopResult.key, blpopResult.value]);
      }

      blockClient(client, keys, timeoutSeconds);
      return "";
    case Commands.Discard:
      return discard(arg, client);
    case Commands.Type:
      return type(arg);
      break;
    case Commands.Acl:
      return await acl(arg, client);
    case Commands.Auth:
      username = getData(0);
      user;
      index = users.findIndex((person) => person.name === username);
      if (index >= 0) {
        user = users[index];
        console.log(user);
      } else {
        return BulkError(
          "WRONGPASS invalid username-password pair or user is disabled.",
        ); //BulkError
      }
      const InputPassword = await generateSHA256(getData(1));
      const PasswordArray = user.passwordArray;
      let result = PasswordArray.findIndex((a) => a === InputPassword);

      if (result !== -1 || user.flagArray.includes("nopass")) {
        client.authenticated = true;
        client.user = user;
        return SimpleString("OK");
      } else {
        return BulkError(
          "WRONGPASS invalid username-password pair or user is disabled.",
        ); // BulkError
      }
      break; //AUTH
    case Commands.Echo:
      return BulkString(getData(0));
      break; //Echo
    case Commands.Ping:
      return SimpleString("PONG");
      break; //PING //PING
    default:
      return "";
      break;
  }
}
