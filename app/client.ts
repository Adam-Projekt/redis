import * as net from "net";
import { User } from "./class";

export class Client {
  socket: net.Socket;
  authenticated: boolean;
  user: User | null;
  blocked: boolean;

  constructor(socket: net.Socket, defaultUser: User) {
    this.socket = socket;
    this.user = defaultUser;
    this.blocked = false;

    this.authenticated = defaultUser.flagArray.includes("nopass");
  }
}
