import Neutralino from "@neutralinojs/lib";

export const defaultSettings = {
    hasSetup: false,
    keepLauncherOpen: false,
    showFeaturedServers: true,
    volume: 80,
    buttonClickSFX: false,
    menuMusic: false,
    menuMusicPanning: true,
    discordRPC: true,
    lastProfileID: null,
    lastInstanceID: null,
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
                    NL_ARGS[0].split("/").at(-1),
                    "data"
                ); // NL_ARGS[0].split("/").at(-1) gives you the executable's name

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