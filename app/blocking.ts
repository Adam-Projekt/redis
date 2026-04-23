import { Mem, getActiveMem, Client } from "./class";
import { BulkArray, BulkError, NULLBULKARRAY } from "./helper";
import { markKeyModified } from "./keyspace";
import { ErrorMessages } from "./error";

type TryBlpopResult =
  | { status: "empty" }
  | { status: "wrongtype" }
  | { status: "value"; key: string; value: string };

type BlockedRequest = {
  client: Client;
  keys: string[];
  timer: ReturnType<typeof setTimeout> | null;
};

const blockedByKey = new Map<string, BlockedRequest[]>();
const blockedByClient = new Map<Client, BlockedRequest>();

export function tryBlpop(
  store: Map<string, Mem>,
  keys: string[],
): TryBlpopResult {
  for (const key of keys) {
    const entry = getActiveMem(store, key);
    if (!entry) {
      continue;
    }

    if (entry.WhatData !== 1) {
      return { status: "wrongtype" };
    }

    if (entry.data.length > 0) {
      const value = entry.data.shift();
      if (value !== undefined) {
        markKeyModified(key);
        return { status: "value", key, value };
      }
    }
  }

  return { status: "empty" };
}

export function blockClient(
  client: Client,
  keys: string[],
  timeoutSeconds: number,
) {
  cleanupBlockedClient(client);

  const request: BlockedRequest = {
    client,
    keys,
    timer: null,
  };

  blockedByClient.set(client, request);
  client.blocked = true;

  for (const key of keys) {
    const queue = blockedByKey.get(key) || [];
    queue.push(request);
    blockedByKey.set(key, queue);
  }

  if (timeoutSeconds > 0) {
    request.timer = setTimeout(
      () => {
        if (blockedByClient.get(client) !== request) {
          return;
        }

        removeBlockedRequest(request);
        client.socket.write(NULLBULKARRAY);
      },
      Math.ceil(timeoutSeconds * 1000),
    );
  }
}

export function serveBlockedClients(store: Map<string, Mem>, key: string) {
  let queue = blockedByKey.get(key);

  while (queue && queue.length > 0) {
    const request = queue[0];

    if (blockedByClient.get(request.client) !== request) {
      queue.shift();
      continue;
    }

    const result = tryBlpop(store, request.keys);
    if (result.status === "empty") {
      break;
    }

    removeBlockedRequest(request);

    if (result.status === "wrongtype") {
      request.client.socket.write(BulkError(ErrorMessages.WRONG_TYPE));
    } else {
      request.client.socket.write(BulkArray([result.key, result.value]));
    }

    queue = blockedByKey.get(key);
  }
}

export function cleanupBlockedClient(client: Client) {
  const request = blockedByClient.get(client);
  if (!request) {
    client.blocked = false;
    return;
  }

  removeBlockedRequest(request);
}

function removeBlockedRequest(request: BlockedRequest) {
  if (request.timer) {
    clearTimeout(request.timer);
    request.timer = null;
  }

  for (const key of request.keys) {
    const queue = blockedByKey.get(key);
    if (!queue) {
      continue;
    }

    const nextQueue = queue.filter((item) => item !== request);
    if (nextQueue.length === 0) {
      blockedByKey.delete(key);
    } else {
      blockedByKey.set(key, nextQueue);
    }
  }

  blockedByClient.delete(request.client);
  request.client.blocked = false;
}
