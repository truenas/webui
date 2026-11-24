/**
 * Records the middleware methods (from the browser socket's JSON-RPC frames) and routes a test exercised,
 * for `yarn e2e:coverage`. Read off the browser, so any build works; the fixtures' `api` client never counts,
 * so API setup can't make a feature look tested. Counting starts after sign-in ({@link CoverageRecorder.start}).
 * One JSON per attempt goes to the fixed `test-results/e2e-coverage/` (not `outputDir`, since `ha-license`
 * writes elsewhere); it holds method names and URL paths only, never params, so it is safe to publish.
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
   * Watches the page for the first trusted user input; attached before sign-in so the script is in every
   * document. The input can arrive after frames its click handler sent, so frames are held from {@link start}
   * and stamped, and those at or after the input's page-clock time count (the browser shares this host's clock).
   */
  async attach(): Promise<void> {
    await this.page.exposeBinding(inputBinding, (_source, at: number) => this.onInput(at));
    await this.page.addInitScript(reportFirstInput, inputBinding);
  }

  /**
   * Counts from the test's first navigation or first trusted input, not from here: the dashboard keeps
   * querying after sign-in, and a time-based start credited those calls to every test. Input-based counting
   * is provisional: if the next navigation leaves the input's path (e.g. a sidebar click), the count restarts
   * there; a reload or query-string change keeps it. Costs: topbar work before navigating away is lost, and a
   * topbar-only test may be credited late widget calls. In the unauthenticated project the `goto` is first.
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
