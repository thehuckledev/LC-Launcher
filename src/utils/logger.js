import Neutralino from "@neutralinojs/lib";

export async function log(message, type = "INFO") {
    try {
        const msg = typeof message === 'object' ? JSON.stringify(message) : message;
        await Neutralino.debug.log(message, type);
    } catch(e) {};
};

export function startLogger() {
    window._console = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        debug: console.debug
    };

    console.log = (...args) => {
        window._console.log(...args);
        log(args.join(' '), "INFO");
    };

    console.warn = (...args) => {
        window._console.warn(...args);
        log(args.join(' '), "WARNING");
    };

    console.error = (...args) => {
        window._console.error(...args);
        log(args.join(' '), "ERROR");
    };

    console.debug = (...args) => {
        window._console.debug(...args);
        log(args.join(' '), "INFO");
    };

    window.onerror = (message, source, lineno, colno, error) => {
        const stack = error?.stack ? `\nStack: ${error.stack}` : "";
        log(`ERROR: ${message} at ${source}:${lineno}:${colno}${stack}`, "ERROR");
    };

    window.onunhandledrejection = (event) => {
        let stack = "";
        let message = "Unknown Promise Rejection";

        if (event.reason instanceof Error) {
            message = event.reason.message;
            stack = `\nStack: ${event.reason.stack}`;
        } else if (typeof event.reason === 'object' && event.reason !== null) {
            message = JSON.stringify(event.reason);
        } else if (event.reason) {
            message = event.reason;
        };

        log(`PROMISE_FAIL: ${message}${stack}\n`, "ERROR");
    };
};