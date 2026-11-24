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
// Plain Node with no dependencies: e2e.yml's plan job runs it before
// anything is installed.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

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

function pick(changed, map, specs) {
  const areas = Object.keys(map.areas).sort((a, b) => b.length - a.length);
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

    const area = areas.find((prefix) => path.startsWith(prefix));
    if (!area) {
      return { full: true, reason: `${path} is outside every mapped page area` };
    }
    map.areas[area].forEach((pattern) => patterns.add(pattern));
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
console.log(JSON.stringify(pick(changed, map, listSpecs(testsDir))));
