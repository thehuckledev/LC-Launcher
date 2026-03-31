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
                manualChunks: {
                    vendor: ['preact']
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