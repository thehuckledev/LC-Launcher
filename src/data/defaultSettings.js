import Neutralino from "@neutralinojs/lib";

export const defaultSettings = {
    volume: 80,
    menuMusic: true,
    fullscreen: false,
    instancesDirectory: async () => {
        const homeDir =
            (await Neutralino.os.getEnv("HOME")) ||
            (await Neutralino.os.getEnv("USERPROFILE"));

        switch (NL_OS) {
            case "Windows":
                return await Neutralino.filesystem.getJoinedPath(
                    homeDir,
                    "AppData",
                    "Roaming",
                    "LegacyCommunityLauncher",
                    "instances"
                );

            case "Linux":
                return await Neutralino.filesystem.getJoinedPath(
                    homeDir,
                    ".local",
                    "share",
                    "LegacyCommunityLauncher",
                    "instances"
                );

            case "Darwin":
                return await Neutralino.filesystem.getJoinedPath(
                    homeDir,
                    "Library",
                    "Application Support",
                    "LegacyCommunityLauncher",
                    "instances"
                );

            default:
                return await Neutralino.filesystem.getJoinedPath(homeDir, "LegacyCommunityLauncher", "instances");
        }
    }
};