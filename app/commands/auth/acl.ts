import { Client, User } from "../../class";
import { users } from "../../command-handler";
import {
  BulkArray,
  BulkError,
  BulkString,
  generateSHA256,
  GetIndex,
  SimpleString,
} from "../../helper";

export async function acl(arg: string[], client: Client) {
  let username = arg[1];
  let user: User = users[0];
  let index;
  const subcommand = arg[0].toUpperCase();
  switch (subcommand) {
    case "WHOAMI":
      const data = client.user?.name || "default";
      return BulkString(data);
    case "GETUSER":
      index = users.findIndex((person) => person.name === username);
      if (index >= 0) {
        user = users[index];
        console.log(user);
      } else {
        return SimpleString("User not found");
      }
      const array = BulkArray(
        [
          BulkString("flags"),
          BulkArray(user.flagArray),
          BulkString("passwords"),
          BulkArray(user.passwordArray),
        ],
        false,
      );
      return array;
    case "SETUSER":
      index = users.findIndex((person) => person.name === username);
      if (index >= 0) {
        user = users[index];
        console.log(user);
      } else {
        return SimpleString("User not found");
        break;
      }
      let Parametrs: string = arg[2];
      if (Parametrs.startsWith(">")) {
        let password = Parametrs.slice(1);
        password = await generateSHA256(password);
        user.passwordArray.push(password);

        const len = GetIndex("nopass", user.flagArray);
        if (len !== -1) {
          user.flagArray.splice(len, 1);
        }
      }
      return SimpleString("OK");
    default:
      return BulkString("Command not found");
  }
}
