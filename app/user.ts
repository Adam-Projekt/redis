export class User {
  passwordArray: string[] = [];
  flagArray: string[] = [];
  name: string;
  constructor(name: string, flagArray: string[], passwordArray: string[]) {
    this.name = name;
    this.flagArray = flagArray;
    this.passwordArray = passwordArray;
  }
}
