import { dlopen, FFIType } from "bun:ffi";
import winRemapperHook from "./keyRemapper.cs" with { type: "text" };

const KeyboardMouseInput = { // game uses these
    KEY_FORWARD: 'W',
    KEY_BACKWARD: 'S',
    KEY_LEFT: 'A',
    KEY_RIGHT: 'D',
    KEY_JUMP: 'SPACE',
    KEY_SNEAK: 'LEFTSHIFT',
    KEY_SPRINT: 'CONTROL',
    KEY_INVENTORY: 'E',
    KEY_DROP: 'Q',
    KEY_CRAFTING: 'C',
    KEY_CRAFTING_ALT: 'R',
    KEY_CHAT: 'T',
    KEY_CONFIRM: 'RETURN',
    KEY_CANCEL: 'ESCAPE',
    KEY_TOGGLE_HUD: 'F1',
    KEY_DEBUG_INFO: 'F3',
    KEY_DEBUG_MENU: 'F4',
    KEY_THIRD_PERSON: 'F5',
    KEY_DEBUG_CONSOLE: 'F6',
    KEY_HOST_SETTINGS: 'TAB',
    KEY_FULLSCREEN: 'F11',
    KEY_SCREENSHOT: 'F2',
};

const KeyboardMouseInputLabels = {
    KEY_FORWARD: "Move Forward",
    KEY_BACKWARD: "Move Backward",
    KEY_LEFT: "Strafe Left",
    KEY_RIGHT: "Strafe Right",
    KEY_JUMP: "Jump",
    KEY_SNEAK: "Sneak / Crouch",
    KEY_SPRINT: "Sprint",
    KEY_INVENTORY: "Inventory",
    KEY_DROP: "Drop Item",
    KEY_CRAFTING: "Crafting",
    KEY_CRAFTING_ALT: "Secondary Crafting",
    KEY_CHAT: "Open Chat",
    KEY_CONFIRM: "Confirm",
    KEY_CANCEL: "Cancel / Pause Menu",
    KEY_TOGGLE_HUD: "Toggle HUD",
    KEY_DEBUG_INFO: "Debug Info",
    KEY_DEBUG_MENU: "Debug Menu",
    KEY_THIRD_PERSON: "Toggle Perspective",
    KEY_DEBUG_CONSOLE: "Debug Console",
    KEY_HOST_SETTINGS: "Host / Player List",
    KEY_FULLSCREEN: "Toggle Fullscreen",
    KEY_SCREENSHOT: "Take Screenshot",
};

const KeyboardMouseCategories = [
    {
        category: "Movement",
        actions: [
            "KEY_FORWARD",
            "KEY_BACKWARD",
            "KEY_LEFT",
            "KEY_RIGHT",
            "KEY_JUMP",
            "KEY_SNEAK",
            "KEY_SPRINT"
        ]
    },
    {
        category: "Gameplay",
        actions: [
            "KEY_CRAFTING",
            "KEY_CRAFTING_ALT",
            "KEY_DROP"
        ]
    },
    {
        category: "Inventory & Menus",
        actions: [
            "KEY_INVENTORY",
            "KEY_CONFIRM",
            "KEY_CANCEL",
            "KEY_HOST_SETTINGS"
        ]
    },
    {
        category: "Multiplayer",
        actions: [
            "KEY_CHAT"
        ]
    },
    {
        category: "Interface & Display",
        actions: [
            "KEY_TOGGLE_HUD",
            "KEY_THIRD_PERSON",
            "KEY_FULLSCREEN",
            "KEY_SCREENSHOT"
        ]
    },
    {
        category: "Debug Tools",
        actions: [
            "KEY_DEBUG_INFO",
            "KEY_DEBUG_MENU",
            "KEY_DEBUG_CONSOLE"
        ]
    }
];

const keybindConfig = { ...KeyboardMouseInput };

const MACOS_HID = {
    A: 0x700000004, B: 0x700000005, C: 0x700000006, D: 0x700000007,
    E: 0x700000008, F: 0x700000009, G: 0x70000000A, H: 0x70000000B,
    I: 0x70000000C, J: 0x70000000D, K: 0x70000000E, L: 0x70000000F,
    M: 0x700000010, N: 0x700000011, O: 0x700000012, P: 0x700000013,
    Q: 0x700000014, R: 0x700000015, S: 0x700000016, T: 0x700000017,
    U: 0x700000018, V: 0x700000019, W: 0x70000001A, X: 0x70000001B,
    Y: 0x70000001C, Z: 0x70000001D,

    RETURN: 0x700000028, ESCAPE: 0x700000029, TAB: 0x70000002B,
    SPACE: 0x70000002C, RIGHT: 0x70000004F, LEFT: 0x700000050,
    DOWN: 0x700000051, UP: 0x700000052,

    LEFTSHIFT: 0x7000000E1, RIGHTSHIFT: 0x7000000E5, CONTROL: 0x7000000E0,

    F1: 0x70000003A, F2: 0x70000003B, F3: 0x70000003C, F4: 0x70000003D,
    F5: 0x70000003E, F6: 0x70000003F, F11: 0x700000044, F24: 0x700000073
};

const WIN_VK = {
    A: 0x41, B: 0x42, C: 0x43, D: 0x44, E: 0x45, F: 0x46, G: 0x47,
    H: 0x48, I: 0x49, J: 0x4A, K: 0x4B, L: 0x4C, M: 0x4D, N: 0x4E,
    O: 0x4F, P: 0x50, Q: 0x51, R: 0x52, S: 0x53, T: 0x54, U: 0x55,
    V: 0x56, W: 0x57, X: 0x58, Y: 0x59, Z: 0x5A,

    LEFT: 0x25, UP: 0x26, RIGHT: 0x27, DOWN: 0x28, SPACE: 0x20,
    RETURN: 0x0D, ESCAPE: 0x1B, TAB: 0x09,

    LEFTSHIFT: 0xA0, RIGHTSHIFT: 0xA1, CONTROL: 0xA2,

    F1: 0x70, F2: 0x71, F3: 0x72, F4: 0x73, F5: 0x74, F6: 0x75,
    F11: 0x7A, F24: 0x87
};

const supportedKeys = new Set([
    ...Object.keys(MACOS_HID),
    ...Object.keys(WIN_VK)
]);

let win32 = null;
if (process.platform === "win32")
    win32 = dlopen("user32.dll", {
        GetForegroundWindow: { args: [], returns: FFIType.ptr },
        GetWindowTextW: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 }
    });

class KeyRemapper {
    static isMapped = false;
    static winHookProcess = null;
    static checkInterval = null;

    static getDefaultBindings(callID, ext) {
        return { ...KeyboardMouseInput };
    };

    static getBindingsCatagories(callID, ext) {
        return KeyboardMouseCategories;
    }

    static getBindingsLabels(callID, ext) {
        return KeyboardMouseInputLabels;
    };

    static isValidKey(callID, ext, key) {
        if (!key || typeof key !== 'string') return false;
        return supportedKeys.has(key.toUpperCase());
    };

    static getBindings(callID, ext) {
        return keybindConfig;
    };

    static setBinding(callID, ext, action, inputKey) {
        if (KeyboardMouseInput[action] !== undefined) {
            keybindConfig[action] = inputKey;
            if (this.isMapped) {
                this.toggleRemap(false);
                this.toggleRemap(true);
            };
        };
    };

    static setBindings(callID, ext, bindings) {
        for (const [action, inputKey] of Object.entries(bindings)) {
            if (KeyboardMouseInput[action] !== undefined)
                keybindConfig[action] = inputKey;
        };
        if (this.isMapped) {
            this.toggleRemap(false);
            this.toggleRemap(true);
        };
    };

    static getActiveMappings() {
        const mappings = {};
        for (const [action, inputKey] of Object.entries(keybindConfig)) {
            const targetOutputKey = KeyboardMouseInput[action];
            if (targetOutputKey && inputKey && inputKey.toUpperCase() !== "NONE")
                mappings[inputKey.toUpperCase()] = targetOutputKey.toUpperCase();
        };

        for (const defaultKey of Object.values(KeyboardMouseInput)) {
            const keyUpper = defaultKey.toUpperCase();
            if (!(keyUpper in mappings)) mappings[keyUpper] = "F24";
        };
        return mappings;
    };

    static getActiveWindowTitle() {
        try {
            switch (process.platform) {
                case "darwin": {
                    const script = 'tell application "System Events" to set frontProc to first process whose frontmost is true\ntell application "System Events" to try\nreturn title of window 1 of frontProc\non error\nreturn name of frontProc\nend try';
                    const res = Bun.spawnSync(["osascript", "-e", script]);
                    return res.stdout.toString().trim();
                }
                case "win32": {
                    if (!win32) return "";
                    const hwnd = win32.symbols.GetForegroundWindow();
                    if (!hwnd) return "";
                    const buf = new Uint16Array(256);
                    const len = win32.symbols.GetWindowTextW(hwnd, buf, 256);
                    return String.fromCharCode(...buf.subarray(0, len)).trim();
                }
                case "linux": {
                    const res = Bun.spawnSync(["xdotool", "getactivewindow", "getwindowname"]);
                    return res.stdout.toString().trim();
                }
                default:
                    return "";
            };
        } catch {
            return "";
        };
    };

    static setMacRemap(enable) {
        if (enable) {
            const mappings = Object.entries(this.getActiveMappings()).map(([inputKey, outputKey]) => ({
                HIDKeyboardModifierMappingSrc: MACOS_HID[inputKey],
                HIDKeyboardModifierMappingDst: MACOS_HID[outputKey],
            }));
            const payload = JSON.stringify({ UserKeyMapping: mappings });
            Bun.spawnSync(["hidutil", "property", "--set", payload]);
        } else {
            Bun.spawnSync(["hidutil", "property", "--set", '{"UserKeyMapping":[]}']);
        };
    };

    static setWinRemap(enable) {
        if (enable) {
            if (this.winHookProcess) return;

            const mappingCodes = Object.entries(this.getActiveMappings()).map(([inputKey, outputKey]) => {
                if (WIN_VK[inputKey] && WIN_VK[outputKey])
                    return `_mappings[${WIN_VK[inputKey]}] = (byte)${WIN_VK[outputKey]};`;
                return "";
            }).join("\n");

            const psScript = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms

$winRemapperHook = @"
${winRemapperHook.replace("{MAPPING_CODES}", mappingCodes)}
"@

try {
    Add-Type -TypeDefinition $winRemapperHook -ReferencedAssemblies System.Windows.Forms
    [WinRemapper]::Main()
} catch {
    [System.Windows.Forms.MessageBox]::Show(
        $_.Exception.Message,
        "LC Launcher (Key Remapper) - Execution Error",
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Error
    )
}
`;

            const formattedCMD = Buffer.from(psScript, 'utf16le').toString('base64');
            this.winHookProcess = Bun.spawn(["powershell", "-NoProfile", "-EncodedCommand", formattedCMD]);
        } else {
            if (this.winHookProcess) {
                this.winHookProcess.kill();
                this.winHookProcess = null;
            };
        };
    };

    static setLinuxRemap(enable) {
        if (enable) {
            Object.entries(this.getActiveMappings()).forEach(([inputKey, outputKey]) => {
                Bun.spawnSync(["xmodmap", "-e", `keysym ${inputKey.toLowerCase()} = ${outputKey.toLowerCase()}`]);
            });
        } else {
            Bun.spawnSync(["setxkbmap", "-layout", "us"]);
        };
    };

    static toggleRemap(enable) {
        if (this.isMapped === enable) return;
        this.isMapped = enable;

        switch (process.platform) {
            case "darwin":
                this.setMacRemap(enable);
                break;
            case "win32":
                this.setWinRemap(enable);
                break;
            case "linux":
                this.setLinuxRemap(enable);
                break;
        };
    };

    static checkFocus() {
        const title = this.getActiveWindowTitle();
        if (title.toLowerCase().includes("minecraft") || title.toLowerCase().includes("wine64-preloader")) this.toggleRemap(true);
        else this.toggleRemap(false);
    };

    static start(callID, ext) {
        if (this.checkInterval) return;
        this.checkInterval = setInterval(() => this.checkFocus(), 400);
    };

    static stop(callID, ext) {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        };
        this.toggleRemap(false);
    };
};

process.on('exit', () => {
    KeyRemapper.stop(null, null);
});

module.exports = KeyRemapper;