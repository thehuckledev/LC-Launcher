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

    async create(username, rawSkinDataURI, uid = this.manager.utils.generateUID(), type = "OFFLINE") {
        const profiles = await this.list();

        let skinDataURI, skinRenderDataURI;

        if(rawSkinDataURI)
            [ skinDataURI, skinRenderDataURI ] = await this.manager.skins.process(rawSkinDataURI);
        
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
        if (updates.UID) profile.UID = updates.UID;

        profiles[index] = profile;
        await this.manager.utils.writeJSON(this.manager.profilesFile, profiles);

        return profile;
    };

    async delete(id) {
        let profiles = await this.list();
        profiles = profiles.filter(p => p.id !== id);

        await this.manager.utils.writeJSON(this.manager.profilesFile, profiles);
    };
};