import { build } from 'esbuild';
import { chmod, writeFile } from 'fs/promises';

async function buildCli() {
  // Build main bundle
  await build({
    entryPoints: ['index.ts'],
    bundle: true,
    platform: 'node',
    target: ['esnext'],
    format: 'esm',
    outfile: 'dist/index.js',
    external: ['readline', 'fs', 'path', 'os', 'util', 'events', 'stream', 'tty', 'bun'],
    minify: true,
    sourcemap: true,
  });

  // Create shebang file
  await writeFile(
    'dist/cli.js',
    '#!/usr/bin/env bun\nimport "./index.js";\n',
    { mode: 0o755 }
  );

  // Make both files executable
  await chmod('dist/index.js', 0o755);
  await chmod('dist/cli.js', 0o755);
}

buildCli().catch(console.error);