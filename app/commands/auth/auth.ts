import type { Client } from "../../class";
import { ErrorMessages } from "../../error";
import { BulkError, generateSHA256, SimpleString } from "../../helper";
import { users } from "../../state";

export async function auth(arg: string[], client: Client) {
  if (arg.length < 1) {
    return BulkError(ErrorMessages.WRONG_ARG_COUNT(arg.length.toString(), 2));
  }
  let username = arg[0];
  const InputPassword = await generateSHA256(arg[1] || "");

  let user;
  let index = users.findIndex((person) => person.name === username);
  if (index >= 0) {
    user = users[index];
    console.log(user);
  } else {
    return BulkError(ErrorMessages.INVALID_USERNAME);
  } //BulkError
  const PasswordArray = user.passwordArray;
  let result = PasswordArray.findIndex((a) => a === InputPassword);

  if ((result !== -1 || user.flagArray.includes("nopass")) && user.enable) {
    client.authenticated = true;
    client.user = user;
    return SimpleString("OK");
  } else {
    return BulkError(ErrorMessages.INVALID_USERNAME);
  }
}
