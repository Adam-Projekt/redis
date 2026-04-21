import { Client, User } from "../../class";
import { users } from "../../state";
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
    case "USERS":
      const userList = users.map((person) => BulkString(person.name));
      return BulkArray(userList, false);
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
        //create user
        users.push(new User(username, [], []));
        user = users[users.length - 1];
      }
      if (arg.length > 2) {
        let Parametrs: string = arg[2];
        if (Parametrs.startsWith(">")) {
          let password = Parametrs.slice(1);
          password = await generateSHA256(password);
          user.passwordArray.push(password);

          const len = GetIndex("nopass", user.flagArray);
          if (len !== -1) {
            user.flagArray.splice(len, 1);
          }
        } else if (Parametrs.toUpperCase() == "RESET") {
          user.reset();
        } else if (Parametrs.startsWith("<")) {
          let password = Parametrs.slice(1);
          password = await generateSHA256(password);
          let include = user.passwordArray.indexOf(password);
          if (include != -1) {
            user.passwordArray.splice(include, 1);
          }

          const len = GetIndex("nopass", user.flagArray);
          if (len !== -1) {
            user.flagArray.splice(len, 1);
          }
        } else if (Parametrs.toUpperCase() == "ON") {
          user.enable = true;
        } else if (Parametrs.toUpperCase() == "OFF") {
          user.enable = false;
        } else if (Parametrs.toUpperCase() == "NOPASS") {
          if (!user.flagArray.includes("nopass")) {
            user.flagArray.push("nopass");
          }
        }
      }

      return SimpleString("OK");
    default:
      return BulkString("Command not found");
  }
}
