/**
 * Story: day one on a fresh TrueNAS instance.
 *
 * An administrator creates their own admin account, signs in as it, builds a
 * redundant pool from the available disks, carves out a dataset for file
 * sharing, and publishes an SMB share on it.
 *
 * This is deliberately one long journey rather than the independent tests R1.2
 * prescribes, because the *sequence* is what is being simulated — a fresh
 * appliance taken to a working share. The cost is real and worth stating: a
 * failure at the pool step takes the dataset and share steps with it, so a
 * single break reports as three missing capabilities rather than one. Where
 * that trade is not worth making — S3 through S8 — preconditions come from the
 * API instead.
 *
 * The first three steps overlap `admin-user.e2e.ts` almost exactly, and that is
 * intentional rather than an oversight. R3.1 would have the account provisioned
 * over the API here, since the pool and share work merely depends on it — but
 * "you cannot use the appliance until you have made yourself an account" is the
 * defining constraint of day one, and a fresh-install story that starts already
 * signed in as somebody skips the part that makes it a fresh install. The
 * duplicated coverage is the price of keeping the premise honest; the two tests
 * share one identity (`testAdmin`) so it is visibly the same account.
 */
import type { TrueNasApiClient } from '@truenas/api-client';
import {
  ensurePoolAbsent, ensureSmbServiceStopped, ensureSmbShareAbsent, findGroupAclGrants,
  requireUnusedDisks,
} from '../../fixtures/storage';
import { ensureUserAbsent, testAdmin } from '../../fixtures/users';
import { expectSignedInAs, signIn, signOut } from '../../flows/auth';
import { createRaidz2Pool, createSmbDataset, createSmbShare } from '../../flows/storage';
import { createTrueNasAdminUser } from '../../flows/users';
import { callUntyped } from '../../support/api/untyped';
import { expect, test } from '../../support/fixtures';

/**
 * Nine disks in a single RAIDZ2 vdev: seven data, two parity, surviving any two
 * simultaneous failures. RAIDZ1 at this width would leave the pool unprotected
 * throughout a resilver, which is when the next failure tends to arrive.
 */
const pool = { name: 'e2e_tank', width: 9 };
const dataset = 'shared';
const share = 'e2e-share';

/** Where the dataset is mounted, and therefore what the SMB share points at. */
const datasetPath = `/mnt/${pool.name}/${dataset}`;

const keepTestData = process.env.TN_KEEP_TEST_DATA === '1';

/**
 * Restores the fresh-instance premise the story depends on.
 *
 * Order matters: the service is stopped before its share is removed, and the
 * share before the pool, so nothing is ever left pointing at a path that has
 * ceased to exist. The user goes last because it is the cheapest thing to leak —
 * a leftover account costs the next run nothing, while a leftover pool holds its
 * disks and starves every later run (R3.2).
 *
 * Every step runs even when an earlier one throws, and the failures are reported
 * together. Plain sequential `await`s meant one failing call abandoned the rest,
 * so a `user.delete` that kept failing would wedge the suite: `afterEach` would
 * leak the pool, and the retry's `beforeEach` would throw at the same first call
 * and never reach the export either.
 *
 * (An earlier revision moved the user deletion to the front, reasoning that
 * `pool.export` restarts services and leaves the socket unreliable for whatever
 * runs next. That was wrong twice over. `ensurePoolAbsent` only returns once
 * `waitUntil` has had a query answered, so the socket is demonstrably working by
 * then — and putting the user first meant a failure there aborted cleanup before
 * the pool, inverting exactly the priority above.)
 */
async function cleanUp(api: TrueNasApiClient): Promise<void> {
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
  if (keepTestData) {
    console.warn(
      `TN_KEEP_TEST_DATA=1 — leaving pool "${pool.name}", share "${share}" `
      + `and user "${testAdmin.username}".`,
    );
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
    await createSmbShare(page, datasetPath, share);
  });

  // Verified through the API rather than the UI, deliberately. Every step above
  // was performed and confirmed through the interface; this asks middleware
  // whether the appliance is genuinely in the intended state, which is a
  // different question from whether the screens said so.
  await test.step('confirm the appliance is actually serving', async () => {
    const shares = await callUntyped<{ name: string; path: string; enabled: boolean }[]>(
      api,
      'sharing.smb.query',
      [[['name', '=', share]]],
    );

    expect(shares).toHaveLength(1);
    expect(shares[0]?.path).toBe(datasetPath);
    expect(shares[0]?.enabled).toBe(true);

    // The point of starting the service. A share on a stopped service is
    // configuration that serves nothing, and the UI alone cannot tell the
    // difference — the share row looks identical either way.
    //
    // Polled rather than sampled once: starting a service is a job, so it
    // completes after the dialog closes. Sampling immediately races it and
    // reports STOPPED on a service that is seconds from running (R8.3).
    await expect.poll(
      async () => {
        const [cifs] = await callUntyped<{ state: string }[]>(
          api,
          'service.query',
          [[['service', '=', 'cifs']]],
        );
        return cifs?.state;
      },
      { timeout: 60_000, message: 'SMB service never reached RUNNING after the start dialog' },
    ).toBe('RUNNING');
  });

  // The share is only useful if the admin who made it can actually read and
  // write it. That is decided by the dataset ACL and group membership, not by
  // anything visible on the share screen, so nothing above would notice if it
  // stopped being true.
  //
  // No ACL is configured to make this pass: creating the user with TrueNAS and
  // SMB access places them in `builtin_administrators` and `builtin_users`, and
  // the SMB dataset preset grants both. This asserts that those two defaults
  // still meet — a regression in either would otherwise ship a share nobody
  // can use, with every UI step still reporting success.
  await test.step('confirm the new admin can actually use the share', async () => {
    const grants = await findGroupAclGrants(api, testAdmin.username, datasetPath);

    expect(
      grants,
      `${testAdmin.username} has no write-capable group grant on ${datasetPath}; `
      + 'the share exists but its owner cannot use it',
    ).not.toHaveLength(0);
  });
});
