import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/thefinger.js'),
            name: 'TheFinger',
            fileName: (format) => format === 'iife' ? 'thefinger.min.js' : `thefinger.${format}.js`,
            formats: ['es', 'umd', 'iife']
        }
    },
    server: {
        open: true
    }
}); 