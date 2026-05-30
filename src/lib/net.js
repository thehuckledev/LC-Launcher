export default class Net {
    static async request(config) {
        return await lib.run(null, 'net', 'request', {
            ...config,
            method: config.method || 'GET',
        });
    };

    static async download(url, savePath, config = {}, id) {
        return await lib.run(id, 'net', 'download', {
            ...config,
            url,
            savePath
        });
    };

    static get(url, config = {}) { return this.request({ ...config, method: 'GET', url }); };
    static delete(url, config = {}) { return this.request({ ...config, method: 'DELETE', url }); };
    static head(url, config = {}) { return this.request({ ...config, method: 'HEAD', url }); };
    static post(url, data, config = {}) { return this.request({ ...config, method: 'POST', url, data }); };
    static put(url, data, config = {}) { return this.request({ ...config, method: 'PUT', url, data }); };
    static patch(url, data, config = {}) { return this.request({ ...config, method: 'PATCH', url, data }); };
};