#!/usr/bin/env node
const { spawn } = require("child_process");
const command = process.argv[2];
const target = process.argv[3];
const dest = process.argv[4];

if (!command || !target) {
  console.log("Usage: leggiero [all|watch] <source-directory> [dest-directory]");
  process.exit(1);
}

switch (command) {
  case "all":
    spawn("node", [`${__dirname}/../sharp/sharp-all.mjs`, target, dest], {
      stdio: "inherit",
    });
    break;
  case "watch":
    console.log(
      "\x1b[32m%s\x1b[0m",
      `Watching ${target}...
Press Ctrl+C to stop.`
    );

    spawn(
      "npx",
      [
        "onchange",
        target,
        "--",
        "node",
        `${__dirname}/../sharp/sharp-watch.mjs`,
        "{{changed}}",
        target,
        dest,
      ],
      { stdio: "inherit", shell: true }
    );
    break;
  default:
    console.log("Usage: leggiero [all|watch] <source-directory> [dest-directory]");
    break;
}
