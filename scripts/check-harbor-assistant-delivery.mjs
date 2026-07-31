import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const fail = (message) => {
  console.error(message);
  process.exitCode = 1;
};
const includes = (path, text) => read(path).includes(text);

const packageJson = JSON.parse(read('package.json'));
const angularJson = JSON.parse(read('angular.json'));
const buildConfig = angularJson.projects['truenas-scale-ui'].architect.build.configurations['harbornavi-k3'];

if (!packageJson.scripts['build:harbornavi-k3']) {
  fail('Missing build:harbornavi-k3 package script.');
}

if (!buildConfig) {
  fail('Missing Angular harbornavi-k3 build configuration.');
} else {
  if (buildConfig.tsConfig !== 'src/tsconfig.harbornavi.app.json') {
    fail('HarborNavi build must use src/tsconfig.harbornavi.app.json.');
  }

  const replacements = new Map(buildConfig.fileReplacements.map((item) => [item.replace, item.with]));
  const expected = new Map([
    ['src/app/app.component.ts', 'src/app/app.component.harbornavi.ts'],
    ['src/app/app.routes.ts', 'src/app/app.routes.harbornavi.ts'],
    ['src/main.ts', 'src/main.harbornavi.ts'],
    [
      'src/app/pages/harbor-assistant/services/harbor-assistant-api-prefix.ts',
      'src/app/pages/harbor-assistant/services/harbor-assistant-api-prefix.harbornavi.ts',
    ],
    [
      'src/app/modules/page-header/page-title-header/page-header.component.ts',
      'src/app/modules/page-header/page-title-header/page-header.component.harbornavi.ts',
    ],
    [
      'src/app/pages/file-manager/folder-picker-dialog/folder-picker-dialog.component.ts',
      'src/app/pages/file-manager/folder-picker-dialog/folder-picker-dialog.component.harbornavi.ts',
    ],
  ]);
  for (const [replace, withPath] of expected) {
    if (replacements.get(replace) !== withPath) {
      fail(`Missing HarborNavi file replacement: ${replace} -> ${withPath}`);
    }
  }
}

const harbornaviRoutes = read('src/app/app.routes.harbornavi.ts');
const harbornaviMain = read('src/main.harbornavi.ts');
for (const forbidden of ['AuthGuard', 'WebSocketConnectionGuard', 'SigninComponent', 'PingService', 'ApiService', 'rootEffects', 'ServiceWorkerService', '/api/current', '192.168.3.82']) {
  if (harbornaviRoutes.includes(forbidden) || harbornaviMain.includes(forbidden)) {
    fail(`HarborNavi app profile must not depend on ${forbidden}.`);
  }
}

if (!includes('src/app/pages/harbor-assistant/services/harbor-assistant-api-prefix.harbornavi.ts', '/api/beacon')) {
  fail('HarborNavi API prefix must use /api/beacon.');
}

const assistantComponent = read('src/app/pages/harbor-assistant/harbor-assistant.component.ts');
const assistantTemplate = read('src/app/pages/harbor-assistant/harbor-assistant.component.html');
for (const required of [
  "id: 'search'",
  "id: 'camera'",
  "id: 'messages'",
  "id: 'home-assistant'",
  "id: 'settings'",
  'Event intelligence',
  'Message connections',
  'Home Assistant',
]) {
  if (!assistantComponent.includes(required) && !assistantTemplate.includes(required)) {
    fail(`HarborNavi K3 Assistant must keep full product surface: ${required}`);
  }
}

const packaging = read('scripts/harbornavi-k3/build-deb.sh');
for (const required of [
  'Package: $package_name',
  'harboros-beacon (>= $beacon_min_version)',
  'harborlink (>= $harborlink_min_version)',
  'release-manifest.json',
  '/usr/share/harbornavi/webui',
  '/etc/nginx/conf.d/harbornavi-webui.conf',
  'location ^~ /api/harbor-link/media/',
  'location ^~ /api/harbor-link/hls/',
  'location /api/beacon/',
  'proxy_pass http://127.0.0.1:4174',
  'location /api/harbor-gate/',
  'proxy_pass http://127.0.0.1:8787',
]) {
  if (!packaging.includes(required)) {
    fail(`HarborNavi package script missing: ${required}`);
  }
}

const mediaReleaseVersions = read('scripts/harbornavi-k3/media-stack-release.env');
for (const required of [
  'HARBORNAVI_MEDIA_RELEASE_ID=',
  'HARBORNAVI_BEACON_RELEASE_VERSION=',
  'HARBORLINK_RELEASE_VERSION=',
]) {
  if (!mediaReleaseVersions.includes(required)) {
    fail(`HarborNavi media release contract missing: ${required}`);
  }
}

for (const forbidden of ['/api/harbor-assistant', '192.168.3.82']) {
  for (const path of [
    'src/app/app.routes.harbornavi.ts',
    'src/app/app.component.harbornavi.ts',
    'src/app/pages/harbor-assistant/services/harbor-assistant-api-prefix.harbornavi.ts',
    'src/app/pages/file-manager/folder-picker-dialog/folder-picker-dialog.component.harbornavi.ts',
    'scripts/harbornavi-k3/build-deb.sh',
    'docs/harbornavi-k3-webui.md',
  ]) {
    if (includes(path, forbidden)) {
      fail(`${path} must not contain ${forbidden}.`);
    }
  }
}

if (!process.exitCode) {
  console.log('Harbor Assistant HarborNavi/K3 delivery checks passed.');
}
