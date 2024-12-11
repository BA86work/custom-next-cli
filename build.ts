import { build } from 'esbuild';
import { chmod } from 'fs/promises';

async function buildCli() {
  await build({
    entryPoints: ['index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node16',
    outfile: 'dist/index.js',
    format: 'esm',
    banner: {
      js: '//#!/usr/bin/env node',
    },
  });

  // Make the output file executable
  await chmod('dist/index.js', 0o755);
}

buildCli().catch(console.error);