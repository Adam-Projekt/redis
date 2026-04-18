import { createHash } from "crypto";

const CRLF = "\r\n";

export function BulkString(input: string) {
  if (input == undefined) {
    return "$-1" + CRLF;
  }
  return "$" + input.length + CRLF + input + CRLF;
}
export function SimpleString(input: string) {
  return "+" + input + CRLF;
}
export function BulkArray(input: string[]) {
  let arrays = input.join("");
  return "*" + input.length + CRLF + arrays;
}

export function generateSHA256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
