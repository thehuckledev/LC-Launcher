import Neutralino from "@neutralinojs/lib";
import { defaultSettings } from "../data/defaultSettings.js";

let cache = null;
let dataDirCache = localStorage.getItem("dataDirectory");

const getDataDirectory = async () => {
    if (dataDirCache) return dataDirCache;

    try {
        const res = localStorage.getItem("dataDirectory");
        if (!res) throw new Error();
        const stats = await Neutralino.filesystem.getStats(res);
        if (!stats.isDirectory) throw new Error();
        dataDirCache = res;
        return res;
    } catch {
        const path = await resolveDefault("dataDirectory");
        localStorage.setItem("dataDirectory", path);
        try {
            const stats = await Neutralino.filesystem.getStats(path);
            if (!stats.isDirectory) throw new Error("Default data dir does not exist");
        } catch {
            await Neutralino.filesystem.createDirectory(path);
        };
        dataDirCache = path;
        return path;
    };
};
const getConfigPath = async () => `${await getDataDirectory()}/config.json`;

async function readConfig() {
    if (cache) return cache;

    const path = await getConfigPath();
    try {
        const data = await Neutralino.filesystem.readFile(path);
        cache = JSON.parse(data);
    } catch {
        console.warn(`Config not found at: ${path}. Fallback to defaults`);
        
        const initialConfig = { ...defaultSettings };
        delete initialConfig.dataDirectory;

        await writeConfig(initialConfig);
        cache = initialConfig;
    };

    return cache;
};

async function writeConfig(config) {
    cache = config;

    const path = await getConfigPath();
    Neutralino.filesystem.writeFile(path, JSON.stringify(config, null, 2));
};

async function resolveDefault(name) {
    let value = defaultSettings[name];
    if (typeof value === "function")
        value = await value();
    return value;
};

export async function loadSettings() {
    dataDirCache = await getDataDirectory();
    const config = await readConfig();

    for (const key in defaultSettings) {
        if (key === "dataDirectory") continue;

        if (!(key in config)) 
            config[key] = await resolveDefault(key);
    };

    await writeConfig(config);
    return {
        ...config,
        dataDirectory: await getDataDirectory()
    };
};

export async function getSetting(name) {
    if (name === "dataDirectory")
        return await getDataDirectory();

    const config = await readConfig();
    if (!(name in config)) {
        const value = await resolveDefault(name);
        config[name] = value;
        await writeConfig(config);
        return value;
    };

    return config[name];
};

export function getSettingSync(name) {
    if (name === "dataDirectory") return dataDirCache;
    return cache ? cache[name] : defaultSettings[name];
};

export async function setSetting(name, value) {
    if (name === "dataDirectory") {
        dataDirCache = value;
        return localStorage.setItem("dataDirectory", value);
    };

    const config = await readConfig();
    config[name] = value;

    await writeConfig(config);
};

export async function defaultSetting(name) {
    if (name === "dataDirectory") {
        const path = await resolveDefault("dataDirectory");
        dataDirCache = path;
        return localStorage.setItem("dataDirectory", path);
    };

    const config = await readConfig();
    const value = await resolveDefault(name);
    config[name] = value;
    await writeConfig(config);
    return value;
};