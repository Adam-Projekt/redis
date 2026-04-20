export class User {
  passwordArray: string[] = [];
  flagArray: string[] = [];
  name: string = "default";
  constructor(name: string, flagArray: string[], passwordArray: string[]) {
    this.name = name;
    this.flagArray = flagArray;
    this.passwordArray = passwordArray;
  }
}
export class Mem {
  data: string[];
  WhatData: number; // 0 FOR string; 1 for list
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
    return undefined;
  }

  return entry;
}
