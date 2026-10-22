#!/usr/bin/env tsx

/**
 * Reports what the E2E suite exercises, as a share of what the UI can do.
 *
 *     yarn e2e                 # each test writes test-results/e2e-coverage/<test>.json
 *     yarn e2e:coverage        # merges them against the inventory below, prints markdown
 *
 * Two measures, both feature-level rather than line-level:
 *
 * - **Middleware methods.** Every method the UI's source names at a call site, against those the
 *   browser actually sent while a test ran. This is the closest mechanical stand-in for "which
 *   features does a test drive": a feature is, roughly, the methods behind it.
 * - **Routes.** Every routed page in the router config, against the URLs the app reached.
 *
 * The recording side is `e2e/support/coverage.ts`. It counts from each test's first navigation or
 * first user input, whichever comes first, so the dashboard every test signs in onto is not
 * credited to all of them.
 *
 * Methods come from the TypeScript AST, in `scripts/e2e-coverage/api-inventory.ts`: call sites and
 * `method:` properties, with literal unions resolved and comments ignored. It is approximate in a
 * known direction. A name built at runtime, or held in anything typed more loosely than a literal
 * union, is not found. When a test sends one anyway, it shows up under "seen in the run but not in
 * the inventory" and joins the denominator, so a gap in the scan can lower the total but never
 * inflate the share covered. Names `@truenas/api-client` sends itself (`auth.login_ex`) land there
 * too, correctly. Uploads go over HTTP rather than the socket, so their methods (`filesystem.put`,
 * `config.upload`) never count.
 *
 * Routes nothing links to are listed in {@link unlinkedRoutes} and reported outside the total.
 *
 * Usage: `yarn e2e:coverage [results-dir] [--out <file>]`. Markdown goes to stdout, and to `--out`
 * when given; a JSON summary is written next to the results as `summary.json`.
 */

import {
  existsSync, readdirSync, readFileSync, writeFileSync,
} from 'fs';
import { dirname, join, relative, resolve } from 'path';
import * as ts from 'typescript';
import { compilerOptionsFrom, scanApiUsage } from './e2e-coverage/api-inventory';

// `yarn` runs scripts from the repository root.
const repoRoot = process.cwd();
const appRoot = join(repoRoot, 'src/app');

interface TestCoverage {
  test: string;
  status: string;
  methods: string[];
  events: string[];
  routes: string[];
}

// ---------------------------------------------------------------------------------------------
// Inventory: routes
// ---------------------------------------------------------------------------------------------

/**
 * Routes in the router config that no user can reach, so no test could cover them. They are left
 * out of the route total and listed on their own, as a stopgap until the route is removed or
 * linked. An entry that matches no route fails the script, so a deleted or renamed route takes
 * its entry with it.
 */
const unlinkedRoutes = new Map<string, string>();

/**
 * Walks the router config from `rootRoutes`, following `children`, spreads and lazy
 * `loadChildren` imports, and returns the full path of every route that renders a page.
 *
 * A route with a component *and* children is a layout shell, not a page: its `''` child, if any,
 * is the page at that path. Redirects are skipped, since nobody lands on them.
 */
class RouteCollector {
  private readonly sources = new Map<string, ts.SourceFile>();
  readonly routes = new Set<string>();

  collect(file: string, exportName: string): Set<string> {
    const routes = this.resolveIdentifier(file, exportName);
    if (routes) {
      this.walkArray(routes.node, routes.file, []);
    }
    return this.routes;
  }

  private source(file: string): ts.SourceFile {
    let source = this.sources.get(file);
    if (!source) {
      source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
      this.sources.set(file, source);
    }
    return source;
  }

  private resolveModule(fromFile: string, specifier: string): string {
    const base = specifier.startsWith('app/')
      ? join(appRoot, specifier.slice('app/'.length))
      : resolve(dirname(fromFile), specifier);
    return `${base}.ts`;
  }

  /** Finds the array a name refers to: declared in `file`, or imported into it. */
  private resolveIdentifier(file: string, name: string): { node: ts.ArrayLiteralExpression; file: string } | null {
    const source = this.source(file);
    for (const statement of source.statements) {
      if (ts.isVariableStatement(statement)) {
        for (const declaration of statement.declarationList.declarations) {
          if (ts.isIdentifier(declaration.name) && declaration.name.text === name
            && declaration.initializer && ts.isArrayLiteralExpression(declaration.initializer)) {
            return { node: declaration.initializer, file };
          }
        }
      }
      if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
        const bindings = statement.importClause?.namedBindings;
        if (bindings && ts.isNamedImports(bindings)) {
          const imported = bindings.elements.find((element) => element.name.text === name);
          if (imported) {
            const target = this.resolveModule(file, statement.moduleSpecifier.text);
            return existsSync(target)
              ? this.resolveIdentifier(target, (imported.propertyName ?? imported.name).text)
              : null;
          }
        }
      }
    }
    return null;
  }

  private walkArray(array: ts.ArrayLiteralExpression, file: string, prefix: string[]): void {
    for (const element of array.elements) {
      if (ts.isSpreadElement(element) && ts.isIdentifier(element.expression)) {
        const spread = this.resolveIdentifier(file, element.expression.text);
        if (spread) {
          this.walkArray(spread.node, spread.file, prefix);
        }
      } else if (ts.isObjectLiteralExpression(element)) {
        this.walkRoute(element, file, prefix);
      }
    }
  }

  private walkRoute(route: ts.ObjectLiteralExpression, file: string, prefix: string[]): void {
    const properties = new Map<string, ts.Expression>();
    for (const property of route.properties) {
      if (ts.isPropertyAssignment(property) && ts.isIdentifier(property.name)) {
        properties.set(property.name.text, property.initializer);
      }
    }
    if (properties.has('redirectTo')) {
      return;
    }

    const pathNode = properties.get('path');
    const path = pathNode && ts.isStringLiteralLike(pathNode) ? pathNode.text : '';
    const fullPath = [...prefix, ...path.split('/').filter(Boolean)];

    const children = properties.get('children');
    const loadChildren = properties.get('loadChildren');

    if (children && ts.isArrayLiteralExpression(children)) {
      this.walkArray(children, file, fullPath);
    } else if (children && ts.isIdentifier(children)) {
      const resolved = this.resolveIdentifier(file, children.text);
      if (resolved) {
        this.walkArray(resolved.node, resolved.file, fullPath);
      }
    } else if (loadChildren) {
      const lazy = this.resolveLazyChildren(loadChildren, file);
      if (lazy) {
        this.walkArray(lazy.node, lazy.file, fullPath);
      }
    } else if (properties.has('component') || properties.has('loadComponent')) {
      this.routes.add(`/${fullPath.join('/')}`);
    }
  }

  /** `() => import('app/x.routes').then((module) => module.xRoutes)` → the `xRoutes` array. */
  private resolveLazyChildren(
    expression: ts.Expression,
    file: string,
  ): { node: ts.ArrayLiteralExpression; file: string } | null {
    let specifier: string | undefined;
    let exportName: string | undefined;
    const visit = (node: ts.Node): void => {
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword
        && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
        specifier = node.arguments[0].text;
      }
      if (ts.isArrowFunction(node) && ts.isPropertyAccessExpression(node.body)) {
        exportName = node.body.name.text;
      }
      ts.forEachChild(node, visit);
    };
    visit(expression);
    if (!specifier || !exportName) {
      return null;
    }
    const target = this.resolveModule(file, specifier);
    return existsSync(target) ? this.resolveIdentifier(target, exportName) : null;
  }
}

// ---------------------------------------------------------------------------------------------
// Matching visited URLs to routes
// ---------------------------------------------------------------------------------------------

function segments(path: string): string[] {
  return path.split('/').filter(Boolean);
}

/** How well `url` fits `pattern`: literal segments matched, or -1 for no match. */
function matchScore(pattern: string, url: string): number {
  const patternSegments = segments(pattern);
  const urlSegments = segments(url);
  let score = 0;
  for (const [index, segment] of patternSegments.entries()) {
    if (segment === '**') {
      return score;
    }
    const actual = urlSegments[index];
    if (actual === undefined) {
      return -1;
    }
    if (segment.startsWith(':')) {
      continue;
    }
    if (segment !== actual) {
      return -1;
    }
    score += 1;
  }
  return patternSegments.length === urlSegments.length ? score : -1;
}

/** The route a URL rendered: the matching pattern with the most literal segments. */
function routeFor(url: string, routes: string[]): string | null {
  let best: string | null = null;
  let bestScore = -1;
  for (const route of routes) {
    const score = matchScore(route, url);
    if (score > bestScore) {
      best = route;
      bestScore = score;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------------------------

interface Group {
  name: string;
  covered: string[];
  uncovered: string[];
}

function groupBy(all: string[], covered: Set<string>, groupOf: (item: string) => string): Group[] {
  const groups = new Map<string, Group>();
  for (const item of [...all].sort(byName)) {
    const name = groupOf(item);
    const group = groups.get(name) ?? { name, covered: [], uncovered: [] };
    (covered.has(item) ? group.covered : group.uncovered).push(item);
    groups.set(name, group);
  }
  return [...groups.values()].sort((a, b) => {
    const sizeA = a.covered.length + a.uncovered.length;
    const sizeB = b.covered.length + b.uncovered.length;
    return sizeB - sizeA || a.name.localeCompare(b.name);
  });
}

function percent(covered: number, total: number): string {
  return total === 0 ? '–' : `${Math.round((covered / total) * 100)}%`;
}

/** How many uncovered items a table row names before summarising the rest as a count. */
const maxListed = 8;

function code(text: string): string {
  return `\`${text}\``;
}

function byName(a: string, b: string): number {
  return a.localeCompare(b);
}

function groupTable(groups: Group[], label: string): string[] {
  const lines = [`| ${label} | Covered | Total | % | Not covered |`, '|---|---:|---:|---:|---|'];
  for (const group of groups) {
    const total = group.covered.length + group.uncovered.length;
    const shown = group.uncovered.slice(0, maxListed).map(code).join(', ');
    const hidden = group.uncovered.length - maxListed;
    const missing = hidden > 0 ? `${shown}, … +${hidden}` : shown;
    lines.push(`| ${code(group.name)} | ${group.covered.length} | ${total} | ${percent(group.covered.length, total)} | ${missing} |`);
  }
  return lines;
}

function main(): void {
  const args = process.argv.slice(2);
  const outIndex = args.indexOf('--out');
  const outFile = outIndex >= 0 ? args.splice(outIndex, 2)[1] : undefined;
  const resultsDir = resolve(args[0] ?? join(repoRoot, 'test-results/e2e-coverage'));

  if (!existsSync(resultsDir)) {
    console.error(`No results in ${relative(repoRoot, resultsDir)}. Run the suite first: yarn e2e`);
    process.exit(1);
  }

  const results: TestCoverage[] = readdirSync(resultsDir)
    .filter((name) => name.endsWith('.json') && name !== 'summary.json')
    .map((name) => JSON.parse(readFileSync(join(resultsDir, name), 'utf8')) as TestCoverage);

  // Inventory.
  const { methods: sourceMethods, events: sourceEvents } = scanApiUsage(
    appRoot,
    compilerOptionsFrom(join(repoRoot, 'tsconfig.json')),
  );
  // Every route, so a visit to an unlinked one is matched to it rather than to a lookalike.
  const allRoutes = [...new RouteCollector().collect(join(appRoot, 'app.routes.ts'), 'rootRoutes')]
    .filter((route) => !segments(route).includes('**'));
  const routes = allRoutes.filter((route) => !unlinkedRoutes.has(route));
  const staleExclusions = [...unlinkedRoutes.keys()].filter((route) => !allRoutes.includes(route));

  // What the run exercised.
  const calledMethods = new Set(results.flatMap((result) => result.methods));
  const subscribedEvents = new Set(results.flatMap((result) => result.events));
  const visitedUrls = new Set(results.flatMap((result) => result.routes));

  const visitedRoutes = new Set<string>();
  const unmatchedUrls: string[] = [];
  for (const url of visitedUrls) {
    const route = routeFor(url, allRoutes);
    if (route) {
      if (!unlinkedRoutes.has(route)) {
        visitedRoutes.add(route);
      }
    } else {
      unmatchedUrls.push(url);
    }
  }

  const methodsNotInSource = [...calledMethods].filter((method) => !sourceMethods.has(method)).sort(byName);
  const allMethods = [...new Set([...sourceMethods, ...calledMethods])];
  const allEvents = [...new Set([...sourceEvents, ...subscribedEvents])];

  const namespaceOf = (method: string): string => method.slice(0, method.lastIndexOf('.'));
  const areaOf = (route: string): string => `/${segments(route)[0] ?? ''}`;

  const methodGroups = groupBy(allMethods, calledMethods, namespaceOf);
  const routeGroups = groupBy(routes, visitedRoutes, areaOf);
  const coveredMethods = allMethods.filter((method) => calledMethods.has(method)).length;
  const coveredEvents = allEvents.filter((event) => subscribedEvents.has(event)).length;

  const failed = results.filter((result) => result.status !== 'passed' && result.status !== 'skipped').length;
  const failedNote = failed ? ` (${failed} not passed — their calls still count)` : '';

  const lines = [
    '# E2E coverage',
    '',
    `From ${results.length} test attempts${failedNote}.`,
    'Counted from each test\'s first navigation or user input; the inventory is read statically from `src/app`. See `scripts/e2e-coverage.ts`.',
    '',
    '| | Covered | Total | % |',
    '|---|---:|---:|---:|',
    `| Middleware methods | ${coveredMethods} | ${allMethods.length} | ${percent(coveredMethods, allMethods.length)} |`,
    `| Routes | ${visitedRoutes.size} | ${routes.length} | ${percent(visitedRoutes.size, routes.length)} |`,
    `| Subscribed events | ${coveredEvents} | ${allEvents.length} | ${percent(coveredEvents, allEvents.length)} |`,
    '',
    '<details><summary>Routes by area</summary>',
    '',
    ...groupTable(routeGroups, 'Area'),
    '',
    '</details>',
    '',
    '<details><summary>Middleware methods by namespace</summary>',
    '',
    ...groupTable(methodGroups, 'Namespace'),
    '',
    '</details>',
  ];

  if (unlinkedRoutes.size) {
    lines.push(
      '',
      '<details><summary>Routes no link reaches (not counted)</summary>',
      '',
      ...[...unlinkedRoutes].map(([route, reason]) => `- ${code(route)}: ${reason}`),
      '',
      '</details>',
    );
  }

  if (methodsNotInSource.length || unmatchedUrls.length) {
    lines.push(
      '',
      '<details><summary>Seen in the run but not in the inventory</summary>',
      '',
      'Gaps in the static scan rather than in the suite. Methods are counted anyway.',
      '',
      ...methodsNotInSource.map((method) => `- method ${code(method)}`),
      ...[...unmatchedUrls].sort(byName).map((url) => `- URL ${code(url)}`),
      '',
      '</details>',
    );
  }

  const markdown = `${lines.join('\n')}\n`;
  process.stdout.write(markdown);
  if (outFile) {
    writeFileSync(outFile, markdown);
  }

  const coveredBy = (pick: (result: TestCoverage) => string[]): Record<string, string[]> => {
    const map: Record<string, string[]> = {};
    for (const result of results) {
      for (const item of pick(result)) {
        map[item] = [...map[item] ?? [], result.test];
      }
    }
    return map;
  };
  writeFileSync(join(resultsDir, 'summary.json'), JSON.stringify({
    tests: results.length,
    methods: { covered: coveredMethods, total: allMethods.length, coveredBy: coveredBy((result) => result.methods) },
    routes: {
      covered: visitedRoutes.size,
      total: routes.length,
      all: [...routes].sort(byName),
      coveredBy: coveredBy((result) => result.routes.map((url) => routeFor(url, allRoutes) ?? url)),
      unlinked: [...unlinkedRoutes.keys()],
    },
    events: { covered: coveredEvents, total: allEvents.length },
    notInInventory: { methods: methodsNotInSource, urls: unmatchedUrls },
  }, null, 2));

  // After the report and `summary.json` are written, so both still exist. CI's step runs under
  // `set -e`, though, so there it stops before publishing them to the job summary.
  if (staleExclusions.length) {
    console.error(`unlinkedRoutes in scripts/e2e-coverage.ts names routes that do not exist: ${staleExclusions.join(', ')}`);
    process.exitCode = 1;
  }
}

main();
