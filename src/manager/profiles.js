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

    async create(username, skinDataURI, skinRenderDataURI) {
        const profiles = await this.list();

        const profile = {
            id: crypto.randomUUID(),
            username,
            uid: this.manager.generateUID(),
            type: "OFFLINE",
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

    async delete(id) {
        let profiles = await this.list();
        profiles = profiles.filter(p => p.id !== id);

        await this.manager.utils.writeJSON(this.manager.profilesFile, profiles);
    };
};