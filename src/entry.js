import Neutralino from "@neutralinojs/lib";
import { startLogger } from "./utils/logger.js";

Neutralino.init();
window._neutralino = Neutralino;

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

    const { install } = await import("./installer.js");
    const res = await install(); // install first
    if (res === "missing deps") return document.body.innerHTML += `<div oncontextmenu="return false;" style="display:flex; position:fixed; top:0; left:0; width:100%; height:100%; z-index:9999; color:white; font-family:sans-serif; justify-content:center; align-items:center; text-align:center; user-select:none; -webkit-user-select:none;">
                                                                        <div style="background:#222; padding:30px; border-radius:14px; border:1px solid #444; max-width:400px;">
                                                                            <h2>Dependency Missing</h2>
                                                                            <p>This app requires <strong>zenity</strong> to run. Please install it using your package manager</p>
                                                                            <button onclick="_neutralino.app.exit()" style="width: 100px; padding:10px 20px; background:#444; color:white; border:none; border-radius: 18px; margin-left:10px; cursor:pointer;">Exit</button>
                                                                        </div>
                                                                    </div>`;

    await import("./main.jsx");
})();