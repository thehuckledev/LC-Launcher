export class Remotes {
    constructor(manager) {
        this.manager = manager;
    };

    async list(repo) {
        const res = await fetch(`https://api.github.com/repos/${repo}/releases`);
        return await res.json();
    };

    async get(repo, tag) {
        const releases = await this.list(repo);
        return releases.find(r => r.tag_name === tag);
    };
};