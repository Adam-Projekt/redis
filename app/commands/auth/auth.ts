import type { Client } from "../../class";
import { BulkError, generateSHA256, SimpleString } from "../../helper";
import { users } from "../../state";

export async function auth(arg: string[], client: Client) {
  let username = arg[0];
  let user;
  let index = users.findIndex((person) => person.name === username);
  if (index >= 0) {
    user = users[index];
    console.log(user);
  } else {
    return BulkError(
      "WRONGPASS invalid username-password pair or user is disabled.",
    ); //BulkError
  }
  const InputPassword = await generateSHA256(arg[1]);
  const PasswordArray = user.passwordArray;
  let result = PasswordArray.findIndex((a) => a === InputPassword);

  if ((result !== -1 || user.flagArray.includes("nopass")) && user.enable) {
    client.authenticated = true;
    client.user = user;
    return SimpleString("OK");
  } else {
    return BulkError(
      "WRONGPASS invalid username-password pair or user is disabled.",
    ); // BulkError
  }
}
