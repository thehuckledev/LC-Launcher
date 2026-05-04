import Neutralino from "@neutralinojs/lib";

export async function log(message, type = "INFO") {
    try {
        const msg = typeof message === 'object' ? JSON.stringify(message) : message;
        await Neutralino.debug.log(msg, type);
    } catch(e) {};
};

export function startLogger() {
    window._console = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        debug: console.debug
    };

    const formatArgs = (args) => {
        return args.map(arg => 
            typeof arg === 'object' && arg !== null 
                ? JSON.stringify(arg, null, 2) 
                : arg
        ).join(' ');
    };

    console.log = (...args) => {
        window._console.log(...args);
        log(formatArgs(args), "INFO");
    };

    console.warn = (...args) => {
        window._console.warn(...args);
        log(formatArgs(args), "WARNING");
    };

    console.error = (...args) => {
        window._console.error(...args);
        log(formatArgs(args), "ERROR");
    };

    console.debug = (...args) => {
        window._console.debug(...args);
        log(formatArgs(args), "INFO");
    };

    window.onerror = (message, source, lineno, colno, error) => {
        const stack = error?.stack ? `\nStack: ${error.stack}` : "";
        const fullMessage = `RUNTIME ERROR: ${message}\nFile: ${source}\nLine: ${lineno}:${colno}${stack}`;
        log(fullMessage, "ERROR");
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