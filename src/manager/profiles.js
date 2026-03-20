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

    async create(username, rawSkinDataURI, type = "OFFLINE") {
        const profiles = await this.list();

        let skinDataURI, skinRenderDataURI;

        if(rawSkinDataURI)
            [ skinDataURI, skinRenderDataURI ] = await this.manager.skins.process(rawSkinDataURI);

        //DONE TODO make it detect 64x64 skin and turn into 64x32
        //DONE TODO make it render skin head
        //DONE TODO make it fall back to steve

        const profile = {
            id: crypto.randomUUID(),
            username,
            uid: this.manager.utils.generateUID(),
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

    async delete(id) {
        let profiles = await this.list();
        profiles = profiles.filter(p => p.id !== id);

        await this.manager.utils.writeJSON(this.manager.profilesFile, profiles);
    };
};