/**
 * Story: day one on a fresh TrueNAS instance: an administrator creates their own admin account, signs in, builds a
 * redundant pool, creates a dataset for sharing, and publishes an SMB share on it. One long journey rather than
 * R1.2's independent tests, because the sequence is what's simulated; a pool failure takes the later steps with it.
 * The account steps overlap `admin-user.e2e.ts` on purpose, despite R3.1: having to make an account first is what
 * defines day one. Both share `testAdmin` so it's visibly the same account.
 */
import { firstValueFrom, timeout } from 'rxjs';
import { ensureSmbServiceStopped, ensureSmbShareAbsent } from '../../fixtures/smb';
import {
  datasetMountPath, ensurePoolAbsent, findGroupAclGrants, requireUnusedDisks,
} from '../../fixtures/storage';
import { ensureUserAbsent, testAdmin } from '../../fixtures/users';
import { expectSignedInAs, signIn, signOut } from '../../flows/auth';
import { createSmbShareAndStartService } from '../../flows/smb';
import { createRaidz2Pool, createSmbDataset } from '../../flows/storage';
import { createTrueNasAdminUser } from '../../flows/users';
import type { E2eApiClient } from '../../support/api/client';
import { leavingTestData } from '../../support/cleanup';
import { expect, test } from '../../support/fixtures';
import { readTimeoutMs } from '../../support/timeouts';

/**
 * Nine disks in a single RAIDZ2 vdev: seven data, two parity, surviving any two
 * simultaneous failures. RAIDZ1 at this width would leave the pool unprotected
 * throughout a resilver, which is when the next failure tends to arrive.
 */
const pool = { name: 'e2e_tank', width: 9 };
const dataset = 'shared';
const share = 'e2e-share';

/** Where the dataset is mounted, and therefore what the SMB share points at. */
const datasetPath = datasetMountPath(`${pool.name}/${dataset}`);

/**
 * Per-call bound inside the service-state poll below.
 *
 * Deliberately a fraction of the poll's own 60s budget: equal to it, the call
 * could only ever expire as the poll did, which bounds nothing. Playwright also
 * awaits the generator *outside* its try/catch, so a rejection aborts the poll
 * rather than failing one attempt — hence the catch in the generator too.
 */
const serviceStateCallTimeoutMs = 10_000;

/** How long the SMB service gets to reach RUNNING after the start dialog. */
const serviceStartTimeoutMs = 60_000;

/**
 * Restores the fresh-instance premise. Order matters: the service stops before its share goes and the share before
 * the pool, so nothing points at a vanished path; the user goes last, as a leftover pool starves later runs (R3.2)
 * and a leftover account costs nothing. Every step runs even when an earlier one throws, and failures are reported
 * together; otherwise one failing `user.delete` would leak the pool and wedge every retry at the same call.
 */
async function cleanUp(api: E2eApiClient): Promise<void> {
  const steps: [string, () => Promise<unknown>][] = [
    ['stop the SMB service', () => ensureSmbServiceStopped(api)],
    ['remove the SMB share', () => ensureSmbShareAbsent(api, share)],
    ['export the pool', () => ensurePoolAbsent(api, pool.name)],
    ['delete the admin user', () => ensureUserAbsent(api, testAdmin.username)],
  ];

  const failures: string[] = [];

  for (const [what, run] of steps) {
    try {
      await run();
    } catch (error) {
      failures.push(`${what} — ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (failures.length > 0) {
    const bulleted = failures.map((failure) => `  • ${failure}`).join('\n');
    throw new Error(`Cleanup did not complete:\n${bulleted}`);
  }
}

test.beforeEach(async ({ api }) => {
  await cleanUp(api);
  await requireUnusedDisks(api, pool.width);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`pool "${pool.name}", share "${share}" and user "${testAdmin.username}"`)) {
    return;
  }
  await cleanUp(api);
});

test('an admin sets up a fresh instance: user, pool, dataset, SMB share', async ({ page, api, config }) => {
  await test.step('sign in as the factory administrator', async () => {
    await signIn(page, config.username, config.password);
  });

  await test.step('create their own TrueNAS admin account', async () => {
    await createTrueNasAdminUser(page, testAdmin);
  });

  await test.step('sign out and back in as that account', async () => {
    await signOut(page);
    await signIn(page, testAdmin.username, testAdmin.password);
    await expectSignedInAs(page, testAdmin.username);
  });

  await test.step(`create a ${pool.width}-wide RAIDZ2 pool`, async () => {
    await createRaidz2Pool(page, pool);
  });

  await test.step('create a dataset for file sharing', async () => {
    await createSmbDataset(page, pool.name, dataset);
  });

  await test.step('publish an SMB share and start the service', async () => {
    await createSmbShareAndStartService(page, datasetPath, share);
  });

  // Verified through the API rather than the UI, deliberately. Every step above
  // was performed and confirmed through the interface; this asks middleware
  // whether the appliance is genuinely in the intended state, which is a
  // different question from whether the screens said so.
  await test.step('confirm the appliance is actually serving', async () => {
    const shares = await firstValueFrom(
      api.api.query('sharing.smb.query', [['name', '=', share]]).pipe(timeout(readTimeoutMs)),
    );

    expect(shares).toHaveLength(1);
    expect(shares[0]?.path).toBe(datasetPath);
    expect(shares[0]?.enabled).toBe(true);

    // The point of starting the service: a share on a stopped one serves nothing, and its row looks identical.
    // Polled, since starting is a job that completes after the dialog closes; sampling once races it (R8.3).
    // The last poll error is recorded so a persistent query fault reaches the failure message, rather than an
    // "SMB never started" that points at the wrong subsystem.
    let lastPollError: unknown;

    const readServiceState = async (): Promise<string | undefined> => {
      // Caught, not just bounded. Playwright awaits this generator outside its
      // own try/catch, so a rejection aborts the poll rather than failing one
      // attempt. Starting the SMB service restarts it, which makes a rejected
      // query an ordinary step on the way to RUNNING.
      try {
        const [cifs] = await firstValueFrom(
          api.api
            .query('service.query', [['service', '=', 'cifs']])
            .pipe(timeout(serviceStateCallTimeoutMs)),
        );
        lastPollError = undefined;
        return cifs?.state;
      } catch (error) {
        lastPollError = error;
        return undefined;
      }
    };

    try {
      await expect.poll(readServiceState, {
        timeout: serviceStartTimeoutMs,
        message: 'SMB service never reached RUNNING after the start dialog',
      }).toBe('RUNNING');
    } catch (pollFailure) {
      // `expect.poll` throws on its deadline, so this is the only path where the
      // recorded error can still be reported.
      if (!lastPollError) {
        throw pollFailure;
      }

      const detail = lastPollError instanceof Error
        ? lastPollError.message
        : String(lastPollError);

      const reported = pollFailure instanceof Error
        ? pollFailure.message
        : String(pollFailure);

      throw new Error(
        `${reported}\n\nThe last service.query also failed, which may be the `
        + `real cause: ${detail}`,
        { cause: lastPollError },
      );
    }
  });

  // The share is only useful if its admin can read and write it, which the dataset ACL and group membership decide,
  // not anything on the share screen. No ACL is set to make this pass: a user with TrueNAS and SMB access joins
  // `builtin_administrators` and `builtin_users`, and the SMB preset grants both. This asserts those defaults still
  // meet; otherwise a regression would ship an unusable share with every UI step reporting success.
  await test.step('confirm the new admin can actually use the share', async () => {
    const grants = await findGroupAclGrants(api, testAdmin.username, datasetPath);

    expect(
      grants,
      `${testAdmin.username} has no write-capable group grant on ${datasetPath}; `
      + 'the share exists but its owner cannot use it',
    ).not.toHaveLength(0);
  });
});
