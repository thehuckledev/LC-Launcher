import Neutralino from "@neutralinojs/lib";

class Installer {
    constructor() {};

    async isInstalled() {
        if (NL_ARGS.includes("--neu-dev-extension")) return true;

        const installBase = await this.getInstallPath();
        if (NL_PATH.includes(installBase)) return true;
        else return false;
    };

    async getInstallPath() {
        const home = await Neutralino.os.getEnv('HOME');
        switch (NL_OS) {
            case "Windows":
                const appData = await Neutralino.os.getEnv('APPDATA');
                const rawPath = `${appData}/LC Launcher.exe`;
                return rawPath.replaceAll("\\","/");
                break;
            case "Darwin":
                return `${home}/Applications`;
                break;
            case "Linux":
                const exec = 'LC_Launcher-linux_' + (NL_ARCH === "x64" ? "x64" : "arm64");
                return `${home}/.local/share/${exec}`;
                break;
        };
    };

    // install functions
    async install() {
        const res = await Neutralino.os.execCommand('which zenity'); // must do this first otherwise prompt below wont appear
        if (res.exitCode !== 0) return "missing deps";

        const choice = await Neutralino.os.showMessageBox('LC Launcher Installer', `Would you like to install LC Launcher?`, 'YES_NO', 'QUESTION');
        if (choice !== 'YES') return await Neutralino.app.exit();

        try {
            const installPath = await this.getInstallPath();

            if (NL_OS === 'Windows') await this.winInstall(installPath);
            else if (NL_OS === 'Darwin') await this.macInstall(installPath);
            else if (NL_OS === 'Linux') await this.linuxInstall(installPath);

            await Neutralino.os.showMessageBox('LC Launcher Installer', 'LC Launcher Installation complete!', 'OK', 'INFO');
        } catch (err) {
            await Neutralino.os.showMessageBox('LC Launcher Installer', `Install failed: ${err.message}`, 'OK', 'ERROR');
        } finally {
            await Neutralino.app.exit();
        };
    };

    async winInstall(installPath) {
        await Neutralino.filesystem.createDirectory(installPath).catch(()=>{});

        await Neutralino.filesystem.remove(`${installPath}/LC Launcher.exe`).catch(()=>{});
        await Neutralino.filesystem.remove(`${installPath}/resources.neu`).catch(()=>{});
        await Neutralino.filesystem.remove(`${installPath}/libs`).catch(()=>{});

        await Neutralino.filesystem.move(`${NL_PATH}/LC Launcher.exe`, `${installPath}/LC Launcher.exe`);
        await Neutralino.filesystem.move(`${NL_PATH}/resources.neu`, `${installPath}/resources.neu`);
        await Neutralino.filesystem.move(`${NL_PATH}/libs`, `${installPath}/libs`);
        
        await this.createWindowsShortcut(installPath);
    };

    async macInstall(installPath) {
        const source = await Neutralino.filesystem.getJoinedPath(NL_PATH, "../../");
        const destination = `${installPath}/LC-Launcher.app`;
        await Neutralino.filesystem.remove(destination).catch(()=>{});
        await Neutralino.filesystem.move(source, destination);
    };

    async linuxInstall(installPath) {
        await Neutralino.filesystem.createDirectory(installPath).catch(()=>{});

        const exec = 'LC_Launcher-linux_' + (NL_ARCH === "x64" ? "x64" : "arm64")
        await Neutralino.filesystem.remove(`${installPath}/${exec}`).catch(()=>{});
        await Neutralino.filesystem.remove(`${installPath}/resources.neu`).catch(()=>{});
        await Neutralino.filesystem.remove(`${installPath}/libs`).catch(()=>{});
        await Neutralino.filesystem.remove(`${installPath}/icon.png`).catch(()=>{});

        await Neutralino.filesystem.move(`${NL_PATH}/${exec}`, `${installPath}/${exec}`);
        await Neutralino.filesystem.move(`${NL_PATH}/resources.neu`, `${installPath}/resources.neu`);
        await Neutralino.filesystem.move(`${NL_PATH}/libs`, `${installPath}/libs`);
        await Neutralino.filesystem.move(`${NL_PATH}/icon.png`, `${installPath}/icon.png`);

        await Neutralino.os.execCommand(`chmod +x "${installPath}/${exec}"`);
        await this.createLinuxShortcut(installPath);
    };

    // shortcut functions
    async createWindowsShortcut(installPath) {
        const targetPath = `${installPath}/LC Launcher.exe`;
        const escapedTarget = targetPath.replace(/\//g, '\\');
        const escapedCWD = installPath.replace(/\//g, '\\');

        const psCommand = [
            `$sh = New-Object -ComObject WScript.Shell;`,
            `$p = Join-Path $env:AppData 'Microsoft\\Windows\\Start Menu\\Programs\\LC Launcher.lnk';`,
            `$s = $sh.CreateShortcut($p);`,
            `$s.TargetPath = '${escapedTarget}';`,
            `$s.WorkingDirectory = '${escapedCWD}';`,
            `$s.Save();`
        ].join(' ');

        try {
            const result = await Neutralino.os.execCommand(`powershell -ExecutionPolicy Bypass -Command "${psCommand}"`);
            console.log("Shortcut Result:", result);
        } catch (err) {
            console.error("Powershell Execution Error:", err);
        };
    };

    async createLinuxShortcut(installPath) {
        const home = await Neutralino.os.getEnv('HOME');
        const desktopFolder = `${home}/.local/share/applications`;
        const iconPath = `${installPath}/icon.png`;
        const exec = 'LC_Launcher-linux_' + (NL_ARCH === "x64" ? "x64" : "arm64");

        const desktopEntry = `[Desktop Entry]
Name=LC Launcher
Icon=${iconPath}
Exec=${installPath}/${exec}
Terminal=false
Type=Application
Categories=Game;
Keywords=LC Launcher;Legacy Community Launcher;LCE Launcher;Legacy Console Edition Launcher;`;

        await Neutralino.filesystem.writeFile(`${desktopFolder}/${NL_APPID}.desktop`, desktopEntry);
        await Neutralino.os.execCommand(`chmod +x "${desktopFolder}/${NL_APPID}.desktop"`);
    };
};

export async function install() {
    const installer = new Installer();
    const isInstalled = await installer.isInstalled();
    if (!isInstalled) return await installer.install();
};