export const defaultInstances = [
    {
        id: "revelations",
        name: "Revelations",
        serviceType: "GITEA",
        serviceDomain: "git.revela.dev",
        repo: "itsRevela/LCE-Revelations",
        tag: "Nightly",
        exec: "Minecraft.Client.exe",
        target: "LCE-Revelations-Client-Win64.zip",
        compatibilityLayer: "RUNTIME",
        supportedPlatforms: ["Windows","Linux","Darwin"],
        supportsSlimSkins: false
    },
    {
        id: "neo-legacy",
        name: "neoLegacy",
        serviceType: "GITHUB",
        serviceDomain: "github.com",
        repo: "neoStudiosLCE/neoLegacy",
        tag: "latest",
        exec: "Minecraft.Client.exe",
        target: "neoLegacyWindows64.zip",
        compatibilityLayer: "RUNTIME",
        supportedPlatforms: ["Windows","Linux","Darwin"],
        supportsSlimSkins: true
    },
    {
        id: "hellish-ends",
        name: "Hellish Ends",
        serviceType: "GITHUB",
        serviceDomain: "github.com",
        repo: "deadvoxelx/ThatModdedRepo",
        tag: "nightly",
        exec: "Minecraft.Client.exe",
        target: "LCEWindows64.zip",
        compatibilityLayer: "RUNTIME",
        supportedPlatforms: ["Windows","Linux","Darwin"],
        supportsSlimSkins: false
    }
];