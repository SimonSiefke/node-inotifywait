import { inotifyWaitPath } from "../src/index.js";
import { spawn } from "child_process";
import { mkdirSync, writeFileSync } from "fs";

mkdirSync("/tmp/myFolder", { recursive: true });

spawn(inotifyWaitPath(), ["-r", "-m", "/tmp/myFolder"], {
  stdio: "inherit",
});

writeFileSync("/tmp/myFolder/abc.txt", "");
