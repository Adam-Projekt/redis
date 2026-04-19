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
  constructor(data: string[], WhatData: number = 0) {
    this.data = data;
    this.WhatData = WhatData;
  }
}
