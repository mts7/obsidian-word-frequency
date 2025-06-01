import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default {
    input: 'src/main.ts',
    output: {
        file: 'dist/main.js',
        format: 'cjs',
    },
    plugins: [
        resolve(),
        commonjs({
            include: /node_modules/,
            requireReturnsDefault: 'auto',
        }),
        json(),
        typescript()
    ],
    external: ['obsidian'],
};
