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

    if (NL_PATH.includes("/AppTranslocation/")) {
        await Neutralino.os.showMessageBox(
            "LC Launcher",
            "Move LC Launcher out of the Downloads folder. MacOS app translocation prevents it from running while in the Downloads folder."
        );
        return await Neutralino.app.exit();
    };

    await import("./main.jsx");
})();