/**
 * Stories: joining an Active Directory domain through the Directory Services
 * form, leaving it from the card's Leave dialog, and a join refused because one
 * of the appliance's nameservers cannot resolve the domain.
 *
 * Needs a real domain (`TN_AD_*`), and skips without one. In CI that is the
 * internal test domain from the `E2EUI_AD_*` repository secrets, so this spec
 * is in `tests/unpublished/`, whose project publishes nothing: its
 * credentials are typed into the form, and a trace would keep them. For the
 * same reason no `TN_AD_*` value goes into a title or a step name, and every
 * hook and test runs inside `withActiveDirectoryRedacted`: JUnit is published,
 * and a failure's message would otherwise name the domain or a controller.
 *
 * The domain is shared and outlives the run. Every join is under a fresh
 * `e2eui-` computer name, with DNS updates off, and teardown leaves the domain
 * — which deletes the computer account — before anything else. The join and
 * leave stories share one join; see `joining and leaving`.
 *
 * The appliance resolves through qemu's DNS, which knows nothing of an internal
 * domain, so each test first points the nameservers at the domain controllers,
 * and teardown puts back what was there.
 */
import type { Page } from '@playwright/test';
import { escapeRegExp } from 'lodash-es';
import {
  adComputerName,
  adJoinTimeoutMs,
  ensureActiveDirectoryJoined,
  ensureActiveDirectoryLeft,
  withActiveDirectoryRedacted,
} from '../../fixtures/active-directory';
import { readDirectoryServices } from '../../fixtures/directory-services';
import {
  type NetworkSettings,
  readNetworkConfig,
  restoreNetworkConfig,
  setNameservers,
} from '../../fixtures/network-config';
import {
  discardDirectoryServicesForm,
  openDirectoryServicesForm,
  saveDirectoryServicesForm,
  selectCredentialType,
  selectServiceType,
} from '../../flows/directory-services';
import { goToDirectoryServices } from '../../flows/navigation';
import { errorDialogLocators } from '../../locators/dialogs';
import {
  credentialTypeLabels,
  directoryServicesLocators,
  directoryServiceTypeLabels,
} from '../../locators/directory-services';
import { jobDialogLocators } from '../../locators/encryption';
import type { E2eApiClient } from '../../support/api/client';
import { leavingTestData, runCleanupSteps } from '../../support/cleanup';
import type { ActiveDirectoryTarget, TargetConfig } from '../../support/config';
import { expect, test } from '../../support/fixtures';

/**
 * An address in TEST-NET-1 (RFC 5737): nothing answers it, so a lookup through
 * it fails on any network.
 */
const deadNameserver = '192.0.2.53';

/**
 * The card after a join or a leave. The page re-reads its state once the panel
 * or dialog has closed, but the status settles a moment after the job does.
 */
const cardTimeoutMs = 60_000;

/** The run's domain. `beforeEach` has already skipped a run without one. */
function domainOf(config: TargetConfig): ActiveDirectoryTarget {
  if (!config.activeDirectory) {
    throw new Error('No Active Directory domain for this run (TN_AD_DOMAIN unset)');
  }
  return config.activeDirectory;
}

/** Matches the domain as the card and middleware show it: upper-cased, whatever it was typed as. */
function domainPattern(ad: ActiveDirectoryTarget): RegExp {
  return new RegExp(`^${escapeRegExp(ad.domain)}$`, 'i');
}

/**
 * Picks Active Directory and fills it in to join the run's domain as
 * `hostname`, with Kerberos User credentials.
 *
 * Enable Service is ticked by the type selection after a debounce, so it is
 * waited on. Enable DNS Updates is unticked: on, a join would register the
 * appliance's NAT address in the shared domain's DNS. The form starts from the
 * stored configuration, and a cleared one still has it on.
 */
async function fillActiveDirectoryJoin(page: Page, ad: ActiveDirectoryTarget, hostname: string): Promise<void> {
  const form = directoryServicesLocators.configForm;
  await selectServiceType(page, directoryServiceTypeLabels.activeDirectory);
  await expect(page.locator(form.enable)).toBeChecked();
  await page.locator(form.enableDnsUpdates).setChecked(false);

  await selectCredentialType(page, credentialTypeLabels.kerberosUser);
  await page.locator(form.username).fill(ad.username);
  await page.locator(form.password).fill(ad.password);
  await page.locator(form.activeDirectory.hostname).fill(hostname);
  await page.locator(form.activeDirectory.domain).fill(ad.domain);
  if (ad.computerOu) {
    await page.locator(form.activeDirectory.computerAccountOu).fill(ad.computerOu);
  }
}

/**
 * Waits for the Leave dialog to close once Leave is pressed.
 *
 * A refused leave raises the error dialog over it and keeps it open, which on its own reads as a
 * leave still running until the timeout. A leave right after the join test's form join stayed
 * open five minutes on every first attempt, while one over the API just after took seconds. So a
 * refusal fails at once with middleware's message, and a timeout says whether the job dialog was
 * still up. The caller's `withActiveDirectoryRedacted` takes the domain out of either.
 */
async function waitForLeave(page: Page): Promise<void> {
  const { leaveDialog } = directoryServicesLocators;
  const refused = page.locator(errorDialogLocators.title);

  await expect.poll(async () => {
    if (await refused.isVisible()) {
      return 'refused';
    }
    if (!await page.locator(leaveDialog.title).isVisible()) {
      return 'closed';
    }
    return await page.locator(jobDialogLocators.title).isVisible()
      ? 'open, with the job dialog up'
      : 'open, with no job dialog';
  }, {
    message: 'the Leave dialog to close',
    timeout: adJoinTimeoutMs,
    intervals: [1_000],
  }).toMatch(/^(closed|refused)$/);

  if (await refused.isVisible()) {
    const message = await page.locator(errorDialogLocators.message).innerText();
    throw new Error(`Leaving the domain was refused: ${message}`);
  }
}

/**
 * Skips a run with no domain. Otherwise points the nameservers at the domain,
 * leaves anything a previous run left joined — which needs the domain's DNS —
 * and clears the configuration. Returns the nameservers as it found them.
 */
async function startOffTheDomain(api: E2eApiClient, config: TargetConfig): Promise<NetworkSettings> {
  // Every story here joins a real domain, and only a run given one has it.
  test.skip(!config.activeDirectory, 'no Active Directory domain for this run (TN_AD_DOMAIN unset)');
  const ad = domainOf(config);
  return withActiveDirectoryRedacted(ad, async () => {
    const before = await readNetworkConfig(api);
    await setNameservers(api, ad.nameservers);
    await ensureActiveDirectoryLeft(api, ad);
    return before;
  });
}

/**
 * Unconditional, and in this order: leaving needs the domain's nameservers,
 * so they are restored last.
 */
async function leaveTheDomain(
  api: E2eApiClient,
  config: TargetConfig,
  before: NetworkSettings | undefined,
): Promise<void> {
  const ad = config.activeDirectory;
  if (!ad || leavingTestData('the Active Directory join and the nameservers pointing at the domain')) {
    return;
  }

  await withActiveDirectoryRedacted(ad, () => runCleanupSteps([
    ['leave the domain and clear the configuration', () => ensureActiveDirectoryLeft(api, ad)],
    ['restore the nameservers', async () => {
      if (before) {
        await restoreNetworkConfig(api, before);
      }
    }],
  ]));
}

/**
 * The join test leaves the appliance in the domain, and the leave test leaves
 * that join: a join takes minutes of middleware time, and both tests paying it
 * once each doubled the spec. So the domain's nameservers, and the join, last
 * from `beforeAll` to `afterAll` rather than one test. The leave test still
 * joins over the API when it finds the appliance out of the domain — on a
 * retry, which starts a fresh worker through `beforeAll`, or run on its own.
 */
test.describe('joining and leaving', () => {
  let networkBefore: NetworkSettings | undefined;

  test.beforeAll(async ({ api, config }) => {
    networkBefore = await startOffTheDomain(api, config);
  });

  test.afterAll(async ({ api, config }) => {
    await leaveTheDomain(api, config, networkBefore);
  });

  test('joining Active Directory from the form shows the domain healthy on the card', async ({ page, api, config }) => {
    const ad = domainOf(config);
    await withActiveDirectoryRedacted(ad, async () => {
      await openDirectoryServicesForm(page);
      await fillActiveDirectoryJoin(page, ad, adComputerName());
      await saveDirectoryServicesForm(page, adJoinTimeoutMs);

      const { card } = directoryServicesLocators;
      await expect(page.locator(card.status)).toHaveText('HEALTHY', { timeout: cardTimeoutMs });
      await expect(page.locator(card.domainName)).toHaveText(domainPattern(ad));
      await expect(page.locator(card.accountCache)).toHaveText('Enabled');

      const { config: stored, status } = await readDirectoryServices(api);
      expect(status).toMatchObject({ type: 'ACTIVEDIRECTORY', status: 'HEALTHY' });
      expect(stored).toMatchObject({ enable: true, service_type: 'ACTIVEDIRECTORY', enable_dns_updates: false });
      // Middleware swaps the user it joined with for the machine account's principal.
      expect(stored.credential?.credential_type).toBe('KERBEROS_PRINCIPAL');
    });
  });

  test('leaving the domain from the card brings back the disabled state', async ({ page, api, config }) => {
    const ad = domainOf(config);
    await withActiveDirectoryRedacted(ad, async () => {
      await ensureActiveDirectoryJoined(api, ad, adComputerName());

      await goToDirectoryServices(page);
      const { card, leaveDialog } = directoryServicesLocators;
      await expect(page.locator(card.status)).toHaveText('HEALTHY', { timeout: cardTimeoutMs });

      await page.locator(card.actionsMenu).click();
      await page.locator(card.leave).click();
      await expect(page.locator(leaveDialog.title)).toBeVisible();

      const leave = page.locator(leaveDialog.leave);
      await expect(leave).toBeDisabled();
      await page.locator(leaveDialog.username).fill(ad.username);
      await page.locator(leaveDialog.password).fill(ad.password);
      await expect(leave).toBeEnabled();
      await leave.click();

      await waitForLeave(page);
      await expect(page.locator(directoryServicesLocators.disabled)).toBeVisible({ timeout: cardTimeoutMs });

      const { config: stored, status } = await readDirectoryServices(api);
      expect(stored.enable).toBe(false);
      expect(status.status ?? null).toBeNull();
    });
  });
});

test.describe('refusing a join', () => {
  let networkBefore: NetworkSettings | undefined;

  test.beforeEach(async ({ api, config }) => {
    networkBefore = await startOffTheDomain(api, config);
  });

  test.afterEach(async ({ api, config }) => {
    await leaveTheDomain(api, config, networkBefore);
  });

  test('a join through a nameserver that cannot resolve the domain is refused on the form', async ({
    page,
    api,
    config,
  }) => {
    const ad = domainOf(config);
    await withActiveDirectoryRedacted(ad, async () => {
      // The first controller stays: the refusal must be about the second nameserver alone.
      await setNameservers(api, [...ad.nameservers.slice(0, 1), deadNameserver]);

      const form = directoryServicesLocators.configForm;
      const serviceTypeField = page.locator(form.serviceTypeField);
      const save = page.locator(form.save);

      await openDirectoryServicesForm(page);
      await fillActiveDirectoryJoin(page, ad, adComputerName());
      await expect(serviceTypeField).not.toContainText('Forward lookup of');
      await expect(save).toBeEnabled();
      await save.click();

      // `validate_kerberos_dns` checks every nameserver, before anything is joined or stored.
      await expect(serviceTypeField).toContainText('Forward lookup of', { timeout: adJoinTimeoutMs });
      await expect(serviceTypeField).toContainText(`failed with nameserver ${deadNameserver}`);
      await expect(save).toBeDisabled();
      await expect(page.locator(errorDialogLocators.title)).toHaveCount(0);

      await discardDirectoryServicesForm(page);
      const { config: stored } = await readDirectoryServices(api);
      expect(stored.service_type).toBeNull();
    });
  });
});
