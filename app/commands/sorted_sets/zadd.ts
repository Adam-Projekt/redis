import { getActiveMem, Mem, Score } from "../../class";
import { BulkError, BulkInteger, BulkString } from "../../helper";
import { mem } from "../../state";
import { markKeyModified } from "../../keyspace";

export function zadd(arg: string[]) {
  // ZADD key [NX|XX] [CH] [INCR] score member [score member ...]

  if (arg.length < 3) {
    return BulkError("ERR wrong number of arguments for 'zadd' command");
  }

  const key = arg[0];
  let argIndex = 1;

  // Parse options
  let useNX = false; // Only add new members
  let useXX = false; // Only update existing members
  let useCH = false; // Return changed count instead of added count
  let useINCR = false; // Increment score instead of setting

  // Parse all flags
  while (argIndex < arg.length) {
    const option = arg[argIndex].toUpperCase();

    if (option === "NX") {
      useNX = true;
      argIndex++;
    } else if (option === "XX") {
      useXX = true;
      argIndex++;
    } else if (option === "CH") {
      useCH = true;
      argIndex++;
    } else if (option === "INCR") {
      useINCR = true;
      argIndex++;
    } else {
      // Not a flag, must be score
      break;
    }
  }

  // Validate conflicting options
  if (useNX && useXX) {
    return BulkError(
      "ERR XX and NX options at the same time are not compatible",
    );
  }

  // Check we have at least one score-member pair
  const remainingArgs = arg.length - argIndex;
  if (remainingArgs < 2 || remainingArgs % 2 !== 0) {
    return BulkError("ERR wrong number of arguments for 'zadd' command");
  }

  // Get or create sorted set
  let sortedSet = getActiveMem(mem, key);

  if (sortedSet !== undefined && sortedSet.WhatData !== 2) {
    return BulkError(
      "WRONGTYPE Operation against a key holding the wrong kind of value",
    );
  }

  if (sortedSet === undefined) {
    sortedSet = new Mem([], 2, []);
    mem.set(key, sortedSet);
  }

  let addedCount = 0;
  let changedCount = 0;
  let lastScore: number | null = null;

  // Process each score-member pair
  for (let i = argIndex; i < arg.length; i += 2) {
    const scoreStr = arg[i];
    const member = arg[i + 1];

    // Validate and parse score
    let score: number;
    const upperScore = scoreStr.toUpperCase();

    if (upperScore === "+INF" || upperScore === "INF") {
      score = Infinity;
    } else if (upperScore === "-INF") {
      score = -Infinity;
    } else {
      score = parseFloat(scoreStr);
      if (!Number.isFinite(score)) {
        return BulkError("ERR value is not a valid float");
      }
    }

    // Find existing member
    const existingIndex = sortedSet.sorted_sets!.findIndex(
      (s) => s.stringValue === member,
    );

    const memberExists = existingIndex !== -1;

    if (useNX && memberExists) {
      // NX: skip if member exists
      continue;
    }

    if (useXX && !memberExists) {
      // XX: skip if member doesn't exist
      continue;
    }

    if (useINCR) {
      // INCR mode: only one score-member pair allowed
      if (remainingArgs !== 2) {
        return BulkError(
          "ERR INCR option supports a single increment-element pair",
        );
      }

      if (memberExists) {
        const oldScore = sortedSet.sorted_sets![existingIndex].score;
        const newScore = oldScore + score;

        if (!Number.isFinite(newScore)) {
          return BulkError("ERR increment would produce an infinite result");
        }

        sortedSet.sorted_sets![existingIndex].score = newScore;
        lastScore = newScore;
      } else {
        sortedSet.sorted_sets!.push(new Score(score, member));
        lastScore = score;
      }
    } else {
      // Normal ZADD mode
      if (memberExists) {
        const oldScore = sortedSet.sorted_sets![existingIndex].score;
        const newScore = score;

        if (oldScore !== newScore) {
          sortedSet.sorted_sets![existingIndex].score = newScore;
          changedCount++;
        }
      } else {
        sortedSet.sorted_sets!.push(new Score(score, member));
        addedCount++;
        changedCount++;
      }
    }
  }

  // Sort by score
  sortedSet.sorted_sets!.sort((a, b) => a.score - b.score);

  markKeyModified(key);

  // Return appropriate value based on options
  if (useINCR) {
    // Return the new score as a bulk string
    if (lastScore === null) {
      return BulkError("ERR INCR option requires a valid member");
    }
    return BulkString(lastScore.toString());
  } else if (useCH) {
    // Return number of changed elements (added + updated)
    return BulkInteger(changedCount);
  } else {
    // Default: return number of added elements
    return BulkInteger(addedCount);
  }
}
