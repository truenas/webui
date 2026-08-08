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
 */
import type { TrueNasApiClient } from '@truenas/api-client';
import {
  ensurePoolAbsent, ensureSmbServiceStopped, ensureSmbShareAbsent, findGroupAclGrants,
  requireUnusedDisks,
} from '../../fixtures/storage';
import { ensureUserAbsent } from '../../fixtures/users';
import { expectSignedInAs, signIn, signOut } from '../../flows/auth';
import { createRaidz2Pool, createSmbDataset, createSmbShare } from '../../flows/storage';
import { createTrueNasAdminUser } from '../../flows/users';
import { callUntyped } from '../../support/api/untyped';
import { expect, test } from '../../support/fixtures';

const admin = {
  username: 'bob',
  password: 'Bob-E2E-Passw0rd!',
};

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
 * Order matters twice over: the service is stopped before its share is removed,
 * and the share before the pool, so nothing is ever left pointing at a path
 * that has ceased to exist.
 */
async function cleanUp(api: TrueNasApiClient): Promise<void> {
  await ensureSmbServiceStopped(api);
  await ensureSmbShareAbsent(api, share);
  await ensurePoolAbsent(api, pool.name);
  await ensureUserAbsent(api, admin.username);
}

test.beforeEach(async ({ api }) => {
  await cleanUp(api);
  await requireUnusedDisks(api, pool.width);
});

test.afterEach(async ({ api }) => {
  if (keepTestData) {
    console.warn(`TN_KEEP_TEST_DATA=1 — leaving pool "${pool.name}", share "${share}" and user "${admin.username}".`);
    return;
  }
  await cleanUp(api);
});

test('an admin sets up a fresh instance: user, pool, dataset, SMB share', async ({ page, api, config }) => {
  await test.step('sign in as the factory administrator', async () => {
    await signIn(page, config.username, config.password);
  });

  await test.step('create their own TrueNAS admin account', async () => {
    await createTrueNasAdminUser(page, admin);
  });

  await test.step('sign out and back in as that account', async () => {
    await signOut(page);
    await signIn(page, admin.username, admin.password);
    await expectSignedInAs(page, admin.username);
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
    const grants = await findGroupAclGrants(api, admin.username, datasetPath);

    expect(
      grants,
      `${admin.username} has no write-capable group grant on ${datasetPath}; `
      + 'the share exists but its owner cannot use it',
    ).not.toHaveLength(0);
  });
});
