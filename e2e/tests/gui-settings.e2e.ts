/**
 * Stories: an admin edits the GUI card on System > General Settings: settings needing no restart, a certificate
 * whose restart they decline, the offered choices, and a refused port. Saves are checked on the card and through
 * `system.general.config`. In CI a separate nginx proxies cleartext to port 80, so a web service restart or a port,
 * address or redirect change can cut the run off: the restart prompt is always declined, `ui_restart` is asserted
 * unsent, and none of those is written. Before and after every test changed fields are restored, then the imported
 * certificate removed. Setup writes precede sign-in, as the form reads the general config loaded at sign-in.
 */
import { ensureCertificateAbsent, ensureImportedCertificatePresent, findCertificate } from '../fixtures/certificates';
import {
  readGuiChoices, readGuiSettings, writeGuiSettings, type GuiSettings, type WritableGuiSettings,
} from '../fixtures/general-settings';
import {
  chooseGuiCertificate,
  closeGuiForm,
  discardGuiForm,
  listGuiSelectOptions,
  openGuiForm,
  saveGuiForm,
  toggleHttpsProtocols,
} from '../flows/gui-settings';
import { goToGeneralSettings } from '../flows/navigation';
import { confirmDialogLocators } from '../locators/dialogs';
import { generalSettingsLocators } from '../locators/general-settings';
import type { E2eApiClient } from '../support/api/client';
import { apiCallsTo } from '../support/api-calls';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

test.use({ recordApiCalls: true });

const { gui: card, guiForm: form } = generalSettingsLocators;

/** Imported for the certificate test, and removed before and after every test. */
const certificateName = 'e2e-gui-certificate';

/** What the `max` validator on HTTP Port says. From `tn-form-field-errors.provider.ts`. */
const portTooHighMessage = 'Maximum value is 65535';

/** What the appliance held before this file ran, and therefore what teardown writes back. */
let found: GuiSettings | undefined;

/** Labels sorted, so two lists of options compare regardless of order. */
function sorted(labels: string[]): string[] {
  return [...labels].sort((a, b) => a.localeCompare(b));
}

/**
 * Writes back what this file can change, then removes the certificate.
 *
 * Usage collection is written only if it moved: a fresh install holds `null`,
 * the first save in the UI writes `false`, and writing a value back that was
 * never changed is how it could be left `true`.
 */
async function restoreGuiSettings(api: E2eApiClient): Promise<void> {
  await runCleanupSteps([
    ['write back the GUI settings', async () => {
      // Guarded: if `beforeAll` threw, there is nothing known to write back.
      if (found === undefined) {
        return;
      }

      const restore: WritableGuiSettings = {
        ui_certificate: found.ui_certificate,
        ui_httpsprotocols: found.ui_httpsprotocols,
        ui_consolemsg: found.ui_consolemsg,
      };
      if ((await readGuiSettings(api)).usage_collection !== found.usage_collection) {
        restore.usage_collection = found.usage_collection;
      }
      await writeGuiSettings(api, restore);
    }],
    [`remove certificate ${certificateName}`, () => ensureCertificateAbsent(api, certificateName)],
  ]);
}

test.beforeAll(async ({ api }) => {
  found = await readGuiSettings(api);
});

test.beforeEach(async ({ api }) => {
  await restoreGuiSettings(api);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`the GUI settings as the test left them, and certificate ${certificateName}`)) {
    return;
  }

  await restoreGuiSettings(api);
});

test.describe('settings that need no restart', () => {
  test.beforeEach(async ({ api }) => {
    await writeGuiSettings(api, { ui_httpsprotocols: ['TLSv1.2', 'TLSv1.3'], ui_consolemsg: false });
  });

  test('an admin changes the protocols and console messages, and no restart is offered', async ({ page, api }) => {
    const before = await readGuiSettings(api);

    await goToGeneralSettings(page);
    await expect(page.locator(card.httpsProtocols)).toHaveText('TLSv1.2, TLSv1.3');
    await expect(page.locator(card.consoleMessages)).toHaveText('Disabled');

    await openGuiForm(page);
    // TLSv1.3 stays selected throughout: it is what the API client negotiates.
    await toggleHttpsProtocols(page, ['TLSv1.2']);
    await page.locator(form.consoleMessages).setChecked(true);
    // Only ever off. Turning it on sends data to iX.
    if (before.usage_collection === true) {
      await page.locator(form.usageCollection).setChecked(false);
    }
    await saveGuiForm(page);

    await expect(page.locator(card.httpsProtocols)).toHaveText('TLSv1.3');
    await expect(page.locator(card.consoleMessages)).toHaveText('Enabled');
    await expect(page.locator(card.usageCollection)).toHaveText('Disabled');
    // The card is refreshed by the same dispatch that would raise the prompt, so
    // once its readouts have changed the prompt would already be showing.
    await expect(page.locator(confirmDialogLocators.title)).toBeHidden();

    const after = await readGuiSettings(api);
    expect(after.ui_httpsprotocols).toEqual(['TLSv1.3']);
    expect(after.ui_consolemsg).toBe(true);
    // Every save sends it, so a `null` start comes back `false`.
    expect(after.usage_collection).toBe(false);
    expect(apiCallsTo(page, 'system.general.ui_restart')).toHaveLength(0);
  });
});

test.describe('a setting that needs a restart', () => {
  test.beforeEach(async ({ api }) => {
    await ensureImportedCertificatePresent(api, certificateName);
  });

  test('an admin changes the certificate and declines the restart, and the certificate is kept', async ({
    page, api,
  }) => {
    const certificate = await findCertificate(api, certificateName);
    expect(certificate, `certificate ${certificateName} was not imported`).toBeDefined();

    await goToGeneralSettings(page);
    await expect(page.locator(card.sslCertificate)).not.toHaveText(certificateName);

    await openGuiForm(page);
    await chooseGuiCertificate(page, certificateName);
    await saveGuiForm(page);

    await expect(page.locator(confirmDialogLocators.title)).toContainText('Restart Web Service');
    await expect(page.locator(confirmDialogLocators.message)).toContainText('The web service must restart');
    await page.locator(confirmDialogLocators.cancel).click();
    await expect(page.locator(confirmDialogLocators.title)).toBeHidden();

    await expect(page.locator(card.sslCertificate)).toHaveText(certificateName);
    expect((await readGuiSettings(api)).ui_certificate).toBe(certificate?.id);
    expect(apiCallsTo(page, 'system.general.ui_restart')).toHaveLength(0);
  });
});

test('the form offers every choice middleware lists, and shows the current settings', async ({ page, api }) => {
  const choices = await readGuiChoices(api);
  const before = await readGuiSettings(api);

  await goToGeneralSettings(page);
  await openGuiForm(page);

  const certificates = await listGuiSelectOptions(page, form.certificate, form.certificateOptions);
  const addresses = await listGuiSelectOptions(page, form.address, form.addressOptions);
  const v6addresses = await listGuiSelectOptions(page, form.v6address, form.v6addressOptions);
  const protocols = await listGuiSelectOptions(page, form.httpsProtocols, form.httpsProtocolOptions);

  expect(sorted(certificates)).toEqual(sorted(Object.values(choices.certificates)));
  expect(sorted(addresses)).toEqual(sorted(Object.values(choices.addresses)));
  expect(sorted(v6addresses)).toEqual(sorted(Object.values(choices.v6addresses)));
  expect(sorted(protocols)).toEqual(sorted(Object.values(choices.httpsProtocols)));

  if (before.ui_certificate !== null) {
    const current = choices.certificates[String(before.ui_certificate)];
    expect(current, 'ui_certificate_choices does not list the current certificate').toBeDefined();
    await expect(page.locator(form.certificate)).toContainText(current ?? '');
  }
  for (const address of before.ui_address) {
    await expect(page.locator(form.address)).toContainText(address);
  }
  for (const address of before.ui_v6address) {
    await expect(page.locator(form.v6address)).toContainText(address);
  }
  for (const protocol of before.ui_httpsprotocols) {
    await expect(page.locator(form.httpsProtocols)).toContainText(protocol);
  }

  await closeGuiForm(page);
  expect(await readGuiSettings(api)).toEqual(before);
});

test('the form refuses an HTTP port out of range, and nothing is sent', async ({ page, api }) => {
  const before = await readGuiSettings(api);

  await goToGeneralSettings(page);
  await openGuiForm(page);
  // Not shown for an untouched field, so a message afterwards is the refusal.
  await expect(page.locator(form.portField)).not.toContainText(portTooHighMessage);

  const port = page.locator(form.port);
  await port.fill('70000');
  await port.blur();
  await expect(page.locator(form.portField)).toContainText(portTooHighMessage);
  await expect(page.locator(form.save)).toBeDisabled();

  // A submit attempt, so the checks below mean something: the form's own refusal
  // is what keeps the value from reaching middleware.
  await port.press('Enter');
  await discardGuiForm(page);

  expect(apiCallsTo(page, 'system.general.update')).toHaveLength(0);
  expect(apiCallsTo(page, 'system.general.ui_restart')).toHaveLength(0);
  expect((await readGuiSettings(api)).ui_port).toBe(before.ui_port);
});
