const { build } = require("bun");
const fs = require("node:fs");
const { mkdir } = require("node:fs/promises");
const { join } = require("node:path");
const { execSync } = require("child_process");

const ENTRY = "src-lib/main.js";
const OUT_DIR = "libs";

const TARGETS = [
    ["bun-darwin-x64", "osx-x64"],
    ["bun-darwin-arm64", "osx-arm64"],

    ["bun-linux-x64", "linux-x64"],
    ["bun-linux-arm64", "linux-arm64"],

    ["bun-windows-x64", "windows-x64"],
];

(async() => {

const targetArg = process.argv[2];

const buildList = targetArg
    ? TARGETS.filter(([target]) => target.includes(targetArg))
    : TARGETS;

if (buildList.length === 0) {
    console.error(`Error: Target '${targetArg}' not found`);
    process.exit(1);
};

const cwd = join(__dirname, "../src-lib");
if (!fs.existsSync(join(cwd, "node_modules"))) {
    console.log("\nInstalling Bun Modules...");
    execSync("bun i", { stdio: "ignore", cwd });
};

await mkdir(OUT_DIR, { recursive: true });

for (const [target, fileName] of buildList) {
    const isWindows = target.includes("windows");
    const ext = isWindows ? ".exe" : "";
    const outfile = join(OUT_DIR, `lcLib-${fileName}${ext}`);

    console.log(`Building for ${target}...`);

    await Bun.build({
        entrypoints: [ ENTRY ],
        minify: true,
        sourcemap: "none",
        bytecode: !isWindows,
        compile: {
            target: target,
            outfile,
        }
    });

    // this just breaks bun for every os :/
    /*if (target.includes("linux")) {
        try {
            console.log(`Compressing ${target} with UPX...`);
            execSync(`upx --best --lzma "${outfile}"`, { stdio: "ignore" });
        } catch (e) {
            console.log(`Make sure you have UPX installed on your system for smaller builds`);
        };
    };*/

    if (target.includes("darwin") && process.platform === "darwin")
        execSync(`codesign --sign - --force --preserve-metadata=entitlements,requirements,flags,runtime "${outfile}"`, { stdio: "ignore" });

    console.log(`Built ${target}\n`);
};

console.log(`All targets built!`);

})();