/**
 * ACME DNS authenticators, driven through the UI from Credentials > Certificates.
 */
import { expect, type Page } from '@playwright/test';
import { goToCertificates } from './navigation';
import { acmeDnsLocators } from '../locators/acme-dns-authenticators';
import { confirmDialogLocators } from '../locators/dialogs';

/** Saving and deleting are middleware calls, and the form loads provider schemas before it shows a field. */
const saveTimeoutMs = 60_000;

/**
 * Opens the add form from the card, starting from the sidebar, and waits for
 * Cloudflare's fields — the provider selected by default — to render.
 */
export async function openAddAcmeDnsAuthenticatorForm(page: Page): Promise<void> {
  await goToCertificates(page);

  await page.locator(acmeDnsLocators.card.add).click();
  await expect(page.locator(acmeDnsLocators.form.apiToken)).toBeVisible({ timeout: saveTimeoutMs });
}

/**
 * Opens an authenticator's edit form from its row, starting from the sidebar,
 * and waits for the form to hold that authenticator.
 */
export async function openEditAcmeDnsAuthenticatorForm(page: Page, name: string): Promise<void> {
  await goToCertificates(page);

  await page.locator(acmeDnsLocators.card.edit(name)).click();
  await expect(page.locator(acmeDnsLocators.form.name)).toHaveValue(name);
  await expect(page.locator(acmeDnsLocators.form.apiToken)).toBeVisible({ timeout: saveTimeoutMs });
}

/**
 * Saves the form and waits for the panel to close.
 *
 * The panel closing is the app's own signal that the save succeeded — a
 * refusal leaves it open with the error attached.
 */
export async function saveAcmeDnsAuthenticatorForm(page: Page): Promise<void> {
  await page.locator(acmeDnsLocators.form.save).click();
  await expect(page.locator(acmeDnsLocators.form.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Deletes an authenticator from its row, starting from the sidebar, and waits
 * for its row to go.
 *
 * The card raises webui's shared confirm through `confirmDelete`, which does not
 * pass `hideCheckbox`, so Delete stays **disabled** until the confirm box is
 * ticked — asserted on the way, so a dialog that lost its gate fails here.
 */
export async function deleteAcmeDnsAuthenticator(page: Page, name: string): Promise<void> {
  await goToCertificates(page);
  await page.locator(acmeDnsLocators.card.delete(name)).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();

  const confirm = page.locator(confirmDialogLocators.confirm);
  await expect(confirm).toBeDisabled();
  await page.locator(confirmDialogLocators.checkbox).click();
  await expect(confirm).toBeEnabled();

  await confirm.click();
  await expect(page.locator(acmeDnsLocators.card.row(name))).toBeHidden({ timeout: saveTimeoutMs });
}
