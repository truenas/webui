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
 * Both are counted from the test's first navigation or first user input after
 * the sign-in, so the dashboard every test lands on is not credited to all of
 * them — see {@link CoverageRecorder.start}.
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
const ignoredMethods = new Set(['core.ping', 'core.subscribe', 'core.unsubscribe', 'core.set_options']);

/** What the page calls on its first trusted input; see {@link CoverageRecorder.attach}. */
const inputBinding = '__e2eCoverageInput';

/**
 * Runs in the page, in every document. Reports the first trusted pointer, key or
 * input event — what Playwright's `click`, `press`, `type` and `fill` produce,
 * and what neither `dispatchEvent` nor the app on its own ever does — with the
 * page's clock at that moment. `input` is there because `fill` sends no key or
 * pointer events. It keeps reporting until the recorder accepts one, so an
 * input before {@link CoverageRecorder.start} is not the last chance.
 */
function reportFirstInput(binding: string): void {
  const types = ['pointerdown', 'keydown', 'input'];
  const onInput = (event: Event): void => {
    const report = (globalThis as unknown as Record<string, ((at: number) => Promise<boolean>) | undefined>)[binding];
    if (!event.isTrusted || !report) {
      return;
    }
    const stopIfAccepted = (accepted: boolean): void => {
      if (accepted) {
        types.forEach((type) => globalThis.removeEventListener(type, onInput, { capture: true }));
      }
    };
    // A navigation can drop the call in flight; the next input reports again.
    report(Date.now()).then(stopIfAccepted, () => undefined);
  };
  types.forEach((type) => globalThis.addEventListener(type, onInput, { capture: true }));
}

interface SentFrame {
  payload: string;
  /** When it reached this process, on the same clock as the page's `Date.now()`. */
  at: number;
}

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
  /** Frames sent after {@link start} and before counting began, held until an input says which count. */
  private pending: SentFrame[] = [];
  /**
   * The path an input began counting on, until the first navigation settles
   * whether that input was the test's or only the start of leaving the page.
   */
  private inputPath: string | null = null;

  /**
   * Listens from the moment the page exists, but records nothing until the
   * test's first navigation or input after {@link start}. The app's socket is
   * opened during sign-in and `websocket` only fires for new sockets, so
   * listening has to begin before sign-in even though counting must not.
   * Call {@link attach} before the sign-in too.
   */
  constructor(private readonly page: Page, private readonly uiBaseUrl: string) {
    page.on('websocket', (socket) => {
      socket.on('framesent', ({ payload }) => {
        const text = typeof payload === 'string' ? payload : payload.toString('utf8');
        if (this.recording) {
          this.recordFrame(text);
        } else if (this.armed) {
          this.pending.push({ payload: text, at: Date.now() });
        }
      });
    });
    page.on('framenavigated', (frame) => {
      if (this.armed && frame === page.mainFrame()) {
        // What the dashboard sent before the navigation is not the test's.
        if (this.inputPath !== null && new URL(frame.url()).pathname !== this.inputPath) {
          this.methods.clear();
          this.events.clear();
        }
        this.inputPath = null;
        this.recording = true;
        this.pending = [];
        this.recordRoute(frame.url());
      }
    });
  }

  /**
   * Watches the page for the first trusted user input. Before the sign-in, so
   * the script is in place in every document the test loads.
   *
   * The input reaches this process separately from the socket's frames, so a
   * frame its click handler sent at once can arrive first. Frames are therefore
   * held from {@link start}, stamped on arrival, and the input carries the
   * page's clock: those that arrived at or after it are counted. The browser
   * runs on this host, so the two clocks are the same one.
   */
  async attach(): Promise<void> {
    await this.page.exposeBinding(inputBinding, (_source, at: number) => this.onInput(at));
    await this.page.addInitScript(reportFirstInput, inputBinding);
  }

  /**
   * Counts from the test's first navigation or first user input, whichever
   * comes first — not from here.
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
   * A navigation alone missed every test that never makes one — those working
   * in the topbar on the dashboard, like the jobs, alerts and preferences
   * panels — so the first trusted input counts too. That is a point in the test
   * as well, but the dashboard has not gone anywhere.
   *
   * So counting from an input is provisional. Nearly every test's first input
   * is the sidebar click that leaves the dashboard, and the slide-out entries
   * take two clicks and a wait before the URL changes; the dashboard is still
   * sending all that time. If the first navigation after the input leaves the
   * path the input was made on, what was counted is dropped and the count
   * restarts there, exactly as for a test whose first act is a navigation. A
   * reload, or a query-string change, keeps it. The cost: a test that works in
   * the topbar and then navigates away still loses what it did first, as
   * before, and a topbar-only test that acts while widgets are still loading
   * is credited with their late calls.
   *
   * For the unauthenticated project the test's own `goto` is the first
   * navigation.
   */
  start(): void {
    this.armed = true;
  }

  /** Whether counting has begun, which tells the page to stop reporting. */
  private onInput(at: number): boolean {
    if (!this.armed) {
      return false;
    }
    if (!this.recording) {
      this.recording = true;
      this.inputPath = new URL(this.page.url()).pathname;
      for (const frame of this.pending) {
        if (frame.at >= at) {
          this.recordFrame(frame.payload);
        }
      }
      this.pending = [];
    }
    return true;
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
