import Neutralino from "@neutralinojs/lib";

export const defaultSettings = {
    hasSetup: false,
    keepLauncherOpen: false,
    volume: 80,
    menuMusic: true,
    fullscreen: false,
    discordRPC: true,
    dataDirectory: async () => {
        const homeDir =
            (await Neutralino.os.getEnv("HOME")) ||
            (await Neutralino.os.getEnv("USERPROFILE"));

        switch (NL_OS) {
            case "Windows":
                return await Neutralino.filesystem.getJoinedPath(
                    homeDir,
                    "AppData",
                    "Roaming",
                    "LC Launcher.exe",
                    "data"
                );

            case "Linux":
                return await Neutralino.filesystem.getJoinedPath(
                    homeDir,
                    ".local",
                    "share",
                    "LegacyCommunityLauncher",
                    "data"
                );

            case "Darwin":
                return await Neutralino.filesystem.getJoinedPath(
                    homeDir,
                    "Library",
                    "Application Support",
                    "LegacyCommunityLauncher",
                    "data"
                );

            default:
                return await Neutralino.filesystem.getJoinedPath(homeDir, "LegacyCommunityLauncher");
        }
    }
};