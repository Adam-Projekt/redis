import { getActiveMem, Mem, Score } from "../../class";
import { BulkError, BulkInteger, BulkString } from "../../helper";
import { mem } from "../../state";
import { markKeyModified } from "../../keyspace";
import { ErrorMessages } from "../../error";

export function zadd(arg: string[]) {

  if (arg.length < 3) {
    return BulkError(ErrorMessages.WRONG_ARG_COUNT("zadd", 3));
  }

  const key = arg[0];
  let argIndex = 1;

  let useNX = false; // Only add new members
  let useXX = false; // Only update existing members
  let useCH = false; // Return changed count instead of added count
  let useINCR = false; // Increment score instead of setting

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
    return BulkError(ErrorMessages.NX_XX_CONFLICT);
  }

  const remainingArgs = arg.length - argIndex;
  if (remainingArgs < 2 || remainingArgs % 2 !== 0) {
    return BulkError(ErrorMessages.WRONG_ARG_COUNT("zadd", 3));
  }

  let sortedSet = getActiveMem(mem, key);

  if (sortedSet !== undefined && sortedSet.WhatData !== 2) {
    return BulkError(ErrorMessages.WRONG_TYPE);
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
        return BulkError(ErrorMessages.NOT_FLOAT);
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
        return BulkError(ErrorMessages.INCR_MULTIPLE_PAIRS);
      }

      if (memberExists) {
        const oldScore = sortedSet.sorted_sets![existingIndex].score;
        const newScore = oldScore + score;

        if (!Number.isFinite(newScore)) {
          return BulkError(ErrorMessages.INFINITE_RESULT);
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
      return BulkError(ErrorMessages.INCR_REQUIRES_VALID_MEMBER);
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
