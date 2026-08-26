const { spawn } = require("node:child_process");

const port = process.env.PORT || "3000";
const nextCli = require.resolve("next/dist/bin/next");

const child = spawn(
  process.execPath,
  [nextCli, "start", "-H", "0.0.0.0", "-p", String(port)],
  {
    cwd: __dirname,
    env: process.env,
    stdio: "inherit",
  },
);

function forward(signal) {
  if (child.exitCode === null) child.kill(signal);
}

process.on("SIGINT", () => forward("SIGINT"));
process.on("SIGTERM", () => forward("SIGTERM"));

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
