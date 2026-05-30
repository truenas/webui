import { readFileSync } from 'node:fs';

const checks = [];

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

function requireIncludes(path, needle, description) {
  const source = read(path);
  if (!source.includes(needle)) {
    checks.push(`${path}: missing ${description}`);
  }
}

function requireNotIncludes(path, needle, description) {
  const source = read(path);
  if (source.includes(needle)) {
    checks.push(`${path}: still contains ${description}`);
  }
}

function requirePattern(path, pattern, description) {
  const source = read(path);
  if (!pattern.test(source)) {
    checks.push(`${path}: missing ${description}`);
  }
}

const beaconSourceFiles = [
  'src/app/pages/harbor-assistant/services/harbor-assistant-api.service.ts',
  'src/app/pages/harbor-assistant/shared/harbor-assistant-content-api.service.ts',
  'src/app/pages/harbor-assistant/shared/harbor-assistant-results.ts',
];

for (const path of beaconSourceFiles) {
  requireIncludes(path, '/api/beacon', 'same-origin Beacon prefix');
  requireNotIncludes(path, 'http://127.0.0.1:4174', 'direct Beacon loopback URL');
  requireNotIncludes(path, 'http://localhost:4174', 'direct Beacon localhost URL');
}

requireIncludes(
  'src/app/pages/harbor-assistant/utils/harborgate-urls.ts',
  '/api/harbor-gate',
  'same-origin HarborGate prefix',
);
requireNotIncludes(
  'src/app/pages/harbor-assistant/utils/harborgate-urls.ts',
  'http://127.0.0.1:8787',
  'direct HarborGate loopback URL',
);

requirePattern(
  'docker/nginx.conf',
  /location\s+=\s+\/api\/beacon\s*\{[\s\S]*?proxy_pass\s+http:\/\/127\.0\.0\.1:4174;/,
  'exact /api/beacon nginx proxy to HarborBeacon',
);
requirePattern(
  'docker/nginx.conf',
  /location\s+\/api\/beacon\/\s*\{[\s\S]*?proxy_pass\s+http:\/\/127\.0\.0\.1:4174;/,
  'prefix /api/beacon/ nginx proxy to HarborBeacon',
);
requirePattern(
  'docker/nginx.conf',
  /location\s+=\s+\/api\/harbor-gate\s*\{[\s\S]*?proxy_pass\s+http:\/\/127\.0\.0\.1:8787;/,
  'exact /api/harbor-gate nginx proxy to HarborGate',
);
requirePattern(
  'docker/nginx.conf',
  /location\s+\/api\/harbor-gate\/\s*\{[\s\S]*?proxy_pass\s+http:\/\/127\.0\.0\.1:8787;/,
  'prefix /api/harbor-gate/ nginx proxy to HarborGate',
);

requireIncludes('proxy.config.json.template', '"/api/beacon"', 'dev proxy Beacon entry');
requireIncludes('proxy.config.json.template', 'http://127.0.0.1:4174', 'dev proxy Beacon target');
requireIncludes('proxy.config.json.template', '"/api/harbor-gate"', 'dev proxy HarborGate entry');
requireIncludes('proxy.config.json.template', 'http://127.0.0.1:8787', 'dev proxy HarborGate target');

requireIncludes(
  'docs/harbor-assistant-iso-nginx-patch.md',
  '/api/beacon/*        -> harboros-beacon.service on 127.0.0.1:4174',
  'ISO Beacon service entry',
);
requireIncludes(
  'docs/harbor-assistant-iso-nginx-patch.md',
  '/api/harbor-gate/*   -> harboros-im-gate.service on 127.0.0.1:8787',
  'ISO HarborGate service entry',
);
requireIncludes(
  'docs/harbor-assistant-live-e2e-matrix.md',
  'harborassistant-live-solidify-20260529',
  'solidification artifact id in live evidence',
);
requireIncludes(
  'docs/harbor-assistant-live-e2e-matrix.md',
  'network blocker',
  'network blocker row for deferred .82 live install',
);
requireIncludes(
  'docs/harbor-assistant-webui-integration.md',
  'The live hotfix path `/mnt/.ix-apps/harbor-webui-live/current` is rollback',
  'hotfix path marked rollback-only',
);

if (checks.length) {
  console.error('Harbor Assistant delivery check failed:');
  for (const check of checks) {
    console.error(`- ${check}`);
  }
  process.exit(1);
}

console.log('Harbor Assistant delivery paths are solidified.');
