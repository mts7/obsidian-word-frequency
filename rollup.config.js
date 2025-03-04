import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from "@rollup/plugin-typescript";

export default {
  input: 'src/main.ts',
  output: {
    file: 'dist/main.js',
    format: 'cjs',
  },
  plugins: [
      resolve(),
    commonjs(),
    typescript()
  ],
  external: ['obsidian'],
};

