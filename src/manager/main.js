// thanks to https://git.huckle.dev/Huckles-Minecraft-Archive/LegacyLauncher/src/branch/main/renderer.js
// reading through it helped me understand how to change skins etc.

import Neutralino from "@neutralinojs/lib";
import { getSetting } from "../utils/settingsManager.js";

import { Profiles } from "./profiles.js";
import { Instances } from "./instances.js";
import { Remotes } from "./remotes.js";
import { Servers } from "./servers.js";
import { Worlds } from "./worlds.js";
import { Skins } from "./skins.js";
import { Exec } from "./exec.js";
import { Utils } from "./utils.js";
import { API } from "./api.js";

import config from "../data/config.js";

export class Manager {
    constructor() {
        this.dataDir = null;
        this.profilesFile = null;
        this.instancesDir = null;
        this.preserveList = [];

        this.utils = new Utils(this);
        this.profiles = new Profiles(this);
        this.instances = new Instances(this);
        this.remotes = new Remotes(this);
        this.servers = new Servers(this);
        this.worlds = new Worlds(this);
        this.skins = new Skins(this);
        this.exec = new Exec(this);
        this.api = new API(config.apiDomain);
    };

    async init() {
        console.log("Running manager init func");
        this.dataDir = await getSetting("dataDirectory");
        this.profilesFile = await Neutralino.filesystem.getJoinedPath(this.dataDir, "profiles.json");
        this.instancesDir = await Neutralino.filesystem.getJoinedPath(this.dataDir, "instances");
        this.preserveList = [
            "screenshots",
            "leaderboards-cache.dat",
            "profile1.dat", "profile2.dat", "profile3.dat",
            "Windows64/GameHDD"
        ];
        this.profileInstanceFiles = [
            "profile0.dat", "settings.dat", "options.txt",
        ];

        console.log("Manager vars defined", {
            dataDir: this.dataDir,
            profilesFile: this.profilesFile,
            instancesDir: this.instancesDir,
            preserveList: this.preserveList,
            profileInstanceFiles: this.profileInstanceFiles
        });

        await this.utils.ensureDir(this.dataDir);
        await this.utils.ensureDir(this.instancesDir);

        // make profile if it doesnt exist
        try {
            await Neutralino.filesystem.getStats(this.profilesFile);
        } catch {
            await Neutralino.filesystem.writeFile(this.profilesFile, JSON.stringify([], null, 2));
        };

        // this increases memory usage
        //window.manager = this;
    };
};