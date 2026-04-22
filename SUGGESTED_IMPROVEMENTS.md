# Suggested Improvements & Refactoring Templates

## 1. Error Messages Standardization

### File: `app/error-messages.ts`

```typescript
/**
 * Centralized error messages for consistency across commands
 */

export const ErrorMessages = {
  // Argument count errors
  WRONG_ARG_COUNT: (cmd: string, expected?: number) => {
    if (expected) {
      return `ERR wrong number of arguments for '${cmd.toLowerCase()}' command, expected ${expected}`;
    }
    return `ERR wrong number of arguments for '${cmd.toLowerCase()}' command`;
  },

  // Type errors
  WRONG_TYPE: "WRONGTYPE Operation against a key holding the wrong kind of value",
  NOT_INTEGER: "ERR value is not an integer or out of range",
  NOT_FLOAT: "ERR value is not a valid float",
  NOT_NUMBER: "ERR value is not a valid number",

  // Command-specific
  SYNTAX_ERROR: "ERR syntax error",
  INVALID_EXPIRE_TIME: "ERR invalid expire time in set",
  INVALID_TIMEOUT: "ERR timeout is not a float or out of range",
  INVALID_DB_INDEX: "ERR invalid DB index",

  // Options
  NX_XX_CONFLICT: "ERR XX and NX options at the same time are not compatible",
  INCR_MULTIPLE_PAIRS: "ERR INCR option supports a single increment-element pair",
  WATCH_IN_MULTI: "ERR WATCH inside MULTI is not allowed",

  // Auth
  NO_AUTH: "NOAUTH Authentication required.",
  INVALID_PASSWORD: "ERR invalid password",
  USER_DISABLED: "ERR user is disabled",
  BLOCKED_CLIENT: "ERR client is blocked",

  // Infinity
  INFINITE_RESULT: "ERR increment would produce an infinite result",
};

export function formatError(template: string, ...args: any[]): string {
  return template.replace(/{}/g, () => String(args.shift()));
}
```

---

## 2. Data Type Enumeration

### File: `app/data-types.ts`

```typescript
/**
 * Unified data type constants to replace magic numbers
 */







export function isValidDataType(type: number): type is DataType {
  return type in DataType;
}
```

### Usage in code:

```typescript
// Before:
new Mem([value], 1, undefined);
if (key3?.WhatData !== 1) {
  return BulkError("WRONGTYPE");
}

// After:
import { DataType } from "./data-types";

new Mem([value], DataType.LIST, undefined);
if (key3?.WhatData !== DataType.LIST) {
  return BulkError(ErrorMessages.WRONG_TYPE);
}
```

---

## 3. Input Validation Utilities

### File: `app/validators.ts`

```typescript
import { DataType } from "./data-types";
import { ErrorMessages } from "./error-messages";
import { BulkError, BulkString } from "./helper";
import { getActiveMem, Mem } from "./class";

/**
 * Argument count validation
 */
export function validateArgCount(
  args: string[],
  expected: number | { min: number; max?: number },
  commandName: string,
): string | null {
  const actualCount = args.length;
  let isValid = false;

  if (typeof expected === "number") {
    isValid = actualCount === expected;
  } else {
    isValid = actualCount >= expected.min;
    if (expected.max !== undefined) {
      isValid = isValid && actualCount <= expected.max;
    }
  }

  if (!isValid) {
    return BulkError(ErrorMessages.WRONG_ARG_COUNT(commandName));
  }

  return null;
}

/**
 * Score parsing with support for infinity
 */
export interface ParseScoreResult {
  score: number;
  error?: undefined;
}

export interface ScoreParseError {
  score?: undefined;
  error: string;
}

export function parseScore(
  scoreStr: string,
): ParseScoreResult | ScoreParseError {
  const upper = scoreStr.toUpperCase();

  if (upper === "+INF" || upper === "INF") {
    return { score: Infinity };
  }
  if (upper === "-INF") {
    return { score: -Infinity };
  }

  const score = parseFloat(scoreStr);
  if (!Number.isFinite(score)) {
    return { error: BulkError(ErrorMessages.NOT_FLOAT) };
  }

  return { score };
}

/**
 * Integer parsing with range validation
 */
export function parseInteger(
  value: string,
  min?: number,
  max?: number,
): { value: number } | { error: string } {
  if (!/^-?\d+$/.test(value)) {
    return { error: BulkError(ErrorMessages.NOT_INTEGER) };
  }

  const num = parseInt(value, 10);

  if (min !== undefined && num < min) {
    return { error: BulkError(ErrorMessages.NOT_INTEGER) };
  }
  if (max !== undefined && num > max) {
    return { error: BulkError(ErrorMessages.NOT_INTEGER) };
  }

  return { value: num };
}

/**
 * Data type validation
 */
export function validateDataType(
  mem: Mem | undefined,
  expectedType: DataType,
): { valid: true } | { valid: false; error: string } {
  if (!mem) {
    return { valid: true }; // Key doesn't exist, that's fine
  }

  if (mem.WhatData !== expectedType) {
    return { valid: false, error: BulkError(ErrorMessages.WRONG_TYPE) };
  }

  return { valid: true };
}

/**
 * Key existence validation
 */
export function requireKeyExists(
  mem: Mem | undefined,
  keyName: string = "key",
): { exists: true; mem: Mem } | { exists: false; error: string } {
  if (!mem) {
    return {
      exists: false,
      error: BulkError(`ERR ${keyName} does not exist`),
    };
  }

  return { exists: true, mem };
}

/**
 * Score increment validation
 */
export function validateScoreIncrement(
  baseScore: number,
  increment: number,
): { valid: true; newScore: number } | { valid: false; error: string } {
  const newScore = baseScore + increment;

  if (!Number.isFinite(newScore)) {
    return { valid: false, error: BulkError(ErrorMessages.INFINITE_RESULT) };
  }

  return { valid: true, newScore };
}
```

---

## 4. Refactored ZADD using utilities

### File: `app/commands/sorted_sets/zadd.ts` (Refactored)

```typescript
import { getActiveMem, Mem, Score } from "../../class";
import { BulkError, BulkInteger, BulkString } from "../../helper";
import { mem } from "../../state";
import { markKeyModified } from "../../keyspace";
import { DataType } from "../../data-types";
import { ErrorMessages } from "../../error-messages";
import { validateArgCount, parseScore } from "../../validators";

interface ZAddOptions {
  nx: boolean;
  xx: boolean;
  ch: boolean;
  incr: boolean;
}

/**
 * ZADD key [NX|XX] [CH] [INCR] score member [score member ...]
 *
 * Adds members to a sorted set with scores.
 * @returns count of added elements (or changed if CH),