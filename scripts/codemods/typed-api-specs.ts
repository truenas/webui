#!/usr/bin/env tsx

/**
 * Moves specs from `mockApi()` to `mockTypedApi()` — the mechanical part of migrating a feature
 * area to the typed API client. See `typed-api-specs.transform.ts` for the shapes it rewrites and
 * `docs/devs/typed-api-client.md` for where it fits.
 *
 *   yarn codemod:typed-api-specs src/app/pages/sharing
 *   yarn codemod:typed-api-specs --dry-run src/app/pages/sharing/nfs/nfs-form/nfs-form.component.spec.ts
 *   yarn codemod:typed-api-specs --keep-legacy 'cloudsync.create,cloudsync.update' src/app/pages/data-protection
 *   yarn codemod:typed-api-specs --only 'keychaincredential.*' src/app/pages/data-protection
 *
 * Paths are spec files or directories (searched for `*.spec.ts`). Run it after the production code
 * in those paths has moved to `TypedApiService`: it rewrites the spec to the double the component
 * now injects, and cannot tell whether it does. `--keep-legacy` names methods (comma-separated,
 * `*` wildcards allowed) that the code under test still calls on `ApiService`; they stay on
 * `mockApi()`. `--only` is the other way round, for when a shared service moved and its consumers
 * did not: only the named methods move, and everything else stays.
 *
 * What it could not convert is printed as `file:line  reason`. Follow up with `yarn lint:fix` on
 * the changed files, `tsc` (typed fixtures are checked against the API directory, and a fixture
 * the legacy directory let through is a finding, not noise) and the specs themselves.
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { join, relative } from 'path';
import { isExemptPath } from '../api-migration-areas.mjs';
import { transformSpec } from './typed-api-specs.transform';

interface Args {
  dryRun: boolean;
  keepLegacy: RegExp[];
  only: RegExp[];
  paths: string[];
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    dryRun: false, keepLegacy: [], only: [], paths: [],
  };
  const patterns = (list: string): RegExp[] => list.split(',').filter(Boolean).map(toPattern);
  const queue = [...argv];
  while (queue.length) {
    const arg = queue.shift();
    const [option, inline] = arg.split(/[=](.*)/s);
    if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (option === '--keep-legacy' || option === '--only') {
      const list = patterns(inline ?? queue.shift() ?? '');
      (option === '--only' ? args.only : args.keepLegacy).push(...list);
    } else if (arg.startsWith('--')) {
      throw new Error(`Unknown option ${arg}`);
    } else {
      args.paths.push(arg);
    }
  }
  if (!args.paths.length) {
    throw new Error('Usage: yarn codemod:typed-api-specs [--dry-run] [--keep-legacy m1,m2.*] [--only m3.*] <spec file or dir>...');
  }
  return args;
}

function toPattern(method: string): RegExp {
  const escaped = method.trim().replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

function specFiles(path: string): string[] {
  if (statSync(path).isFile()) {
    return [path];
  }
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = join(path, entry.name);
    if (entry.isDirectory()) {
      return entry.name === 'node_modules' ? [] : specFiles(child);
    }
    return entry.name.endsWith('.spec.ts') ? [child] : [];
  });
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const matches = (patterns: RegExp[], method: string): boolean => patterns.some((pattern) => pattern.test(method));
  const keepLegacy = (method: string): boolean => {
    return matches(args.keepLegacy, method) || (args.only.length > 0 && !matches(args.only, method));
  };
  const files = [...new Set(args.paths.flatMap(specFiles))];
  files.sort((a, b) => a.localeCompare(b));

  let changed = 0;
  let noted = 0;
  files.forEach((file) => {
    const name = relative(process.cwd(), file);
    const source = readFileSync(file, 'utf8');
    // The two clients' own modules and doubles test the legacy client on purpose.
    if (isExemptPath(name) || !['mock-api.utils', 'mock-api.service', 'websocket/api.service'].some((module) => source.includes(module))) {
      return;
    }
    const isPartial = args.only.length > 0 || args.keepLegacy.length > 0;
    const result = transformSpec(source, file, isPartial ? { keepLegacy } : {});
    if (result.changed) {
      changed++;
      if (!args.dryRun) {
        writeFileSync(file, result.output);
      }
    }
    if (result.notes.length) {
      noted++;
      result.notes.forEach((note) => console.info(`${name}:${note.line}  ${note.message}`));
    }
  });

  console.info(
    `\n${args.dryRun ? 'Would change' : 'Changed'} ${changed} of ${files.length} spec files; `
    + `${noted} need hand conversion (above).`,
  );
  if (changed && !args.dryRun) {
    console.info('Next: yarn lint:fix on the changed files, a tsc pass, and the specs themselves.');
  }
}

main();
