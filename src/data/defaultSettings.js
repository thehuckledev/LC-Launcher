import Neutralino from "@neutralinojs/lib";

export const defaultSettings = {
    volume: 80,
    menuMusic: true,
    fullscreen: false,
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
                    "LegacyCommunityLauncher"
                );

            case "Linux":
                return await Neutralino.filesystem.getJoinedPath(
                    homeDir,
                    ".local",
                    "share",
                    "LegacyCommunityLauncher"
                );

            case "Darwin":
                return await Neutralino.filesystem.getJoinedPath(
                    homeDir,
                    "Library",
                    "Application Support",
                    "LegacyCommunityLauncher"
                );

            default:
                return await Neutralino.filesystem.getJoinedPath(homeDir, "LegacyCommunityLauncher");
        }
    }
};