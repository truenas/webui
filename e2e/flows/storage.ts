/**
 * Pool, dataset and SMB share creation, driven through the UI.
 */
import { expect, type Page } from '@playwright/test';
import { goToDatasets, goToShares, goToStorage } from './navigation';
import { confirmDialogLocators } from '../locators/dialogs';
import {
  datasetLocators, deleteDatasetDialogLocators, poolDisconnectLocators, poolWizardLocators, smbLocators,
} from '../locators/storage';

/**
 * Pool creation is a long-running middleware job that formats every member
 * disk. Minutes, not seconds — the ceiling here is deliberately well clear of
 * how long it actually takes (R8.3).
 */
const poolCreateTimeoutMs = 5 * 60_000;

const saveTimeoutMs = 90_000;

/** Picks an option from a `tn-select` by opening it and clicking the option. */
export async function selectOption(page: Page, select: string, option: string): Promise<void> {
  await page.locator(select).click();
  await page.locator(option).click();
}

/**
 * Picks whichever option a `tn-select` offers first.
 *
 * Used for the disk-size control, whose option ids encode a size and media type
 * that vary per appliance, so the test cannot name the one it wants.
 *
 * This is a genuine guess, and `requireUnusedDisks` is what makes it a safe one.
 * The wizard buckets the inventory by type and size and generates the width
 * options from the *selected* bucket alone, so taking the first bucket is only
 * sound if some bucket holds the whole vdev — which is the condition that
 * precondition now asserts. It previously counted disks across the whole
 * inventory, and an earlier version of this comment claimed there was only one
 * size on offer. Neither was true: `.first()` is here precisely because there
 * may be several.
 *
 * `options` must be a selector matching only the given select's options — a
 * `data-test` prefix, never `[role="option"]`. That earlier version matched
 * across the whole document, so `.first()` could land on a stale option: CDK
 * overlays detach on an animation, and this runs immediately after the previous
 * select has closed. The result would be a wrong disk size in the slowest test
 * in the suite, which is a miserable way to spend an afternoon.
 */
async function selectFirstOption(page: Page, select: string, options: string): Promise<void> {
  await page.locator(select).click();
  await page.locator(options).first().click();
}

export interface NewPool {
  name: string;
  /** Number of disks in the single RAIDZ2 data vdev. */
  width: number;
}

/**
 * Creates a pool with one RAIDZ2 data vdev, through the pool creation wizard.
 *
 * RAIDZ2 rather than RAIDZ1: at nine disks wide, single parity leaves the pool
 * unprotected for the whole of a resilver, which is exactly when the next
 * failure tends to arrive. Two parity disks is the conventional floor at this
 * width.
 */
export async function createRaidz2Pool(page: Page, pool: NewPool): Promise<void> {
  await goToStorage(page);
  await page.locator(poolWizardLocators.createPoolEntry).click();

  await expect(page.locator(poolWizardLocators.name)).toBeVisible();
  await page.locator(poolWizardLocators.name).fill(pool.name);
  await page.locator(poolWizardLocators.next).click();

  // The step after General is not always Data. `pool-manager-wizard.component.html`
  // inserts an "Enclosure Options" step when the appliance reports more than one
  // enclosure and the platform supports them, and `tn-stepper` renders only the
  // active step — so on such hardware `select-layout` is simply not in the DOM
  // and every following action fails on a bare 20 second timeout naming a
  // selector rather than the reason.
  //
  // Virtual appliances have no enclosures, so this holds today. Asserted rather
  // than assumed because it is exactly the kind of thing that changes when the
  // suite is first pointed at real hardware.
  await expect(
    page.locator(poolWizardLocators.layout),
    'The Data step did not follow General. An "Enclosure Options" step appears on appliances '
    + 'reporting multiple enclosures, and this flow does not know how to cross it.',
  ).toBeVisible();

  await selectOption(page, poolWizardLocators.layout, poolWizardLocators.layoutRaidz2);
  await selectFirstOption(page, poolWizardLocators.diskSize, poolWizardLocators.diskSizeOptions);

  await selectOption(page, poolWizardLocators.width, poolWizardLocators.widthOption(pool.width));
  await selectOption(page, poolWizardLocators.vdevCount, poolWizardLocators.vdevCountOption(1));

  await page.locator(poolWizardLocators.saveAndReview).click();
  await page.locator(poolWizardLocators.createPool).click();

  // Creating a pool wipes its member disks, so the wizard asks for confirmation.
  await confirmDestructiveAction(page);

  // Landing back on the storage dashboard is the app's own signal that the
  // create job finished; the wizard stays put on failure.
  await expect(page).toHaveURL(/\/storage\/?$/, { timeout: poolCreateTimeoutMs });
}

/**
 * Accepts the destructive-action confirmation dialog.
 *
 * Waits for the dialog rather than probing for it. `isVisible()` is a
 * point-in-time check that does not wait, so calling it immediately after the
 * triggering click races the dialog's render: it returns false, the
 * confirmation is silently skipped, and the failure surfaces much later as an
 * unrelated navigation timeout with a dialog sitting on screen.
 *
 * Required, not optional, for the same reason — a confirmation that can be
 * quietly skipped is one that will be.
 */
export async function confirmDestructiveAction(page: Page): Promise<void> {
  const confirmCheckbox = page.locator(confirmDialogLocators.checkbox);
  const confirmButton = page.locator(confirmDialogLocators.confirm);

  await expect(confirmCheckbox).toBeVisible();
  await confirmCheckbox.click();

  // The confirm button stays disabled until the checkbox is ticked.
  await expect(confirmButton).toBeEnabled();
  await confirmButton.click();
}

/**
 * Creates a dataset with the SMB preset, under the given pool, **without**
 * creating a share.
 *
 * The preset ticks "Create SMB Share" by default, which would create the share
 * here as a side effect. We untick it so the dataset and the share stay
 * separate steps of the journey — the dataset is prepared *for* sharing (SMB
 * ACL type, case insensitivity), and publishing it is its own action.
 */
export async function createSmbDataset(page: Page, pool: string, name: string): Promise<void> {
  await goToDatasets(page);

  // Select the pool's root in the tree first — "Add Dataset" acts on whatever
  // is currently selected.
  await page.locator(datasetLocators.treeNode(pool)).click();

  await page.locator(datasetLocators.addDataset).click();
  await expect(page.locator(datasetLocators.name)).toBeVisible();

  await page.locator(datasetLocators.name).fill(name);
  await selectOption(page, datasetLocators.shareType, datasetLocators.shareTypeSmb);

  // Untick "Create SMB Share". The SMB Name field is only rendered while that
  // box is ticked, so its disappearance confirms the toggle went the intended
  // way rather than blindly flipping whatever state it was in.
  await expect(page.locator(datasetLocators.smbName)).toBeVisible();
  await page.locator(datasetLocators.createSmbShare).click();
  await expect(page.locator(datasetLocators.smbName)).toBeHidden();

  await page.locator(datasetLocators.save).click();
  await expect(page.locator(datasetLocators.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Creates an SMB share pointing at a dataset's mountpoint, and starts the SMB
 * service when the app offers to.
 *
 * Starting the service matters: a share on a stopped service exists in the
 * configuration but serves nothing, so a journey that stops at "share created"
 * would report success on a NAS that is not actually sharing anything.
 */
export async function createSmbShare(page: Page, path: string, name: string): Promise<void> {
  await goToShares(page);

  await page.locator(smbLocators.addShare).click();
  await expect(page.locator(smbLocators.path)).toBeVisible();

  await page.locator(smbLocators.path).fill(path);
  await page.locator(smbLocators.name).fill(name);

  await page.locator(smbLocators.save).click();

  // Creating a share prompts to configure its ACL. Decline: accepting navigates
  // away to the ACL editor, which is a separate journey. Asserted rather than
  // probed — if this prompt ever stops appearing, that is a flow change worth
  // failing on rather than silently tolerating.
  const declineAcl = page.locator(smbLocators.declineAclPrompt);
  await expect(declineAcl).toBeVisible({ timeout: saveTimeoutMs });
  await declineAcl.click();

  // With the ACL prompt dismissed, the app notices the SMB service is stopped
  // and offers to start it. This dialog appears only when the service is not
  // already running (`checkIfServiceIsEnabled` -> `dialogService.startService`).
  const startService = page.locator(smbLocators.startService);
  await expect(startService).toBeVisible({ timeout: saveTimeoutMs });
  await startService.click();

  await expect(page.locator(smbLocators.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Selects a dataset or zvol in the tree and opens its delete dialog.
 *
 * `name` is the full dataset id (`pool/child`) — the tree node's id is built
 * from `dataset.name`, which middleware reports as the full path, so the leaf
 * alone does not address it.
 *
 * "Delete" lives on the details card, which renders for whatever the tree has
 * selected, so the selection has to land before the click.
 */
export async function openDeleteDatasetDialog(page: Page, name: string): Promise<void> {
  await goToDatasets(page);

  const node = page.locator(datasetLocators.treeNode(name));
  await expect(node).toBeVisible();
  await node.click();

  const open = page.locator(deleteDatasetDialogLocators.open);
  await expect(open).toBeVisible();
  await open.click();

  // Asserted, not probed: `isVisible()` does not wait, and acting on a dialog
  // that has not rendered silently skips the interaction.
  await expect(page.locator(deleteDatasetDialogLocators.title)).toBeVisible();
}

/**
 * Satisfies both gates of the open delete-dataset dialog — the name typed back
 * and the Confirm tick — without submitting.
 *
 * Separate from the submit so a test can choose *how* to submit, which is the
 * whole subject of `datasets-deletion.e2e.ts`: the button and the Enter key
 * have to agree, and for a long time they did not.
 */
export async function fillDatasetDeletionConfirmation(page: Page, name: string): Promise<void> {
  await page.locator(deleteDatasetDialogLocators.name).fill(name);
  await page.locator(deleteDatasetDialogLocators.confirm).click();

  await expect(page.locator(deleteDatasetDialogLocators.submit)).toBeEnabled();
}

/**
 * Opens a pool's Disconnect dialog from the storage dashboard.
 *
 * Through the sidebar rather than a `page.goto`, so the card the button lives
 * on is the one a user would have clicked.
 */
export async function openPoolDisconnectDialog(page: Page, pool: string): Promise<void> {
  await goToStorage(page);

  const open = page.locator(poolDisconnectLocators.open(pool));
  await expect(open).toBeVisible({ timeout: saveTimeoutMs });
  await open.click();

  await expect(page.locator(poolDisconnectLocators.title)).toBeVisible();
}

/**
 * Puts the open Disconnect dialog into its most destructive state: "Delete
 * Pool" chosen, which sets `destroy` and reveals the name field.
 *
 * Stops short of the gates. This is the state in which `pool.export` would run
 * with `destroy: true`, and the tests differ only in what they do next.
 */
export async function chooseDeletePool(page: Page): Promise<void> {
  await page.locator(poolDisconnectLocators.deleteOption).click();

  // The name field appearing is how we know `destroy` actually went on — the
  // option card is a plain div, so its click has no other readback.
  await expect(page.locator(poolDisconnectLocators.name)).toBeVisible();
}
