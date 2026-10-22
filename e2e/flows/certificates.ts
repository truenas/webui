/**
 * Certificates and certificate signing requests, driven through the UI from
 * Credentials > Certificates.
 */
import { expect, type Download, type Page } from '@playwright/test';
import { goToCertificates } from './navigation';
import { selectOption } from './storage';
import { certificateLocators, csrLocators } from '../locators/certificates';
import { confirmDialogLocators } from '../locators/dialogs';

/**
 * Creating a CSR generates a key pair, and importing, updating and deleting a
 * certificate are all jobs; none of them is instant.
 */
const saveTimeoutMs = 90_000;

/** Each file is a `core.download` job, then the fetch of the file it wrote. */
const downloadTimeoutMs = 60_000;

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

/** An EC key in place of the default RSA 2048, picked on Certificate Options. */
export interface CsrEcKey {
  /** One of what `certificate.ec_curve_choices` returns, such as `SECP384R1`. */
  ecCurve: string;
}

/**
 * Takes the Add CSR wizard, starting from the sidebar, as far as Confirm Options,
 * and stops there without saving — see {@link addCsr}.
 *
 * With `ecKey`, Key Type is switched to EC and the curve is picked; the swap of Key
 * Length for EC Curve is waited on, since the curve select is not there before it.
 */
export async function fillCsrWizard(page: Page, name: string, subject: CsrSubject, ecKey?: CsrEcKey): Promise<void> {
  const { list, wizard } = csrLocators;
  await goToCertificates(page);
  await page.locator(list.add).click();

  await page.locator(wizard.name).fill(name);
  await nextFrom(page, wizard.name);

  if (ecKey) {
    await expect(page.locator(wizard.keyType)).toBeVisible();
    await selectOption(page, wizard.keyType, wizard.keyTypeOption('EC'));
    await expect(page.locator(wizard.keyLength)).toBeHidden();
    await expect(page.locator(wizard.ecCurve)).toBeVisible();
    await selectOption(page, wizard.ecCurve, wizard.ecCurveOption(ecKey.ecCurve));
  }
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
}

/** Saves the Add CSR wizard from Confirm Options, and waits for the panel to close — see {@link addCsr}. */
export async function saveCsrWizard(page: Page): Promise<void> {
  const { save } = csrLocators.wizard;
  await page.locator(save).click();
  await expect(page.locator(save)).toBeHidden({ timeout: saveTimeoutMs });
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
  await fillCsrWizard(page, name, subject);
  await saveCsrWizard(page);
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

export interface ImportedCertificate {
  name: string;
  /** PEM, pasted as it stands. */
  certificate: string;
  privateKey: string;
}

/**
 * Imports a certificate from the Certificates card, starting from the sidebar,
 * and waits for the panel to close.
 *
 * "Add To Trusted Store" and the passphrase are left at their defaults: off, and
 * none. The panel closing is the app's own signal that the create job succeeded
 * — a failure raises an error dialog and leaves the form open.
 */
export async function importCertificate(page: Page, certificate: ImportedCertificate): Promise<void> {
  const { card, importForm } = certificateLocators;
  await goToCertificates(page);
  await page.locator(card.import).click();

  await page.locator(importForm.name).fill(certificate.name);
  await page.locator(importForm.certificate).fill(certificate.certificate);
  await page.locator(importForm.privateKey).fill(certificate.privateKey);

  await page.locator(importForm.save).click();
  await expect(page.locator(importForm.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Opens the Edit Certificate panel from a row's menu, starting from the sidebar.
 *
 * Waits on the Identifier holding this certificate's name, which is the panel's
 * own sign that it has the record to edit.
 */
export async function openEditCertificateForm(page: Page, name: string): Promise<void> {
  const { card, editForm } = certificateLocators;
  await goToCertificates(page);
  await page.locator(card.rowMenu(name)).click();
  await page.locator(card.rowMenuEdit(name)).click();

  await expect(page.locator(editForm.name)).toHaveValue(name);
}

/** Saves the open Edit Certificate panel and waits for it to close — see {@link importCertificate}. */
export async function saveCertificateForm(page: Page): Promise<void> {
  const { save } = certificateLocators.editForm;
  await page.locator(save).click();
  await expect(page.locator(save)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Opens the certificate's or the key's PEM from the open Edit Certificate panel's
 * Actions menu, and returns what the dialog shows, closing the dialog again.
 *
 * The dialog is read before it is closed: the panel stays open beneath it, so the
 * other one can be opened next.
 */
export async function viewCertificatePem(page: Page, which: 'certificate' | 'key'): Promise<string> {
  const { editForm, viewDialog } = certificateLocators;
  await page.locator(editForm.actions).click();
  await page.locator(which === 'certificate' ? editForm.viewCertificate : editForm.viewKey).click();

  await expect(page.locator(viewDialog.title)).toBeVisible();
  const pem = await page.locator(viewDialog.pem).inputValue();

  await page.locator(viewDialog.close).click();
  await expect(page.locator(viewDialog.title)).toBeHidden();

  return pem;
}

/**
 * Clicks Download in a row's menu on either card, starting from the sidebar, and
 * returns the two files it saves, in the order `fileNames` names them.
 *
 * One click starts two `core.download`s, the certificate or request and then the
 * key. Each wait picks its file by name, so the two cannot both settle on whichever
 * arrives first, and a file that never arrives fails its own wait by name.
 */
export async function downloadFromRow(
  page: Page,
  row: { menu: string; download: string },
  fileNames: [string, string],
): Promise<[Download, Download]> {
  await goToCertificates(page);
  await page.locator(row.menu).click();

  const waitFor = (fileName: string): Promise<Download> => page.waitForEvent('download', {
    predicate: (download) => download.suggestedFilename() === fileName,
    timeout: downloadTimeoutMs,
  });
  const [first, second] = await Promise.all([
    waitFor(fileNames[0]),
    waitFor(fileNames[1]),
    page.locator(row.download).click(),
  ]);

  return [first, second];
}

/**
 * Deletes a certificate from its row's menu, through webui's shared confirm,
 * starting from the sidebar, and waits for its row to go.
 *
 * The card raises the confirm with `hideCheckbox: true`, the same as the CSR card
 * — see {@link deleteCsr}. Force is left off. The delete is a job, and the card
 * reloads only once it has finished, so the row going is the wait.
 */
export async function deleteCertificate(page: Page, name: string): Promise<void> {
  const { card } = certificateLocators;
  await goToCertificates(page);
  await page.locator(card.rowMenu(name)).click();
  await page.locator(card.rowMenuDelete(name)).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();

  const confirm = page.locator(confirmDialogLocators.confirm);
  await expect(confirm).toBeEnabled();
  await confirm.click();

  await expect(page.locator(card.row(name))).toBeHidden({ timeout: saveTimeoutMs });
}
