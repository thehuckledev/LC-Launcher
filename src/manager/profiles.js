import Neutralino from "@neutralinojs/lib";
import { showToast } from "../components/Toast.jsx";

export class Profiles {
    constructor(manager) {
        this.manager = manager;
    };

    async list() {
        return await this.manager.utils.readJSON(this.manager.profilesFile);
    };

    async get(id) {
        const profiles = await this.list();
        return profiles.find(p => p.id === id);
    };

    async create({ username, skin, uid = this.manager.utils.generateUID(), type = "OFFLINE" }) {
        const profiles = await this.list();

        let skinDataURI, skinRenderDataURI;

        if (skin)
            [skinDataURI, skinRenderDataURI] = await this.manager.skins.process(skin);
        
        const profile = {
            id: crypto.randomUUID(),
            username,
            uid,
            type,
            skin: skinDataURI,
            skinRender: skinRenderDataURI
        };

        profiles.push(profile);
        await this.manager.utils.writeJSON(this.manager.profilesFile, profiles);

        return profile;
    };

    async edit(id, prop, value) {
        const profiles = await this.list();

        const profile = profiles.find(p => p.id === id);
        if (!profile) return "Profile not found";
        profile[prop] = value;

        await this.manager.utils.writeJSON(this.manager.profilesFile, profiles);
    };

    async update(id, updates = {}) {
        const profiles = await this.list();
        const index = profiles.findIndex(p => p.id === id);
        
        if (index === -1) throw new Error("Profile not found");

        const profile = profiles[index];
        if (updates.username) profile.username = updates.username;
        if (updates.skin) {
            const [skinDataURI, skinRenderDataURI] = await this.manager.skins.process(updates.skin);
            profile.skin = skinDataURI;
            profile.skinRender = skinRenderDataURI;
        };
        if (updates.uid) profile.uid = updates.uid;

        profiles[index] = profile;
        await this.manager.utils.writeJSON(this.manager.profilesFile, profiles);

        return profile;
    };

    async delete(id) {
        let profiles = await this.list();
        profiles = profiles.filter(p => p.id !== id);

        await this.manager.utils.writeJSON(this.manager.profilesFile, profiles);
    };

    async export(id) {
        const data = await this.get(id);
        if (!data) throw new Error("ID isn't valid");

        const sterilisedData = {
            ...data,
            id: undefined 
        };

        const savePath = await Neutralino.os.showSaveDialog("Export Profile (Must use .lceprofile.json)", {
            filters: [{ name: 'LCE Profile Files', extensions: ['lceprofile.json'] }],
            defaultPath: NL_OS === "Darwin" ? undefined : `${data.username}.lceprofile.json`
        });

        if (!savePath) return false;
        const saveFinal = savePath.trim();
        if (!saveFinal.endsWith(".lceprofile.json")) return showToast("You must save as a .lceprofile.json file");

        if (saveFinal) {
            await this.manager.utils.writeJSON(saveFinal, sterilisedData);
            return true;
        };
        return true;
    };

    async import(jsonStr) {
        try {
            let data;
            try {
                data = JSON.parse(jsonStr);
            } catch (e) {
                showToast("The file you dropped is not a valid JSON document");
                throw new Error("The file is not a valid JSON document.");
            };

            const required = {
                username: "string",
                uid: "string",
                type: [ "OFFLINE" ],
                skin: "string",
                skinRender: "string"
            };

            for (const [field, type] of Object.entries(required)) {
                if (
                    (!data[field] || typeof data[field] !== type) &&
                    !(Array.isArray(type) && type.includes(data[field]))
                ) {
                    showToast(`Invalid or missing required field: ${field}`);
                    throw new Error(`Invalid or missing required field: ${field}`);
                };
            };

            const uidRegex = /^0x[0-9A-F]{16}$/i;
            if (!uidRegex.test(data.uid)) {
                showToast("Invalid UID format in profile");
                throw new Error("Invalid UID format");
            };

            const dataUriRegex = /^data:image\/(png|jpeg|jpg);base64,/;
            if (!dataUriRegex.test(data.skin) || !dataUriRegex.test(data.skinRender)) {
                showToast("Invalid skin data in profile");
                throw new Error("Invalid skin data");
            };

            const profiles = await this.list();
            if (profiles.some(p => p.username.toLowerCase() === data.username.toLowerCase())) {
                showToast("A profile with this username already exists");
                throw new Error("Duplicate username");
            };

            const newProfile = await this.create({
                username: data.username,
                uid: data.uid,
                type: data.type,
                skin: data.skin
            });

            showToast(`Imported ${newProfile.username}`);
            return newProfile;
        } catch (err) {
            console.error("Import failed:", err);
            throw err;
        };
    };
};