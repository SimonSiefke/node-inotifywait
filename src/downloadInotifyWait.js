import extractZip from "extract-zip";
import { createReadStream, createWriteStream } from "fs";
import { cp, mkdir, mkdtemp, readdir } from "fs/promises";
import got from "got";
import * as os from "os";
import { tmpdir } from "os";
import { dirname, join } from "path";
import { pathExists } from "path-exists";
import { pipeline } from "stream/promises";
import tar from "tar-fs";
import { fileURLToPath } from "url";
import VError from "verror";
import { xdgCache } from "xdg-basedir";
import { createGunzip } from "zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));

const VERSION = process.env.RIPGREP_VERSION || "v0.0.16";
const BIN_PATH = join(__dirname, "../bin");

const getTmpDir = () => {
  return mkdtemp(join(tmpdir(), "foo-"));
};

const getTarget = () => {
  const arch = process.env.npm_config_arch || os.arch();

  switch (os.platform()) {
    case "darwin":
      throw new VError('Platform "darwin" is not supported');
    case "win32":
      throw new VError('Platform "win32" is not supported');
    case "linux":
      switch (arch) {
        case "x64":
          return "x86_64-unknown-linux-musl.tar.gz";
        case "arm":
        case "armv7l":
          return "arm-unknown-linux-gnueabihf.tar.gz";
        case "arm64":
          throw new VError('Platform "arm64" not yet supported');
        // return "aarch64-unknown-linux-gnu.tar.gz";
        case "ppc64":
          throw new VError('Platform "ppc64" not yet supported');
        // return "powerpc64le-unknown-linux-gnu.tar.gz";
        case "s390x":
          throw new VError('Platform "s390x" not yet supported');
        // return "s390x-unknown-linux-gnu.tar.gz";
        default:
          throw new VError("Platform not yet supported");
        // return "i686-unknown-linux-musl.tar.gz";
      }
    default:
      throw new VError("Unknown platform: " + os.platform());
  }
};

export const downloadFile = async (url, outFile) => {
  try {
    await mkdir(dirname(outFile), { recursive: true });
    await pipeline(got.stream(url), createWriteStream(outFile));
  } catch (error) {
    throw new VError(error, `Failed to download "${url}"`);
  }
};

/**
 * @param {string} inFile
 * @param {string} outDir
 */
const unzip = async (inFile, outDir) => {
  try {
    await mkdir(outDir, { recursive: true });
    await extractZip(inFile, { dir: outDir });
  } catch (error) {
    throw new VError(error, `Failed to unzip "${inFile}"`);
  }
};

/**
 * @param {string} inFile
 * @param {string} outDir
 */
const untarGz = async (inFile, outDir) => {
  const tmpDir = await getTmpDir();
  try {
    await mkdir(tmpDir, { recursive: true });
    await pipeline(
      createReadStream(inFile),
      createGunzip(),
      tar.extract(tmpDir)
    );
    const dirents = await readdir(tmpDir);
    const firstDirent = dirents[0];
    await cp(`${tmpDir}/${firstDirent}`, outDir, { recursive: true });
  } catch (error) {
    throw new VError(error, `Failed to extract "${inFile}"`);
  }
};

export const downloadInotifyWait = async () => {
  const target = getTarget();
  const url = `https://github.com/SimonSiefke/inotifywait-prebuilt/releases/download/${VERSION}/inotifywait-${VERSION}-${target}`;
  const downloadPath = `${xdgCache}/inotifywait-prebuilt/inotifywait-${VERSION}-${target}`;
  if (!(await pathExists(downloadPath))) {
    await downloadFile(url, downloadPath);
  } else {
    console.info(`Info: File ${downloadPath} has been cached`);
  }
  if (downloadPath.endsWith(".tar.gz")) {
    await untarGz(downloadPath, BIN_PATH);
  } else if (downloadPath.endsWith(".zip")) {
    await unzip(downloadPath, BIN_PATH);
  } else {
    throw new VError(`Invalid downloadPath ${downloadPath}`);
  }
};
