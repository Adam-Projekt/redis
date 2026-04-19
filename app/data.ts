export class Mem {
  data: string[];
  WhatData: number; // 0 FOR string; 1 for list
  constructor(data: string[], WhatData: number = 0) {
    this.data = data;
    this.WhatData = WhatData;
  }
}
