// thanks to https://git.huckle.dev/Huckles-Minecraft-Archive/LegacyLauncher/src/branch/main/renderer.js
// reading through it helped me understand how to change skins etc.

import Neutralino from "@neutralinojs/lib";

import { Profiles } from "./profiles.js";
import { Instances } from "./instances.js";
import { Remotes } from "./remotes.js";
import { Servers } from "./servers.js";
import { Worlds } from "./worlds.js";
import { Exec } from "./exec.js";
import { Utils } from "./utils.js";

export class Manager {
    constructor() {
        this.dataDir = null;
        this.profilesFile = null;
        this.instancesDir = null;

        this.utils = new Utils(this);
        this.profiles = new Profiles(this);
        this.instances = new Instances(this);
        this.remotes = new Remotes(this);
        this.servers = new Servers(this);
        this.worlds = new Worlds(this);
        this.exec = new Exec(this);
    };

    async init() {
        this.dataDir = JSON.parse(await Neutralino.storage.getData("settings-dataDirectory"));
        this.profilesFile = await Neutralino.filesystem.getJoinedPath(this.dataDir, "profiles.json");
        this.instancesDir = await Neutralino.filesystem.getJoinedPath(this.dataDir, "instances");

        await this.utils.ensureDir(this.dataDir);
        await this.utils.ensureDir(this.instancesDir);

        // make profile if it doesnt exist
        try {
            await Neutralino.filesystem.getStats(this.profilesFile);
        } catch {
            await Neutralino.filesystem.writeFile(this.profilesFile, JSON.stringify([], null, 2));
        };

        window.manager = this;
    };
};