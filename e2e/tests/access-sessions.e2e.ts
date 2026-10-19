/**
 * Stories: on the Access card of System > Advanced Settings, an admin ends another user's session
 * from its row; cannot end their own; and ends every other session with Terminate Other Sessions
 * while staying signed in.
 *
 * Each is checked on screen and through `auth.sessions`, by session `id`. A client whose session
 * ends logs in again by itself when its socket reopens, under a new id and origin, so "this user
 * has no session" could flake where "this session is gone" cannot.
 *
 * ## The sessions
 *
 * The other session is a second API client, signed in as a seeded administrator for the test and
 * closed after it. Its username tells its row apart from the suite admin's rows. It is opened
 * before the page goes to the card, because the card reads the sessions once, when it opens.
 *
 * The browser's own session is opened with a token the worker `api` client mints, so the card
 * shows it under the suite admin's name, and `auth.sessions` reports it as a `TOKEN` session. Asked
 * through the worker client, `current` marks the worker's session rather than the browser's.
 *
 * ## Terminate Other Sessions
 *
 * It ends every session but the caller's, whoever holds it, and that includes the worker client
 * every later test in the worker uses, and the session whose token the browser redeemed. #14677
 * asks for what that does to both to be measured before this test is kept, and nothing here could
 * run it, so its first CI run is that measurement. It checks that both are still usable afterwards,
 * and does not try to repair either. If either is not, the test fails, Playwright replaces the
 * worker before the next spec, and the test is to be removed rather than worked around. It runs
 * last in the file.
 *
 * ## Setup
 *
 * Before and after every test the second client is closed and the session user deleted. Nothing
 * else is global.
 */
import {
  isSessionPresent, readSessions, readUserSessions, type Session,
} from '../fixtures/sessions';
import { ensureSignInAdministratorPresent, ensureUserAbsent } from '../fixtures/users';
import { openAccessSessions, terminateOtherSessions, terminateSessionFromRow } from '../flows/access';
import { accessLocators } from '../locators/access';
import { connectAndLogin, type E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import type { TargetConfig } from '../support/config';
import { expect, test } from '../support/fixtures';

/** Not `bob` or a `roleAdmins` account, which other specs create and delete. */
const sessionUser = {
  username: 'e2e_session_admin',
  /** Meets the appliance's complexity rules; not a credential of any real account. */
  password: 'Session-E2E-Passw0rd!',
};

/**
 * A ceiling for a session list to settle: a browser session from the previous test closing, or
 * the worker client logging in again. Not a wait.
 */
const sessionSettleTimeoutMs = 30_000;

/**
 * A ceiling for the worker client to answer again after its session is ended. Three times one
 * read's own timeout, so a read that hangs on the closed socket is followed by more attempts.
 */
const workerReloginTimeoutMs = 90_000;

/** The second client. Closed before and after every test, so its relogin cannot open a session. */
let sessionClient: E2eApiClient | undefined;

function closeSessionClient(): void {
  sessionClient?.close();
  sessionClient = undefined;
}

/** Seeds the session user, signs the second client in as them, and returns that one session. */
async function openSecondSession(api: E2eApiClient, config: TargetConfig): Promise<Session> {
  await ensureSignInAdministratorPresent(api, sessionUser);
  sessionClient = await connectAndLogin({ ...config, ...sessionUser });

  const [session, ...others] = await readUserSessions(api, sessionUser.username);
  if (!session || others.length > 0) {
    throw new Error(`Expected exactly one session for "${sessionUser.username}" after it signed in.`);
  }
  return session;
}

/** The browser's own session: the suite admin's one token session that is not the worker's. */
async function readBrowserSessions(api: E2eApiClient, adminUsername: string): Promise<Session[]> {
  return (await readUserSessions(api, adminUsername))
    .filter((session) => session.credentials === 'TOKEN' && !session.current);
}

/**
 * Whether the worker client still finds the session with this `id`, or why it did not answer.
 *
 * Playwright awaits an `expect.poll` generator outside its own try/catch, so a rejected call would
 * abort the poll rather than cost one attempt (`zvols.e2e.ts`). A string rather than `undefined`, so
 * a poll that gives up shows the worker's last refusal in its diff.
 */
async function workerReadsSession(api: E2eApiClient, id: string): Promise<string> {
  try {
    return (await isSessionPresent(api, id)) ? 'present' : 'absent';
  } catch (error) {
    return `no answer: ${error instanceof Error ? error.message : String(error)}`;
  }
}

async function cleanUp(api: E2eApiClient): Promise<void> {
  // First, so the client cannot log in again as a user being deleted. Closing cannot fail.
  closeSessionClient();
  await runCleanupSteps([
    [`delete the user "${sessionUser.username}"`, () => ensureUserAbsent(api, sessionUser.username)],
  ]);
}

test.beforeEach(async ({ api }) => {
  await cleanUp(api);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`user "${sessionUser.username}"`)) {
    // Closed even so: an open client logs in again by itself, and holds a session no later spec expects.
    closeSessionClient();
    return;
  }
  await cleanUp(api);
});

test('an admin ends another user\'s session from its row', async ({ page, api, config }) => {
  const session = await openSecondSession(api, config);
  const { username, origin } = session;

  await openAccessSessions(page, (await readSessions(api)).length);
  await expect(page.locator(accessLocators.sessions.username(username, origin))).toHaveText(username);

  await terminateSessionFromRow(page, username, origin);

  await expect(page.locator(accessLocators.sessions.row(username, origin))).toHaveCount(0);
  // Read through the worker client, so the answer is also evidence that its session was left alone.
  expect(await isSessionPresent(api, session.id)).toBe(false);
});

test('the admin cannot end their own session', async ({ page, api, config }) => {
  // A browser session from the previous test can outlive its page for a moment.
  await expect.poll(
    async () => (await readBrowserSessions(api, config.username)).length,
    {
      message: `"${config.username}" should have exactly one TOKEN session besides the worker's: the browser's`,
      timeout: sessionSettleTimeoutMs,
    },
  ).toBe(1);
  const [own] = await readBrowserSessions(api, config.username);
  const worker = (await readSessions(api)).find((session) => session.current);
  if (!own || !worker) {
    throw new Error('auth.sessions no longer lists the browser\'s session or the worker client\'s.');
  }

  await openAccessSessions(page, (await readSessions(api)).length);
  await expect(page.locator(accessLocators.sessions.username(own.username, own.origin))).toHaveText(own.username);

  await expect(page.locator(accessLocators.sessions.terminate(own.username, own.origin))).toBeDisabled();
  // The same admin's other session, the worker's, can be ended: the button is disabled for this row
  // because it is the browser's own, not because of whose it is. Not clicked.
  await expect(page.locator(accessLocators.sessions.terminate(worker.username, worker.origin))).toBeEnabled();

  expect(await isSessionPresent(api, own.id)).toBe(true);
});

test('Terminate Other Sessions ends the other sessions and keeps the admin signed in', async ({
  page, api, config,
}) => {
  const session = await openSecondSession(api, config);
  const { username, origin } = session;

  await openAccessSessions(page, (await readSessions(api)).length);
  await expect(page.locator(accessLocators.sessions.username(username, origin))).toHaveText(username);

  await terminateOtherSessions(page);

  await expect(page.locator(accessLocators.sessions.row(username, origin))).toHaveCount(0);
  // Still on the card, so the browser was not sent to the sign-in page.
  await expect(page.locator(accessLocators.sessions.terminateOthers)).toBeVisible();

  // The worker client's session was one of the others. A call through it fails until it has
  // logged in again by itself, and this is what every later test in the worker depends on.
  await expect.poll(
    () => workerReadsSession(api, session.id),
    {
      message: 'the worker api client should answer again, and the seeded session should be gone',
      timeout: workerReloginTimeoutMs,
    },
  ).toBe('absent');
  // Again, once the worker has answered: a browser that noticed its token's parent session had
  // ended would have left the card by now.
  await expect(page.locator(accessLocators.sessions.terminateOthers)).toBeVisible();
});
