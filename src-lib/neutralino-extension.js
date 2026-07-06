// NeutralinoExtension
//
// A Bun extension engine for Neutralino.
//
// (c)2023-2024 Harald Schneider - marketmix.com

const EventEmitter = require('events');

class NeutralinoExtension extends EventEmitter {
    constructor(debug=false) {
        super();

        this.version = '1.0.4';
        this.debug = debug;

        return this._init();
    }

    async _init() {

        this.debugTermColors = true;             // Use terminal colors
        this.debugTermColorIN = '\x1b[32m';      // Green: All incoming events, except function calls
        this.debugTermColorCALL = '\x1b[91m';    // Red: Incoming function calls
        this.debugTermColorOUT = '\x1b[33m';     // Yellow: Outgoing events
        this.termOnWindowClose = true;   // Terminate on windowCloseEvent message

        if(Bun.argv.length > 2) {
            this.port = Bun.argv[2].split('=')[1];
            this.token = Bun.argv[3].split('=')[1];
            this.connectToken = '';
            this.idExtension = Bun.argv[4].split('=')[1];
            this.urlSocket = `ws://127.0.0.1:${this.port}?extensionId=${this.idExtension}`;
        }
        else {
            let conf =  await Bun.stdin.json();
            this.port = conf.nlPort;
            this.token = conf.nlToken;
            this.connectToken = conf.nlConnectToken;
            this.idExtension = conf.nlExtensionId;
            this.urlSocket = `ws://127.0.0.1:${this.port}?extensionId=${this.idExtension}&connectToken=${this.connectToken}`;
        }

        this.socket = undefined;
        this.debugLog(`${this.idExtension} running on port ${this.port}`);
        return this;
    }

    sendMessage(event, data=null) {
        //
        // Add a data package to the sending queue.
        // Triggers an event in the parent app.
        // :param event: Event name as string
        // :param data: Event data
        // :return: --

        let d = {
            "id": crypto.randomUUID(),
            "method": 'app.broadcast',
            "accessToken": this.token,
            "data": {
                "event": event,
                "data": data
            }
        }
        if (this.socket.readyState === WebSocket.OPEN) {
            let msg = JSON.stringify(d);
            this.socket.send(msg);
            this.debugLog(`${msg}`, 'out');
        } else {
            console.warn("WebSocket send: Socket is not connected.");
        }
    }

    run(onReceiveMessage) {
        //
        //  Socket-handler main loop. Sends and receives messages.
        //  :param onReceiveMessage: Callback for incoming messages

        const WebSocket = require('ws');
        this.socket = new WebSocket(this.urlSocket);
        let self = this;

        this.socket.on('open', () => {
            console.log('WebSocket ready');
            console.log(`Running on port ${self.port}`);
        });

        this.socket.on('message', (data) => {
            let msg = data.toString('utf-8');

            try {
                msg = JSON.parse(msg);
            }
            catch (e) {}

            try {
                if(self.termOnWindowClose) {
                    if(msg.event === 'windowClose' || msg.event === 'appClose') {
                        try {
                            self.emit('close');
                            setTimeout(() => process.exit(0), 100);
                        }
                        catch (e) {}
                        return;
                    }
                }
            }
            catch (e) {}

            self.debugLog(msg, 'in');
            onReceiveMessage(msg);
        });

        this.socket.on('close', (code, reason) => {
            console.log(`WebSocket closed: ${code} - ${reason}`);
            try {
                self.emit('close');
            } catch (e) {};
        });

        this.socket.on('error', (error) => {
            console.error(`WebSocket Error: ${error}`);
        });
    }
    isEvent(e, eventName) {
        //
        // Checks data package for a particular event.

        if('event' in e && e.event === eventName) {
            return true;
        }
        return false;
    }

    debugLog(msg, tag='info') {
        //
        // Log messages to terminal.
        // :param msg: Message string
        // :param tag: Type of log entry
        // :return: --

        let cIN = '';
        let cCALL = '';
        let cOUT = '';
        let cRST = '';

        if(this.debugTermColors) {
            cIN = this.debugTermColorIN;
            cCALL = this.debugTermColorCALL;
            cOUT = this.debugTermColorOUT;
            cRST = '\x1b[0m';
        }

        if(!this.debug) {
            return;
        }

        try {
            msg = JSON.stringify(msg);
        }
        catch (e) {}

        if(tag === 'in') {
            if(msg.includes('runBun')) {
                console.log(`${cCALL}IN:  ${msg}${cRST}`);
            }
            else {
                console.log(`${cIN}IN:  ${msg}${cRST}`);
            }
            return;
        }
        if(tag === 'out') {
            console.log(`${cOUT}OUT: ${msg}${cRST}`);
            return;
        }
        //console.log(msg);
    }
}

module.exports = NeutralinoExtension;