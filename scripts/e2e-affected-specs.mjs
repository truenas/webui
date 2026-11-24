#!/usr/bin/env node
// Picks the E2E specs a pull request's changes can break, so a PR run does not
// spend two appliances on the whole suite for a change to one page.
//
// Reads the changed paths, one per line, on stdin. Prints JSON:
//   { "full": true, "reason": "…" }                     run everything
//   { "full": false, "specs": ["e2e/tests/…", …] }      run only these
//
// It errs towards the whole suite: any changed file outside a page area that
// e2e/affected-specs.json maps (shared modules, services, the store, e2e
// support code, dependencies, …) runs everything, and so does a map entry
// that matches no spec, since that means the map has gone stale. Master and
// the nightly always run everything, so whatever a PR run skips is still
// caught within a day.
//
// A file's area is not enough on its own: page areas import each other's
// components (the dataset details card renders sharing's tier status, the
// services list opens iSCSI and NVMe-oF forms). So the picker also follows
// static imports backwards from each changed file and adds the area of every
// file that depends on it, directly or not. Reaching a file outside every
// area (a shared module, the store, …) runs everything. Route files are dead
// ends: mounting a component at a URL adds no page beyond the component's own.
//
// Plain Node with no dependencies: e2e.yml's plan job runs it before
// anything is installed.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, normalize, relative } from 'node:path';

const testsDir = 'e2e/tests';

// The same exclusions as e2e.yml's `paths`: nothing the suite runs against.
const ignored = [
  /^src\/assets\/i18n\//,
  /^src\/.*\.spec\.ts$/,
  /^e2e\/docs\//,
  /^e2e\/(CLAUDE|README)\.md$/,
];

function listSpecs(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return listSpecs(path);
    }
    return entry.name.endsWith('.e2e.ts') ? [relative(testsDir, path)] : [];
  });
}

function listSources(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return listSources(path);
    }
    return path.endsWith('.ts') && !path.endsWith('.spec.ts') ? [path] : [];
  });
}

const staticImport = /(?:^|[;\s])(?:import|export)\s+(?:type\s+)?(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g;
const lazyImport = /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;

// The source files `source` imports through `statement`, resolved to paths.
function importsOf(source, statement, known) {
  return [...readFileSync(source, 'utf8').matchAll(statement)].flatMap(([, specifier]) => {
    let base;
    if (specifier.startsWith('app/')) {
      base = `src/${specifier}`;
    } else if (specifier.startsWith('.')) {
      base = normalize(join(dirname(source), specifier));
    } else {
      return [];
    }
    const target = [`${base}.ts`, `${base}/index.ts`, base].find((candidate) => known.has(candidate));
    return target ? [target] : [];
  });
}

// Maps each source file to the files that import or re-export it, lazily or
// not (user-directory.service.ts lazy-loads the user form for every user
// picker). A route file's lazy `import()` only loads a page, and that adds
// nothing a route file would (see dependents()).
function buildImporters(sources) {
  const known = new Set(sources);
  const importers = new Map();
  for (const source of sources) {
    const targets = importsOf(source, staticImport, known);
    if (!source.endsWith('.routes.ts')) {
      targets.push(...importsOf(source, lazyImport, known));
    }
    for (const target of targets) {
      if (!importers.has(target)) {
        importers.set(target, new Set());
      }
      importers.get(target).add(source);
    }
  }
  return importers;
}

// Every file that depends on `path`, directly or through other files, plus
// `path` itself. A template or stylesheet counts as its component.
function dependents(path, importers) {
  const start = path.replace(/\.(html|s?css)$/, '.ts');
  const seen = new Set([path, start]);
  const queue = [start];
  while (queue.length) {
    for (const importer of importers.get(queue.pop()) ?? []) {
      if (!seen.has(importer) && !importer.endsWith('.routes.ts')) {
        seen.add(importer);
        queue.push(importer);
      }
    }
  }
  return seen;
}

function pick(changed, map, specs, sources) {
  const known = new Set(sources);
  const importers = buildImporters(sources);
  const areas = Object.keys(map.areas).sort((a, b) => b.length - a.length);
  const areaOf = (path) => areas.find((prefix) => path.startsWith(prefix));
  const patterns = new Set(map.always);

  for (const path of changed) {
    if (ignored.some((pattern) => pattern.test(path))) {
      continue;
    }

    // A changed spec runs itself; a deleted one has nothing left to run.
    if (path.startsWith(`${testsDir}/`) && path.endsWith('.e2e.ts')) {
      if (existsSync(path)) {
        patterns.add(`^${relative(testsDir, path).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
      }
      continue;
    }

    if (!areaOf(path)) {
      return { full: true, reason: `${path} is outside every mapped page area` };
    }
    // A partial has no component of its own, and any stylesheet in any area
    // can @import it, so there is no area to narrow to.
    if (/(^|\/)_[^/]*\.scss$/.test(path)) {
      return { full: true, reason: `${path} is a stylesheet partial, which any area can import` };
    }
    for (const dependent of dependents(path, importers)) {
      const area = areaOf(dependent);
      if (!area) {
        const reason = `${path} is imported, directly or not, by ${dependent}, outside every mapped page area`;
        return { full: true, reason };
      }
      map.areas[area].forEach((pattern) => patterns.add(pattern));
    }

    // A changed route file can break every page it mounts, and it mounts
    // components from other areas too (credentials.routes.ts mounts directory
    // services). Mounted files outside every area are guards and the like,
    // which a change to the route file itself does not change.
    if (path.endsWith('.routes.ts') && known.has(path)) {
      for (const mounted of [...importsOf(path, staticImport, known), ...importsOf(path, lazyImport, known)]) {
        map.areas[areaOf(mounted)]?.forEach((pattern) => patterns.add(pattern));
      }
    }
  }

  const picked = new Set();
  for (const pattern of patterns) {
    const regex = new RegExp(pattern);
    const matches = specs.filter((spec) => regex.test(spec));
    if (!matches.length) {
      return { full: true, reason: `e2e/affected-specs.json pattern ${pattern} matches no spec` };
    }
    matches.forEach((spec) => picked.add(`${testsDir}/${spec}`));
  }

  return { full: false, specs: [...picked].sort() };
}

const changed = readFileSync(0, 'utf8').split('\n').map((line) => line.trim()).filter(Boolean);
const map = JSON.parse(readFileSync('e2e/affected-specs.json', 'utf8'));
console.log(JSON.stringify(pick(changed, map, listSpecs(testsDir), listSources('src/app'))));
