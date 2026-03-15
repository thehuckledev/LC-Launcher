export const defaultSettings = {
    volume: 80,
    menuMusic: true,
    fullscreen: false,
    instancesDirectory: () => {
        switch (NL_OS) {
            case "Windows":
                return "%APPDATA%/LegacyCommunityLauncher/instances";

            case "Linux":
                return "~/.local/share/LegacyCommunityLauncher/instances";

            case "Darwin":
                return "~/Library/Application Support/LegacyCommunityLauncher/instances";

            default:
                return "./instances";
        };
    }
};