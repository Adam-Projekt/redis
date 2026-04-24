export const ErrorMessages = {
  // Argument count errors
  WRONG_ARG_COUNT: (cmd: string, expected?: number) => {
    if (expected) {
      return `ERR wrong number of arguments for '${cmd.toLowerCase()}' command, expected ${expected}`;
    }
    return `ERR wrong number of arguments for '${cmd.toLowerCase()}' command`;
  },

  // Type errors
  WRONG_TYPE:
    "WRONGTYPE Operation against a key holding the wrong kind of value",
  NOT_INTEGER: "ERR value is not an integer or out of range",
  NOT_FLOAT: "ERR value is not a valid float",
  NOT_NUMBER: "ERR value is not a valid number",

  // Command-specific
  SYNTAX_ERROR: "ERR syntax error",
  INVALID_EXPIRE_TIME: "ERR invalid expire time in set",
  INVALID_TIMEOUT: "ERR timeout is not a float or out of range",
  INVALID_DB_INDEX: "ERR invalid DB index",
  TOO_BIG_TRANSATION: "ERR transaction to big",

  // Options
  NX_XX_CONFLICT: "ERR XX and NX options at the same time are not compatible",
  INCR_MULTIPLE_PAIRS:
    "ERR INCR option supports a single increment-element pair",
  WATCH_IN_MULTI: "ERR WATCH inside MULTI is not allowed",

  // Auth
  NO_AUTH: "WRONGPASS NOAUTH Authentication required.",
  INVALID_PASSWORD: "WRONGPASS invalid password",
  WRONGPASS: "WRONGPASS invalid username-password pair",
  USER_DISABLED: "ERR user is disabled",
  BLOCKED_CLIENT: "ERR client is blocked",
  INVALID_USERNAME: "WRONGPASS invalid username",

  // Infinity
  INFINITE_RESULT: "ERR increment would produce an infinite result",

  // Parameter validation
  NOT_ENOUGH_PARAMS: "ERR not enough parameters",
  MUST_USE_ZERO_PARAMS: "ERR must use 0 parameters",
  MUST_USE_AT_LEAST_ONE: "ERR must use at least 1 parameter",
  MUST_USE_ONE_PARAM: "ERR must use 1 parameters",
  INCR_REQUIRES_VALID_MEMBER: "ERR INCR option requires a valid member",
  DISCARD_WITHOUT_MULTI: "ERR DISCARD without MULTI",
  EXEC_WITHOUT_MULTI: "ERR EXEC without MULTI",
};
