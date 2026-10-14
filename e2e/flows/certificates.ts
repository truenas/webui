/**
 * Certificate signing requests, driven through the UI from Credentials > Certificates.
 */
import { expect, type Page } from '@playwright/test';
import { goToCertificates } from './navigation';
import { csrLocators } from '../locators/certificates';
import { confirmDialogLocators } from '../locators/dialogs';

/** Creating a CSR generates a key pair and deleting one is a job; neither is instant. */
const saveTimeoutMs = 90_000;

export interface CsrSubject {
  state: string;
  city: string;
  organization: string;
  email: string;
  common: string;
  /** Host names, one chip each. */
  san: string[];
}

/**
 * Clicks the open step's Next, once the field only that step has is on screen.
 *
 * Every step's Next shares one id, and the stepper swaps steps on the click, so
 * waiting on the step's own field is what makes the click land on that step.
 */
async function nextFrom(page: Page, stepField: string): Promise<void> {
  await expect(page.locator(stepField)).toBeVisible();
  await page.locator(csrLocators.wizard.next).click();
}

/**
 * Adds a CSR through the Add CSR wizard, starting from the sidebar, and waits for
 * the panel to close.
 *
 * Type, profile, key options and extensions are left at their defaults: a CSR,
 * no profile, RSA 2048 with SHA256, and no extensions. Country defaults to US.
 *
 * The panel closing is the app's own signal that the create job succeeded — a
 * failure raises an error dialog and leaves the wizard open.
 */
export async function addCsr(page: Page, name: string, subject: CsrSubject): Promise<void> {
  const { list, wizard } = csrLocators;
  await goToCertificates(page);
  await page.locator(list.add).click();

  await page.locator(wizard.name).fill(name);
  await nextFrom(page, wizard.name);

  await nextFrom(page, wizard.keyType);

  await page.locator(wizard.state).fill(subject.state);
  await page.locator(wizard.city).fill(subject.city);
  await page.locator(wizard.organization).fill(subject.organization);
  await page.locator(wizard.email).fill(subject.email);
  await page.locator(wizard.common).fill(subject.common);
  for (const host of subject.san) {
    await page.locator(wizard.san).fill(host);
    await page.locator(wizard.san).press('Enter');
  }
  await nextFrom(page, wizard.state);

  await nextFrom(page, wizard.basicConstraints);

  await page.locator(wizard.save).click();
  await expect(page.locator(wizard.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Deletes a CSR from its row's menu, through webui's shared confirm, starting from
 * the sidebar, and waits for its row to go.
 *
 * The CSR card raises the confirm with `hideCheckbox: true`, so Delete is enabled
 * from the start — asserted, so a dialog that grew a gate fails here rather than
 * timing out on a disabled button. Force, its secondary checkbox, is left off.
 * The delete is a job; the card reloads only once it has finished, so the row
 * going is the wait.
 */
export async function deleteCsr(page: Page, name: string): Promise<void> {
  const { list } = csrLocators;
  await goToCertificates(page);
  await page.locator(list.rowMenu(name)).click();
  await page.locator(list.rowMenuDelete(name)).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();

  const confirm = page.locator(confirmDialogLocators.confirm);
  await expect(confirm).toBeEnabled();
  await confirm.click();

  await expect(page.locator(list.row(name))).toBeHidden({ timeout: saveTimeoutMs });
}
