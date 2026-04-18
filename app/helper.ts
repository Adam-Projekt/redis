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
  let arrays = "";
  input.forEach((index) => {
    arrays = arrays + input[Number(index)];
  });
  return "*" + input.length + CRLF + arrays;
}
