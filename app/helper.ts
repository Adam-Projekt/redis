const CRLF = "\r\n";

export function BulkString(input) {
  if (input == undefined) {
    return "$-1" + CRLF;
  }
  return "$" + input.length + CRLF + input + CRLF;
}
export function SimpleString(input: string) {
  return "+" + input + CRLF;
}
export function BulkArray(input: string[], connect: boolean = true) {
  let arrays: string = "";
  if (connect) {
    for (let i = 0; i < input.length; i++) {
      arrays += BulkString(input[i]);
    }
  } else {
    arrays = input.join("");
  }

  return "*" + input.length + CRLF + arrays;
}

export async function generateSHA256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);

  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
}
export function BulkError(input: string) {
  return "-" + input + CRLF;
}
