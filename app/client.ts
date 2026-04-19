import * as net from "net";
import { User } from "./user";

export class Client {
  socket: net.Socket;
  authenticated: boolean;
  user: User | null;

  constructor(socket: net.Socket, defaultUser: User) {
    this.socket = socket;
    this.user = defaultUser;

    // nopass => auto login
    this.authenticated = defaultUser.flagArray.includes("nopass");
  }
}
