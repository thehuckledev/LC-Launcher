import nmd from 'nano-markdown';

export class Remotes {
    constructor(manager) {
        this.manager = manager;
    };

    async list(repo) {
        const res = await fetch(`https://api.github.com/repos/${repo}/releases`, {
            cache: "no-store"
        });
        return await res.json();
    };

    async get(repo, tag) {
        const releases = await this.list(repo);
        return releases.find(r => r.tag_name === tag);
    };

    async patchnotes(repo, tag) {
        const release = await this.get(repo, tag);
        const plaintxt = release.body;
        if (!plaintxt) return "No patch notes found!";
        const html = nmd(plaintxt);
        return html;
    };
};