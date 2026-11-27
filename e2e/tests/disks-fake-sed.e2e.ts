/**
 * Story: an admin opens Storage > Disks on an appliance with a locked self-encrypting drive, and its row reads
 * Locked and offers Unlock and SED Reset. CI has no SED, so the page is told one of its unused disks is one
 * (`fixtures/fake-middleware.ts`), with the SED entitlement granted; this is the proof that fixture works.
 * Only what the page shows is asserted: the appliance still holds a plain disk, so no SED action is pressed.
 */
import { pickUnusedDisk } from '../fixtures/disks';
import { entitlementFeature } from '../fixtures/entitlements';
import type { AnswerOverride, MiddlewareOverrides } from '../fixtures/fake-middleware';
import { expandDisk, openDisksPage } from '../flows/disks';
import { diskListLocators } from '../locators/disks';
import { expect, test } from '../support/fixtures';

/**
 * The disk faked as a locked SED. Picked in `beforeEach`, which runs before the `page` fixture signs in, so
 * the overrides know it by the time the page first asks.
 */
let sedDisk = '';

/** A `disk.query` or `disk.details` row, made a locked SED when it is {@link sedDisk}. */
function asLockedSed<Row>(row: Row): Row {
  return (row as { name?: unknown }).name === sedDisk
    ? { ...row, sed: true, sed_status: 'LOCKED' }
    : row;
}

/** A list of rows with {@link asLockedSed} applied, or anything else as it was. */
function eachAsLockedSed<Answer>(answer: Answer): Answer {
  return Array.isArray(answer) ? answer.map(asLockedSed) as Answer : answer;
}

const grantSed: AnswerOverride<'truenas.entitlements.info'> = (info) => ({
  ...info,
  features: {
    ...info.features,
    [entitlementFeature.sed]: { entitled: true, reason: 'ENTITLED', message: '' },
  },
});

/** Called without a `type`, `disk.details` answers `{ used, unused }`, two lists of disks. */
const detailsAsLockedSed: AnswerOverride<'disk.details'> = (details) => (Array.isArray(details)
  ? details
  : { ...details, used: eachAsLockedSed(details.used), unused: eachAsLockedSed(details.unused) });

const overrides: MiddlewareOverrides = {
  'truenas.entitlements.info': grantSed,
  // The page reads a SED's status from `disk.details`, and asks `disk.query` again for any it gave none.
  'disk.details': detailsAsLockedSed,
  'disk.query': eachAsLockedSed,
};

test.use({ middlewareOverrides: overrides });

test.beforeEach(async ({ api }) => {
  sedDisk = await pickUnusedDisk(api);
});

test('a locked SED reads Locked on the Disks page, and its row offers Unlock and SED Reset', async ({ page }) => {
  await openDisksPage(page, sedDisk);
  await expandDisk(page, sedDisk);

  await expect(page.locator(diskListLocators.cell('Self-Encrypting Drive (SED)', sedDisk))).toHaveText('Locked');
  await expect(page.locator(diskListLocators.unlock(sedDisk))).toBeVisible();
  await expect(page.locator(diskListLocators.resetSed(sedDisk))).toBeVisible();
});
