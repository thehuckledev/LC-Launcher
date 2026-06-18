import Neutralino from "@neutralinojs/lib";
import { startLogger } from "./utils/logger.js";

Neutralino.init();
if (NL_ARGS.includes("--neu-dev-extension")) window._neutralino = Neutralino; // huge ram increase prob

(async () => {
    startLogger();
    console.log(`

Loading LC Launcher...
---------------------------
App Name: ${NL_APPID}
Version: ${NL_APPVERSION}
Operating System: ${NL_OS}
Architecture: ${NL_ARCH}
Locale: ${NL_LOCALE}
Args: ${NL_ARGS}
NJS Client: ${NL_CVERSION || "Unknown"} (${NL_CCOMMIT || "Unknown"})
NJS Server: ${NL_VERSION || "Unknown"} (${NL_COMMIT || "Unknown"})
---------------------------
`);

    await import("./main.jsx");
})();