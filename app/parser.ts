export function parseRESP(data: Buffer | string) {
  const readBuffer = typeof data === "string" ? data : data.toString();

  if (readBuffer.length === 0) {
    return [];
  }

  const result: string[] = [];
  let i = 0;
  const n = readBuffer.length;

  while (i < n) {
    const completeItems = result.length;

    if (readBuffer[i] !== "*") {
      throw new Error("Expected RESP array");
    }

    i++;

    let countStr = "";
    while (i < n && readBuffer[i] !== "\r") {
      countStr += readBuffer[i++];
    }

    if (i + 1 >= n) {
      return result.slice(0, completeItems);
    }

    if (readBuffer.slice(i, i + 2) !== "\r\n" || !/^\d+$/.test(countStr)) {
      throw new Error("Invalid RESP format");
    }

    i += 2;

    const count = Number.parseInt(countStr, 10);

    for (let k = 0; k < count; k++) {
      if (i >= n) {
        return result.slice(0, completeItems);
      }

      if (readBuffer[i] !== "$") {
        throw new Error("Expected Bulk String");
      }

      i++;

      let lenStr = "";
      while (i < n && readBuffer[i] !== "\r") {
        lenStr += readBuffer[i++];
      }

      if (i + 1 >= n) {
        return result.slice(0, completeItems);
      }

      if (readBuffer.slice(i, i + 2) !== "\r\n" || !/^\d+$/.test(lenStr)) {
        throw new Error("Invalid RESP format");
      }

      i += 2;

      const len = Number.parseInt(lenStr, 10);

      if (i + len + 2 > n) {
        return result.slice(0, completeItems);
      }

      result.push(readBuffer.slice(i, i + len));
      i += len;

      if (readBuffer.slice(i, i + 2) !== "\r\n") {
        throw new Error("Invalid RESP format");
      }

      i += 2;
    }
  }

  return result;
}
