import winControllerHook from "./universalControllerSupport.cs" with { type: "text" };
import vigemDLLBase64 from "../lib/Nefarius.ViGEm.Client.dll.b64" with { type: "text" };
import path from "path";
import fs from "fs";
import os from "os";

class UniversalControllerSupport {
    static isMapped = false;
    static winHookProcess = null;
    static tempDLLPath = null;

    static toggle(callID, ext, enable) {
        if (process.platform !== "win32" || this.isMapped === enable) return;

        if (!enable) {
            if (this.winHookProcess) {
                this.winHookProcess.kill();
                this.winHookProcess = null;
            };
            this.isMapped = false;

            if (this.tempDLLPath && fs.existsSync(this.tempDLLPath)) {
                try {
                    fs.rmSync(this.tempDLLPath, { force: true });
                } catch (e) {};
            };

            return;
        };

        if (this.winHookProcess) return;

        this.tempDLLPath = path.join(os.tmpdir(), `Nefarius.ViGEm.Client_${Date.now()}.dll`);

        const DLLBuff = Buffer.from(vigemDLLBase64.trim(), "base64");
        fs.writeFileSync(this.tempDLLPath, DLLBuff);

        const absoluteDLLPath = path.resolve(this.tempDLLPath).replace(/\\/g, "\\\\");

        const psScript = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$dllPath = "${absoluteDLLPath}"
[Reflection.Assembly]::LoadFrom($dllPath) | Out-Null

$assemblies = @(
    "System",
    "System.Core",
    "System.Windows.Forms",
    "System.Drawing",
    $dllPath
)

$netStdPath = Join-Path ([System.Runtime.InteropServices.RuntimeEnvironment]::GetRuntimeDirectory()) "netstandard.dll"
if (Test-Path $netStdPath) {
    $assemblies += $netStdPath
}

$winControllerHook = @"
${winControllerHook}
"@

try {
    Add-Type -TypeDefinition $winControllerHook -ReferencedAssemblies $assemblies
    [UniversalControllerSupport]::Main()
} catch {
    [System.Windows.Forms.MessageBox]::Show(
        $_.Exception.ToString(),
        "LC Launcher (Universal Controller Support) - Execution Error",
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Error
    )
}
`;

        const formattedCMD = Buffer.from(psScript, "utf16le").toString("base64");
        this.winHookProcess = Bun.spawn(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-EncodedCommand", formattedCMD]);
        this.isMapped = true;
    };
};

process.on("exit", () => {
    UniversalControllerSupport.toggle(null, null, false);
});

module.exports = UniversalControllerSupport;