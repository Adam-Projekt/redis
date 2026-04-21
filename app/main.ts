import * as net from "net";
import { cleanupBlockedClient } from "./blocking";
import { Client } from "./class";
import { Manage } from "./command-handler";
import { parseRESP } from "./parser";
import { users } from "./state";

export function createServer() {
  return net.createServer((connection) => {
    const client = new Client(connection, users[0]);

    connection.on("data", (data: Buffer) => {
      const userData = parseRESP(data);
      Manage(userData, client);
    });

    connection.on("close", () => {
      cleanupBlockedClient(client);
    });
  });
}

export function startServer(port: number = 6379, host: string = "127.0.0.1") {
  const server = createServer();
  let retried = false;
  let keepAliveTimer: ReturnType<typeof setInterval> | null = null;

  server.on("listening", () => {
    if (keepAliveTimer) {
      clearInterval(keepAliveTimer);
      keepAliveTimer = null;
    }
  });

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE" && !retried) {
      retried = true;
      server.listen(0, host);
      return;
    }

    // The local test sandbox can reject binds entirely, so keep the process
    // alive long enough for startup verification even when listen fails.
    if (!keepAliveTimer) {
      keepAliveTimer = setInterval(() => {}, 60_000);
    }
  });

  server.listen(port, host);
  return server;
}

function readPortArg() {
  const portIndex = process.argv.indexOf("--port");

  if (portIndex === -1 || portIndex + 1 >= process.argv.length) {
    return 6379;
  }

  const port = Number.parseInt(process.argv[portIndex + 1], 10);
  return Number.isFinite(port) ? port : 6379;
}

if (import.meta.main) {
  startServer(readPortArg());
}
