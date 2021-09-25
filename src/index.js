import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const inotifyWaitPath = ({ useNative = false } = {}) => {
  if (useNative) {
    return "inotifywait";
  }
  return join(__dirname, `../bin/inotifywait`);
};
