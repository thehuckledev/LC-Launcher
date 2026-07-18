import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import preact from '@preact/preset-vite';

export default defineConfig({
    root: 'src',
    server: {
        port: 3000,
        strictPort: true,
        fs: {
            strict: false
        }
    },
    build: {
        emptyOutDir: true,
        outDir: '../public',
        target: 'es2020',
        minify: 'esbuild',
        sourcemap: false,
        assetsInlineLimit: 0,
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    if (id.includes("node_modules") || id.includes("vendor")) {
                        if (id.includes("preact")) return "preact";
                        else if (id.includes("@neutralinojs/lib")) return "njs";
                        else if (id.includes("socket.io")) return "socket-io";

                        return "vendor";
                    } else {
                        if (id.includes("defaultInstances.js")) return "instances";
                    };
                }
            }
        }
    },
    plugins: [
        preact(),
        viteStaticCopy({
            targets: [
                {
                    src: 'assets/icon.png',
                    dest: 'assets'
                }
            ]
        })
    ]
});