/**
 * Target configuration — the seam described in R2.11 / T10.
 *
 * The suite can run against two places the UI is served from, and the ONLY
 * difference between them is the UI base URL. Everything else — selectors, the
 * middleware client, authentication — is identical.
 *
 *   shipped  UI: https://<host>/ui/         middleware: <host>   (nightly)
 *   branch   UI: http://localhost:4200/     middleware: <host>   (CI, local)
 *
 * The paths differ on purpose. `/ui/` is where the appliance's nginx serves the
 * UI; a locally served build defaults to `/`, because only webui's `build:prod`
 * passes `--base-href /ui/`. The invariant common to both is the trailing slash.
 *
 * This module is deliberately the only place either value is resolved. Nothing
 * else in the suite reads a URL from the environment.
 */
import { readWebuiRemote } from './webui-environment';

/** Which of the two supported targets the run is pointed at. */
export type ProfileName = 'shipped' | 'branch';

const profiles: readonly ProfileName[] = ['shipped', 'branch'];

/**
 * Opt-in value for `TN_HOST` that resolves the appliance from webui's own
 * `environment.ts` rather than naming one.
 *
 * Opt-in rather than the default, because this suite is destructive: it exports
 * pools with `destroy: true` (`fixtures/storage.ts`) and deletes users
 * (`fixtures/users.ts`).
 *
 * This used to be the fallback whenever `TN_HOST` was unset, and the setup
 * instructions actively told you to leave it unset. So the documented happy path
 * was a `.env` holding credentials and no target, pointed by inference at
 * whatever appliance the developer's dev server was on — where a run would
 * destroy any pool named `e2e_tank` and delete any user named `bob`. Nothing in
 * the output said which machine that was.
 *
 * The convenience is worth keeping — one `yarn ui remote -i <ip>` configuring
 * both the dev server and the suite is genuinely useful — but it has to be
 * asked for.
 */
const autoHost = 'auto';

/** Where the resolved appliance address came from. Reported at startup. */
export type HostSource = 'TN_HOST' | 'yarn ui remote';

/** Fully resolved, validated target configuration for a run. */
export interface TargetConfig {
  /** Which profile produced this configuration. */
  readonly profile: ProfileName;
  /**
   * Absolute base URL the UI is served from. Always ends with `/` so relative
   * navigation resolves beneath it. The path itself is profile-dependent —
   * `/ui/` for `shipped`, whatever the local build is served at for `branch`.
   */
  readonly uiBaseUrl: string;
  /** Middleware host, `host` or `host:port`. No scheme — the client adds `wss://`. */
  readonly middlewareHost: string;
  /** How {@link middlewareHost} was resolved, for the startup banner. */
  readonly hostSource: HostSource;
  readonly username: string;
  readonly password: string;
  /**
   * Whether to accept the appliance's self-signed certificate.
   *
   * True only for `shipped`, where the browser talks directly to the VM over
   * HTTPS. Scoped to that profile so the leniency cannot mask a genuine
   * certificate problem in the other (R2.9).
   */
  readonly ignoreHttpsErrors: boolean;
}

/**
 * Default UI base URL for `branch`. `shipped` has no default — it is always
 * derived from the host, since a default there would silently point at the
 * wrong machine.
 *
 * Path is `/` because that is what webui builds produce by default: only
 * `build:prod` passes `--base-href /ui/`, and `angular.json` sets no `baseHref`.
 * `yarn build` and `ng serve` both serve at the root.
 */
const defaultBranchUiBaseUrl = 'http://localhost:4200/';

/**
 * Path the appliance serves the UI under. A property of the appliance's nginx
 * configuration, not of webui builds generally — which is why it applies to
 * `shipped` only.
 */
const shippedUiPath = '/ui/';

class ConfigError extends Error {
  constructor(problems: string[]) {
    const bulleted = problems.map((problem) => `  • ${problem}`).join('\n');
    super(
      `Invalid E2E target configuration:\n\n${bulleted}\n\n`
      + 'See .env.example for the full set of variables.',
    );
    this.name = 'ConfigError';
  }
}

function readProfile(raw: string | undefined, problems: string[]): ProfileName | undefined {
  if (!raw) {
    problems.push(`TN_PROFILE is required — one of: ${profiles.join(', ')}`);
    return undefined;
  }
  if (!profiles.includes(raw as ProfileName)) {
    problems.push(`TN_PROFILE must be one of: ${profiles.join(', ')} (got "${raw}")`);
    return undefined;
  }
  return raw as ProfileName;
}

/**
 * Validates the UI base URL.
 *
 * The universal invariant is the **trailing slash**, not any particular path.
 * `new URL(path, base)` replaces the last segment when the base lacks one:
 *
 *   new URL('signin', 'http://h/ui')   -> http://h/signin      drops /ui
 *   new URL('signin', 'http://h/ui/')  -> http://h/ui/signin   correct
 *
 * Getting that wrong produces a 404 several steps into a test rather than an
 * error naming the cause, so it is worth catching at startup.
 *
 * The `/ui/` path itself is `shipped`-only — a property of the appliance's nginx
 * configuration, not of webui builds. A locally served build lives wherever it
 * was built to live, by default `/`, since only `build:prod` passes
 * `--base-href /ui/`.
 */
function validateUiBaseUrl(uiBaseUrl: string, profile: ProfileName, problems: string[]): void {
  let parsed: URL;
  try {
    parsed = new URL(uiBaseUrl);
  } catch {
    problems.push(`TN_UI_BASE_URL is not a valid absolute URL: "${uiBaseUrl}"`);
    return;
  }

  if (!parsed.pathname.endsWith('/')) {
    problems.push(
      `UI base URL must end with "/" (got "${parsed.pathname}"). Without it, relative `
      + 'navigation drops the last path segment: "signin" would resolve to '
      + `"${new URL('signin', parsed).pathname}".`,
    );
  }

  if (profile === 'shipped' && parsed.pathname !== shippedUiPath) {
    problems.push(
      `The shipped profile serves the UI at "${shippedUiPath}" (got "${parsed.pathname}"). `
      + 'Override TN_UI_BASE_URL only if this appliance is configured differently.',
    );
  }
}

/**
 * Rejects the shapes `TN_HOST` is most often given by mistake.
 *
 * `host` or `host:port`, no scheme and no path — the client builds
 * `wss://${host}${path}` itself. The value pasted out of a browser's address bar
 * is the common error, and left unchecked it fails a long way from its cause: in
 * `branch` the run dies 30 seconds later on a socket to `wss://https://…`, and
 * in `shipped` it derives `https://https://host/ui/`, which parses, so the
 * complaint that surfaces is about `TN_UI_BASE_URL` — a variable the user never
 * set. Since the point of requiring `TN_HOST` is to make the target
 * unmistakable, it is worth saying so here instead.
 */
function validateMiddlewareHost(host: string, source: HostSource, problems: string[]): void {
  const from = source === 'TN_HOST' ? 'TN_HOST' : `the remote in environment.ts (TN_HOST=${autoHost})`;

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(host)) {
    problems.push(
      `${from} must be a host or host:port with no scheme (got "${host}"). `
      + 'The middleware client adds `wss://` and the UI base URL is derived separately.',
    );
    return;
  }

  if (host.includes('/')) {
    problems.push(`${from} must be a host or host:port with no path (got "${host}")`);
    return;
  }

  if (/\s/.test(host)) {
    problems.push(`${from} contains whitespace (got "${host}")`);
  }
}

/**
 * Resolves the appliance under test.
 *
 * Never inferred. See {@link autoHost} — the fallback to webui's configured
 * remote is available, but only when explicitly asked for.
 */
function readMiddlewareHost(
  raw: string | undefined,
  problems: string[],
): { host: string; source: HostSource } {
  if (!raw) {
    problems.push(
      'TN_HOST is required — the appliance under test, as host or host:port. '
      + 'It is never inferred: this suite exports pools with destroy:true and deletes '
      + `users, so pointing it at the wrong machine is destructive. Set TN_HOST=${autoHost} `
      + 'to reuse whatever `yarn ui remote -i <ip>` pointed webui at.',
    );
    return { host: '', source: 'TN_HOST' };
  }

  if (raw !== autoHost) {
    validateMiddlewareHost(raw, 'TN_HOST', problems);
    return { host: raw, source: 'TN_HOST' };
  }

  const remote = readWebuiRemote();
  if (!remote) {
    problems.push(
      `TN_HOST=${autoHost}, but webui has no remote configured to borrow. `
      + 'Run `yarn ui remote -i <ip>`, or set TN_HOST to the appliance directly.',
    );
    return { host: '', source: 'yarn ui remote' };
  }

  validateMiddlewareHost(remote, 'yarn ui remote', problems);
  return { host: remote, source: 'yarn ui remote' };
}

function requireValue(name: string, value: string | undefined, problems: string[]): string {
  if (!value) {
    problems.push(`${name} is required`);
    return '';
  }
  return value;
}

/**
 * Resolves and validates target configuration from the environment.
 *
 * Reports every problem at once rather than one per run — a first run against a
 * new machine usually has more than one thing missing.
 *
 * @throws ConfigError when the environment is incomplete or inconsistent.
 */
export function loadTargetConfig(env: NodeJS.ProcessEnv = process.env): TargetConfig {
  const problems: string[] = [];

  const profile = readProfile(env.TN_PROFILE, problems);

  const { host: middlewareHost, source: hostSource } = readMiddlewareHost(env.TN_HOST, problems);

  const username = requireValue('TN_USERNAME', env.TN_USERNAME, problems);
  const password = requireValue('TN_PASSWORD', env.TN_PASSWORD, problems);

  let uiBaseUrl = env.TN_UI_BASE_URL ?? '';
  if (!uiBaseUrl && profile === 'shipped') {
    // Derived, never defaulted — a default host would point at the wrong machine.
    uiBaseUrl = middlewareHost ? `https://${middlewareHost}${shippedUiPath}` : '';
  } else if (!uiBaseUrl && profile === 'branch') {
    uiBaseUrl = defaultBranchUiBaseUrl;
  }

  if (uiBaseUrl && profile) {
    validateUiBaseUrl(uiBaseUrl, profile, problems);
  } else if (profile) {
    problems.push('TN_UI_BASE_URL could not be resolved (TN_HOST is required to derive it)');
  }

  if (problems.length > 0) {
    throw new ConfigError(problems);
  }

  // `readProfile` pushes a problem whenever it returns undefined, so the throw
  // above has already covered this. Re-checking narrows the type honestly
  // rather than asserting it away, and costs nothing on a path that runs once.
  if (!profile) {
    throw new ConfigError(['TN_PROFILE could not be resolved']);
  }

  return {
    profile,
    // Trailing slash guaranteed by validateUiBaseUrl, so `new URL(path, base)`
    // resolves beneath the base rather than replacing its last segment.
    uiBaseUrl,
    middlewareHost,
    hostSource,
    username,
    password,
    ignoreHttpsErrors: profile === 'shipped',
  };
}

/**
 * The startup banner, naming the machine this run is about to act on.
 *
 * Printed before anything else happens. The suite destroys pools and deletes
 * users, so which appliance it resolved is the one fact a developer must never
 * have to infer — and it is doubly worth stating when the address was borrowed
 * from webui's configuration rather than named outright.
 *
 * The TLS line is read from the environment rather than passed in, so the
 * banner reports what is actually in effect for the process rather than what a
 * caller believes it set.
 */
export function describeTarget(target: TargetConfig): string {
  const rule = '─'.repeat(72);
  const tls = process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0'
    ? 'verification disabled process-wide (self-signed appliance certificate)'
    : 'verified';

  const lines = [
    rule,
    ' E2E TARGET — this suite DESTROYS pools, datasets and users',
    '',
    `   appliance   ${target.middlewareHost}   (from ${target.hostSource})`,
    `   profile     ${target.profile}`,
    `   UI          ${target.uiBaseUrl}`,
    `   user        ${target.username}`,
    `   node TLS    ${tls}`,
    rule,
  ];

  return lines.join('\n');
}
