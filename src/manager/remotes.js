import nmd from 'nano-markdown';

export class Remotes {
    constructor(manager) {
        this.manager = manager;
    };

    getReleasesAPI(instance) {
        const domain = instance.serviceDomain;
        const repo = instance.repo;

        switch (instance.serviceType) {
            case "GITHUB":
                return `https://api.${domain}/repos/${repo}/releases`;

            case "GITLAB":
                return `https://${domain}/api/v4/projects/${encodeURIComponent(repo)}/releases`;

            case "GITEA":
                return `https://${domain}/api/v1/repos/${repo}/releases`;
        };
    };

    normalizeReleases(service, data) {
        if (service === "GITLAB") {
            return data.map(r => ({
                tag_name: r.tag_name,
                body: r.description,
                assets: (r.assets?.links || []).map(a => ({
                    name: a.name,
                    browser_download_url: a.url,
                    id: a.url
                }))
            }));
        };

        return data;
    };

    async list(instance) {
        const res = await fetch(this.getReleasesAPI(instance), {
            cache: "no-store"
        });

        const data = await res.json();
        return this.normalizeReleases(instance.serviceType, data);
    };

    async get(instance, tag) {
        const releases = await this.list(instance);
        return releases.find(r => r.tag_name === tag);
    };

    async patchnotes(instance, tag) {
        const release = await this.get(instance, tag);
        const plaintxt = release.body;
        if (!plaintxt) return "No patch notes found!";
        const html = nmd(plaintxt);
        return html;
    };
};