#!/usr/bin/env node
const { spawn } = require("child_process");
const command = process.argv[2];
const target = process.argv[3];
const dest = process.argv[4];

if (!command || !target) {
  console.log("Usage: gyuto [all|watch] <source-directory> [dest-directory]");
  process.exit(1);
}

switch (command) {
  case "all":
    spawn("node", [`${__dirname}/../sharp/sharp-all.mjs`, target, dest], {
      stdio: "inherit",
    });
    break;
  case "watch":
    spawn(
      "onchange",
      [
        target,
        "--",
        "node",
        `${__dirname}/../sharp/sharp-watch.mjs`,
        "{changed}",
        dest,
      ],
      { stdio: "inherit" }
    );
    break;
  default:
    console.log("Usage: gyuto [all|watch] <source-directory> [dest-directory]");
    break;
}
