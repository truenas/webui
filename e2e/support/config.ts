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

function requireValue(
  name: string,
  value: string | undefined,
  problems: string[],
  hint?: string,
): string {
  if (!value) {
    problems.push(hint ? `${name} is required. ${hint}` : `${name} is required`);
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

  // Falls back to whatever `yarn ui remote -i <ip>` pointed webui at, so a
  // developer configures the appliance once and both the dev server and this
  // suite follow. An explicit TN_HOST still wins, which is how CI targets a
  // machine without a working tree that has ever run `yarn ui remote`.
  const middlewareHost = requireValue(
    'TN_HOST',
    env.TN_HOST ?? readWebuiRemote(),
    problems,
    'Set it, or point webui at an appliance with `yarn ui remote -i <ip>`.',
  );

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
    username,
    password,
    ignoreHttpsErrors: profile === 'shipped',
  };
}
