import { Mem, User } from "./class";

export const mem = new Map<string, Mem>();

export const users: User[] = [new User("default", ["nopass"], [])];
