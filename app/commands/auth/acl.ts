import { Client } from "../../class";
import { users } from "../../command-handler";
import { BulkArray, BulkError, BulkString, SimpleString } from "../../helper";

export async function acl(arg: string[], client: Client) {
  let username = arg[1];
  if (arg.length == 0) {
    return BulkError("ERR no Parametrs");
  }
  const subcommand = arg[0].toUpperCase();
  switch (subcommand) {
    case "WHOAMI":
      const data = client.user?.name || "default";
      return BulkString(data);
    case "GETUSER":
      let user;
      const index = users.findIndex((person) => person.name === username);
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
      console.log(array + "dadss");
      return array;
      break;
    case "SETUSER":
      index = users.findIndex((person) => person.name === username);
      if (index >= 0) {
        user = users[index];
        console.log(user);
      } else {
        return SimpleString("User not found");
        break;
      }
      let Parametrs: string = getData(2);
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
