/**
 * Records what a test exercised, for `yarn e2e:coverage` to report on.
 *
 * Two things, both read off the browser rather than the code under test, so it
 * works against any build — the appliance's minified one included:
 *
 * - **Middleware methods** the UI called, from the JSON-RPC frames it sent.
 *   Only the browser's socket is watched; the fixtures' own `api` client never
 *   counts, so setting state up over the API cannot make a feature look tested.
 * - **Routes** the app reached, from main-frame navigations. Playwright reports
 *   same-document (`pushState`) navigations here too, which is every one an
 *   Angular router link makes.
 *
 * One JSON file per test attempt lands in `test-results/e2e-coverage/`.
 * Playwright clears `test-results` at the start of a run, so the directory only
 * ever holds the run that just finished. The directory is fixed rather than the
 * project's `outputDir`, because `ha-license` writes its results elsewhere and
 * its coverage would be left out of the report. The files hold method names and
 * URL paths only, never params, so they are safe to publish from any project.
 */
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import type { Page, TestInfo } from '@playwright/test';

export const coverageDirName = 'e2e-coverage';

const resultsDir = join(import.meta.dirname, '..', '..', 'test-results');

export interface TestCoverage {
  /** `file › describe › test`, for the report's "covered by" lists. */
  test: string;
  status: TestInfo['status'];
  methods: string[];
  events: string[];
  routes: string[];
}

/** Plumbing every page issues; counting it says nothing about a feature. */
const ignoredMethods = new Set(['core.ping', 'core.subscribe', 'core.unsubscribe']);

/**
 * Wrappers whose first parameter names the method that actually runs:
 * `core.bulk` fans one method out over many ids, `core.download` runs a method
 * and serves its output as a file.
 */
const wrapperMethods = new Set(['core.bulk', 'core.download']);

function byName(a: string, b: string): number {
  return a.localeCompare(b);
}

interface RpcRequest {
  method?: unknown;
  params?: unknown;
}

export class CoverageRecorder {
  private readonly methods = new Set<string>();
  private readonly events = new Set<string>();
  private readonly routes = new Set<string>();
  private armed = false;
  private recording = false;

  /**
   * Listens from the moment the page exists, but records nothing until the
   * test's first navigation after {@link start}. The app's socket is opened
   * during sign-in and `websocket` only fires for new sockets, so listening has
   * to begin before sign-in even though counting must not.
   */
  constructor(page: Page, private readonly uiBaseUrl: string) {
    page.on('websocket', (socket) => {
      socket.on('framesent', ({ payload }) => {
        if (this.recording) {
          this.recordFrame(typeof payload === 'string' ? payload : payload.toString('utf8'));
        }
      });
    });
    page.on('framenavigated', (frame) => {
      if (this.armed && frame === page.mainFrame()) {
        this.recording = true;
        this.recordRoute(frame.url());
      }
    });
  }

  /**
   * Counts from the test's first navigation, not from here.
   *
   * Every authenticated test signs in onto the dashboard, and the dashboard is
   * still talking to middleware when the shell appears: its widgets mount only
   * after the saved layout loads, then send their own queries. Starting the count
   * at a point in time credits whichever of those calls happen to land after it
   * to every test — 29 of 149 tests claimed `reporting.netdata_get_data` in the
   * first CI run. A navigation is a point in the *test*: the router updates the
   * URL only once the new page has replaced the dashboard, whose calls are gone
   * with it.
   *
   * The cost is a test that never navigates — one that works in the topbar on
   * the dashboard, like the preferences panel — records nothing. For the
   * unauthenticated project the test's own `goto` is the first navigation.
   */
  start(): void {
    this.armed = true;
  }

  async save(testInfo: TestInfo): Promise<void> {
    const coverage: TestCoverage = {
      test: [testInfo.file.replace(/^.*\/e2e\//, ''), ...testInfo.titlePath.slice(1)].join(' › '),
      status: testInfo.status,
      methods: [...this.methods].sort(byName),
      events: [...this.events].sort(byName),
      routes: [...this.routes].sort(byName),
    };
    const dir = join(resultsDir, coverageDirName);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, `${testInfo.testId}-${testInfo.retry}.json`), JSON.stringify(coverage, null, 2));
  }

  private recordFrame(payload: string): void {
    let message: unknown;
    try {
      message = JSON.parse(payload);
    } catch {
      return;
    }
    for (const request of Array.isArray(message) ? message : [message]) {
      this.recordRequest(request as RpcRequest);
    }
  }

  private recordRequest({ method, params }: RpcRequest): void {
    if (typeof method !== 'string') {
      return;
    }
    const firstParam = Array.isArray(params) ? params[0] : undefined;

    if (method === 'core.subscribe' && typeof firstParam === 'string') {
      // `app.container_log_follow:{"id": …}` — the argument is per-call, the event is not.
      this.events.add(firstParam.split(':')[0] ?? firstParam);
    }
    if (wrapperMethods.has(method) && typeof firstParam === 'string') {
      this.methods.add(firstParam);
    }
    if (!ignoredMethods.has(method)) {
      this.methods.add(method);
    }
  }

  private recordRoute(url: string): void {
    const { protocol, pathname } = new URL(url);
    // `about:blank`, before the first navigation.
    if (!protocol.startsWith('http')) {
      return;
    }
    // The UI may be served under a prefix (`/ui/` on an appliance); routes are relative to it.
    const basePath = new URL(this.uiBaseUrl).pathname.replace(/\/$/, '');
    const route = (pathname.startsWith(basePath) ? pathname.slice(basePath.length) : pathname)
      .split('/')
      // Matrix parameters (`;id=3`) belong to a segment but not to the route.
      .map((segment) => segment.split(';')[0] ?? segment)
      .join('/');
    this.routes.add(route.startsWith('/') ? route : `/${route}`);
  }
}
