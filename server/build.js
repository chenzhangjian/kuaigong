import * as esbuild from 'esbuild';
import { createRequire } from 'module';
import { copyFileSync, existsSync } from 'fs';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');
const dependencies = pkg.dependencies || {};
const externalList = Object.keys(dependencies).filter(dep => dep !== 'dayjs');
try {
  await esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outdir: 'dist',
    external: externalList,
  });
  
  // 复制 .env 文件到 dist 目录（如果存在）
  if (existsSync('.env')) {
    copyFileSync('.env', 'dist/.env');
    console.log('📄 .env file copied to dist/');
  }
  
  console.log('⚡ Build complete!');
} catch (e) {
  console.error(e);
  process.exit(1);
}
