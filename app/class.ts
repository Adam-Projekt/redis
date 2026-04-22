import * as net from "net";
import { Commands } from "./commandEnum";
import { getKeyVersion, markKeyModified } from "./keyspace";

export class User {
  passwordArray: string[] = [];
  flagArray: string[] = [];
  name: string = "default";
  enable: boolean = true;
  constructor(name: string, flagArray: string[], passwordArray: string[]) {
    this.name = name;
    this.flagArray = flagArray;
    this.passwordArray = passwordArray;
  }
  reset() {
    this.flagArray = [];
    if (this.name == "default") {
      this.flagArray = ["nopass"];
    }
    this.passwordArray = [];
  }
}
export class Mem {
  data: string[];
  WhatData: number; // 0 FOR string; 1 for list; 2 for sorted set
  expiryAt: number | null;
  timeoutId: ReturnType<typeof setTimeout> | null;
  constructor(data: string[], WhatData: number = 0) {
    this.data = data;
    this.WhatData = WhatData;
    this.expiryAt = null;
    this.timeoutId = null;
  }

  clearExpiry() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = null;
    this.expiryAt = null;
  }

  isExpired(now: number = Date.now()) {
    return this.expiryAt !== null && this.expiryAt <= now;
  }

  scheduleExpiry(key: string, store: Map<string, Mem>, ttlMs: number) {
    this.clearExpiry();
    this.expiryAt = Date.now() + ttlMs;
    const expectedExpiryAt = this.expiryAt;
    this.timeoutId = setTimeout(() => {
      const current = store.get(key);
      if (current === this && current.expiryAt === expectedExpiryAt) {
        store.delete(key);
        markKeyModified(key);
      }
    }, ttlMs);
  }
}

export function getActiveMem(store: Map<string, Mem>, key: string) {
  const entry = store.get(key);
  if (!entry) {
    return undefined;
  }

  if (entry.isExpired()) {
    entry.clearExpiry();
    store.delete(key);
    markKeyModified(key);
    return undefined;
  }

  return entry;
}

export class Client {
  socket: net.Socket;
  authenticated: boolean;
  user: User | null;
  blocked: boolean;
  isTransaction: boolean;
  TransactionArray: query[];
  watchedKeyVersions: Map<string, number>;

  constructor(socket: net.Socket, defaultUser: User) {
    this.socket = socket;
    this.user = defaultUser;
    this.blocked = false;
    this.isTransaction = false;
    this.TransactionArray = [];
    this.watchedKeyVersions = new Map();

    this.authenticated = defaultUser.flagArray.includes("nopass");
  }

  watchKeys(keys: string[]) {
    for (const key of keys) {
      this.watchedKeyVersions.set(key, getKeyVersion(key));
    }
  }

  clearWatch() {
    this.watchedKeyVersions.clear();
  }

  hasDirtyWatchedKeys() {
    for (const [key, version] of this.watchedKeyVersions) {
      if (getKeyVersion(key) !== version) {
        return true;
      }
    }

    return false;
  }
}
export class query {
  command: Commands;
  arg: string[];

  constructor(command: Commands, arg: string[]) {
    this.command = command;
    this.arg = arg;
  }
}
