import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from "@rollup/plugin-json";

export default {
    input: 'src/main.ts',
    output: {
        file: 'dist/main.js',
        format: 'cjs',
    },
    plugins: [
        commonjs(),
        json(),
        resolve(),
        typescript()
    ],
    external: ['obsidian'],
};
