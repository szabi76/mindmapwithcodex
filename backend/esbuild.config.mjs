import { build } from 'esbuild';
import { readdirSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const entryDir = join(process.cwd(), 'src/handlers');
const entries = readdirSync(entryDir)
  .filter((file) => file.endsWith('.ts'))
  .map((file) => join(entryDir, file));

const outdir = join(process.cwd(), 'dist');
if (!existsSync(outdir)) {
  mkdirSync(outdir, { recursive: true });
}

await Promise.all(
  entries.map((entry) =>
    build({
      entryPoints: [entry],
      bundle: true,
      platform: 'node',
      target: ['node20'],
      outdir,
      format: 'esm',
      sourcemap: true,
      minify: false,
      external: ['@aws-sdk/*']
    })
  )
);
