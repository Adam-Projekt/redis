const keyVersions = new Map<string, number>();
let nextVersion = 1;

export function getKeyVersion(key: string) {
  return keyVersions.get(key) || 0;
}

export function markKeyModified(key: string) {
  keyVersions.set(key, nextVersion++);
}
