import { Config } from "@remotion/cli/config";
import { existsSync } from "node:fs";

// If Remotion's own downloaded browser won't start (seen on some Macs), use the Chrome that's already installed.
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
if (process.platform === "darwin" && existsSync(chrome)) {
  Config.setBrowserExecutable(chrome);
  Config.setChromeMode("chrome-for-testing");
}
