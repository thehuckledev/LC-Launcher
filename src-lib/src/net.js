class Net {
    static async request(callID, ext, config) {
        let url = config.url;
        if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;

        const fetchOptions = {
            method: config.method || 'GET',
            headers: config.headers,
        };

        if (config.data) {
            if (typeof config.data === 'object' && !(config.data instanceof FormData)) {
                fetchOptions.headers['Content-Type'] = fetchOptions.headers['Content-Type'] || 'application/json';
                fetchOptions.body = JSON.stringify(config.data);
            } else {
                fetchOptions.body = config.data;
            };
        };

        let timeoutID;
        if (config.timeout > 0) {
            const controller = new AbortController();
            fetchOptions.signal = controller.signal;
            timeoutID = setTimeout(() => controller.abort(), config.timeout);
        };

        const response = await fetch(url, fetchOptions);
        if (timeoutID) clearTimeout(timeoutID);

        const contentType = response.headers.get('content-type') || '';
        let responseData;
        if (contentType.includes('application/json')) responseData = await response.json();
        else responseData = await response.text();

        return {
            data: responseData,
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            config
        };
    };

    static async download(callID, ext, config) {
        let url = config.url;
        if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;

        const { savePath } = config;

        const response = await fetch(url, { method: 'GET' });
        if (!response.ok) throw new Error(`HTTP Status: ${response.status}`);

        const totalBytes = parseInt(response.headers.get('content-length') || '0', 10);
        
        const writer = Bun.file(savePath).writer();
        const reader = response.body.getReader();
        
        let downloadedBytes = 0;
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            writer.write(value);
            downloadedBytes += value.length;

            if (totalBytes > 0) {
                const percent = (downloadedBytes / totalBytes) * 100;
                ext.sendMessage('downloadProgress', {
                    callID,
                    percent: Math.floor(percent),
                    downloadedBytes,
                    totalBytes
                });
            };
        };

        writer.end();

        return { success: true, savePath };
    };
};

module.exports = Net;