#!/usr/bin/env node
const { spawn } = require("child_process");
const command = process.argv[2];
const target = process.argv[3];

if (!command || !target) {
  console.log("Usage: gyuto [all|watch] <directory>");
  process.exit(1);
}

switch (command) {
  case "all":
    spawn("node", [`${__dirname}/../sharp/sharp-all.mjs`, target], {
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
      ],
      { stdio: "inherit" }
    );
    break;
  default:
    console.log("Usage: gyuto [all|watch] <directory>");
    break;
}
