import nmd from 'nano-markdown';

import { showToast } from '../components/Toast.jsx';

export class Remotes {
    constructor(manager) {
        this.manager = manager;
    };

    getReleasesAPI(instance) {
        const domain = instance.serviceDomain;
        const repo = instance.repo;

        switch (instance.serviceType) {
            case "GITHUB":
                return `https://api.${domain}/repos/${repo}/releases?per_page=150`;

            case "GITLAB":
                return `https://${domain}/api/v4/projects/${encodeURIComponent(repo)}/releases`;

            case "GITEA":
                return `https://${domain}/api/v1/repos/${repo}/releases?limit=150`;
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
        let headers = {
            'User-Agent': 'LC-Launcher',
            'Accept': 'application/json'
        };
        if (instance.serviceType === "GITHUB") {
            headers = {
                ...headers,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2026-03-10'
            };
        };

        const res = await fetch(this.getReleasesAPI(instance), {
            cache: "no-store",
            headers
        });

        const data = await res.json();
        if (!Array.isArray(data)) {
            console.error("API Error or Rate Limit:", data);
            showToast("Error: Release API Error");
            return [];
        };

        let releases = this.normalizeReleases(instance.serviceType, data);
        releases = releases.filter(r => { // filter out server releases
            const tag = (r.tag_name || "").toLowerCase();
            return !tag.includes("server");
        });

        if (releases.length > 0) {
            const latestObj = {
                ...releases[0],
                tag_name: 'latest'
            };
            return [latestObj, ...releases];
        };

        return releases;
    };

    async get(instance, tag) {
        const releases = await this.list(instance);
        if (!Array.isArray(releases)) return null;
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