import { spawn } from "child_process";
import { mkdtemp, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import waitForExpect from "wait-for-expect";
import { inotifyWaitPath as inotifyWaitPath } from "../src/index.js";

const getTmpDir = () => {
  return mkdtemp(join(tmpdir(), "foo-"));
};

test("inotifywait", async () => {
  const tmpDir = await getTmpDir();
  const childProcess = spawn(inotifyWaitPath(), [tmpDir, "-r", "-m"], {
    stdio: "pipe",
  });
  let result = "";
  childProcess.stdout.on("data", (data) => {
    result += data.toString();
  });
  await writeFile(`${tmpDir}/sample-file.txt`, "sample text");
  await waitForExpect(() => {
    expect(result).toEqual(
      [
        `${tmpDir}/ CREATE sample-file.txt`,
        `${tmpDir}/ OPEN sample-file.txt`,
        `${tmpDir}/ MODIFY sample-file.txt`,
        `${tmpDir}/ CLOSE_WRITE,CLOSE sample-file.txt`,
        "",
      ].join("\n")
    );
  });
  childProcess.kill();
});
