import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
const zipName = `page-refresh-pro-v${version}.zip`;
const zipPath = path.join(root, zipName);

const DEV_MARKERS = ['localhost:5173', '@vite/client', '@react-refresh'];

function assertProductionBuild(dir) {
  if (!fs.existsSync(path.join(dir, 'manifest.json'))) {
    throw new Error(`dist/manifest.json not found. Run "npm run build" first.`);
  }

  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const name of fs.readdirSync(current)) {
      const entry = path.join(current, name);
      const stat = fs.statSync(entry);
      if (stat.isDirectory()) {
        stack.push(entry);
        continue;
      }
      if (!/\.(js|html|json)$/i.test(name)) {
        continue;
      }
      const text = fs.readFileSync(entry, 'utf8');
      const marker = DEV_MARKERS.find((value) => text.includes(value));
      if (marker) {
        throw new Error(
          `Dev build marker "${marker}" found in ${path.relative(root, entry)}. ` +
            'Stop "npm run dev", run "npm run build", then package again.',
        );
      }
    }
  }
}

assertProductionBuild(distDir);

if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

if (process.platform === 'win32') {
  const command =
    `Compress-Archive -Path '${distDir.replace(/'/g, "''")}\\*' ` +
    `-DestinationPath '${zipPath.replace(/'/g, "''")}' -Force`;
  const result = spawnSync('powershell', ['-NoProfile', '-Command', command], { stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
} else {
  const result = spawnSync('zip', ['-r', zipPath, '.'], { cwd: distDir, stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(`Created ${zipName}`);
console.log('Load unpacked: extract the zip, then select the folder that contains manifest.json.');
