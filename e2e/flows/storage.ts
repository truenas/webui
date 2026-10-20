/**
 * Pools and datasets, driven through the UI.
 */
import { expect, type Download, type Page } from '@playwright/test';
import { goToDatasets, goToStorage } from './navigation';
import { confirmDialogLocators } from '../locators/dialogs';
import {
  autotrimLocators, datasetDetailsLocators, datasetLocators, dedupQuotaLocators, deleteDatasetDialogLocators,
  downloadKeyDialogLocators, manualDiskSelectionLocators, poolDisconnectLocators, poolImportLocators,
  poolScrubLocators, poolWizardLocators, pruneDedupLocators, scheduledScrubLocators, type VdevCategory,
  zvolLocators,
} from '../locators/storage';
import { slowCallTimeoutMs } from '../support/timeouts';

/**
 * Pool creation is a long-running middleware job that formats every member
 * disk. Minutes, not seconds — the ceiling here is deliberately well clear of
 * how long it actually takes (R8.3).
 */
const poolCreateTimeoutMs = 5 * 60_000;

const saveTimeoutMs = 90_000;

/** A `core.download` job, then the fetch of the file it wrote. */
export const keyDownloadTimeoutMs = 60_000;

/**
 * `pool.import_find` scans every disk before the Import Pool form renders, and
 * `pool.import_pool` mounts the pool and restarts what depends on it. Both are
 * jobs, so both get room well past what a one-disk pool takes.
 */
const poolImportFindTimeoutMs = 2 * 60_000;
const poolImportTimeoutMs = 3 * 60_000;

/**
 * `pool.export` without `destroy` unmounts the pool and, when the pool holds
 * the system dataset, moves that off first. Same ceiling as the Delete Pool
 * case in `tests/pool-disconnect.e2e.ts`.
 */
const poolExportTimeoutMs = 3 * 60_000;

/** `pool.ddt_prune` is a job behind a progress dialog, and the Prune dialog closes after it. */
const dedupPruneTimeoutMs = 2 * 60_000;

/** Auto TRIM and the dedup quota save through a `pool.update` job, and their dialogs close after it. */
const poolUpdateTimeoutMs = 60_000;

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
export async function selectFirstOption(page: Page, select: string, options: string): Promise<void> {
  await page.locator(select).click();
  await page.locator(options).first().click();
}

export interface NewPool {
  name: string;
  /** Number of disks in the single RAIDZ2 data vdev. */
  width: number;
}

/** What the Automated Disk Selection half of a vdev step is set to. */
export interface AutomatedVdevs {
  /**
   * The layout option's label, as the select shows it: `Mirror`, `RAIDZ1`.
   * Left alone when absent: the spare and cache steps do not render the select.
   */
  layout?: string;
  /** Disks per vdev. */
  width: number;
  /**
   * How many vdevs. Left alone when absent: the log, spare and cache steps do
   * not render the select at all.
   */
  vdevs?: number;
}

/** What the Data step's Automated Disk Selection is set to for a dRAID layout. */
export interface DraidVdevs {
  /** The layout option's label, as the select shows it: `dRAID1`, `dRAID2`, `dRAID3`. */
  layout: string;
  /** Data disks per redundancy group. */
  dataDevices: number;
  /** Distributed hot spares per vdev. */
  spares: number;
  /** Disks per vdev: its groups' data and parity disks, plus its spares. */
  children: number;
  vdevs: number;
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
  await openPoolWizard(page, pool.name);
  await configureAutomatedVdevs(page, 'data', { layout: 'RAIDZ2', width: pool.width, vdevs: 1 });
  await goToReview(page, 'data');
  await submitPool(page);
}

/**
 * Opens the pool creation wizard from the Storage dashboard and stops on its
 * General step, with nothing filled in.
 */
export async function startPoolWizard(page: Page): Promise<void> {
  await goToStorage(page);
  await page.locator(poolWizardLocators.createPoolEntry).click();
  await expect(page.locator(poolWizardLocators.name)).toBeVisible();
}

/**
 * Opens the pool creation wizard from the Storage dashboard, names the pool and
 * moves on from General, stopping on the Data step.
 */
export async function openPoolWizard(page: Page, name: string): Promise<void> {
  await startPoolWizard(page);
  await page.locator(poolWizardLocators.name).fill(name);
  await leaveGeneralStep(page);
}

/** Moves on from the wizard's General step and waits for the Data step. */
export async function leaveGeneralStep(page: Page): Promise<void> {
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
}

/**
 * Fills in the open vdev step's Automated Disk Selection: layout, then the first
 * disk size on offer, then width and vdev count. Layout and vdev count only where
 * `vdevs` gives them, since some steps do not render them.
 *
 * In that order because each choice regenerates the options of the next — the
 * width options come from the selected disk size, see `selectFirstOption`.
 */
export async function configureAutomatedVdevs(
  page: Page,
  type: VdevCategory,
  vdevs: AutomatedVdevs,
): Promise<void> {
  if (vdevs.layout !== undefined) {
    await selectOption(page, poolWizardLocators.layout, poolWizardLocators.layoutOption(vdevs.layout));
  }
  await selectFirstOption(page, poolWizardLocators.diskSize(type), poolWizardLocators.diskSizeOptions(type));

  await selectOption(page, poolWizardLocators.width(type), poolWizardLocators.widthOption(type, vdevs.width));
  if (vdevs.vdevs !== undefined) {
    await selectOption(
      page,
      poolWizardLocators.vdevCount(type),
      poolWizardLocators.vdevCountOption(type, vdevs.vdevs),
    );
  }
}

/**
 * Fills in the Data step's Automated Disk Selection for a dRAID layout: layout, the first disk
 * size on offer, then Data Devices, Distributed Hot Spares, Children and the vdev count.
 *
 * In that order because each choice regenerates the options of the next
 * (`draid-selection.component.ts`). Children in particular is reset to the widest it can be
 * whenever Data Devices or the spares change, so it has to be chosen after both.
 */
export async function configureDraidVdevs(page: Page, draid: DraidVdevs): Promise<void> {
  await selectOption(page, poolWizardLocators.layout, poolWizardLocators.layoutOption(draid.layout));
  await selectFirstOption(page, poolWizardLocators.diskSize('data'), poolWizardLocators.diskSizeOptions('data'));

  await selectOption(
    page,
    poolWizardLocators.draidDataDevices('data'),
    poolWizardLocators.draidDataDevicesOption('data', draid.dataDevices),
  );
  await selectOption(
    page,
    poolWizardLocators.draidSpares('data'),
    poolWizardLocators.draidSparesOption('data', draid.spares),
  );
  await selectOption(
    page,
    poolWizardLocators.draidChildren('data'),
    poolWizardLocators.draidChildrenOption('data', draid.children),
  );
  await selectOption(
    page,
    poolWizardLocators.vdevCount('data'),
    poolWizardLocators.vdevCountOption('data', draid.vdevs),
  );
}

/**
 * Opens the Manual Disk Selection dialog from the open vdev step. The step's button stays disabled
 * until a layout is chosen, so the caller picks one first.
 *
 * The button does not wait for the wizard's disks, and the dialog does not either: it is handed
 * the unused disks once, as it opens (`openManualSelectionDialog` in `pool-manager.store.ts`), and
 * never re-reads them. Opened while `disk.details` is still in flight, it lists no disks for as
 * long as it stays open. So this waits for the Unassigned Disks card to show the disks first.
 */
export async function openManualDiskSelection(page: Page, type: VdevCategory): Promise<void> {
  await expect(
    page.locator(poolWizardLocators.inventory).first(),
    'The wizard never listed its unused disks, so Manual Disk Selection would open with none.',
  ).toBeVisible({ timeout: slowCallTimeoutMs });

  const open = page.locator(poolWizardLocators.manualSelection(type));
  await expect(open).toBeEnabled();
  await open.click();
  await expect(page.locator(manualDiskSelectionLocators.title)).toBeVisible();
}

/**
 * Drags one element of the Manual Disk Selection dialog onto another: a disk into a vdev, or out
 * of one back onto the unused list.
 *
 * `locator.dragTo()` drives HTML5 drag and drop in Chromium from real mouse events, so
 * `ngx-drag-drop` receives the `dragstart`, `dragover` and `drop` it listens for, with a
 * `dataTransfer` it fills in itself. A drop has no readback of its own, so the caller asserts
 * where the disk landed.
 */
export async function dragDisk(page: Page, from: string, to: string): Promise<void> {
  const source = page.locator(from);
  await expect(source).toBeVisible();
  await source.dragTo(page.locator(to));
}

/**
 * Adds a vdev to the open Manual Disk Selection dialog, which holds no other, and drags the named
 * disks into it, checking that each one landed. Whether that is enough disks for the layout is
 * the caller's to assert.
 */
export async function addManualVdev(page: Page, layout: string, disks: string[]): Promise<void> {
  const vdev = manualDiskSelectionLocators.vdevDropzone(layout, 1);

  await page.locator(manualDiskSelectionLocators.add).click();
  await expect(page.locator(vdev)).toBeVisible();
  for (const disk of disks) {
    await dragDisk(page, manualDiskSelectionLocators.unusedDiskDrag(disk), vdev);
    await expect(page.locator(manualDiskSelectionLocators.vdevDisk(disk))).toBeVisible();
  }
}

/** Leaves the open vdev step by its Save And Go To Review, and waits for the Review step. */
export async function goToReview(page: Page, type: VdevCategory): Promise<void> {
  await page.locator(poolWizardLocators.saveAndReview(type)).click();
  await expect(page.locator(poolWizardLocators.createPool)).toBeVisible();
}

/**
 * Creates the pool from the Review step: Create Pool, the confirmation, and the
 * create job, which the app finishes by returning to the Storage dashboard.
 */
export async function submitPool(page: Page): Promise<void> {
  await page.locator(poolWizardLocators.createPool).click();

  // Creating a pool wipes its member disks, so the wizard asks for confirmation.
  await confirmDestructiveAction(page);

  // Landing back on the storage dashboard is the app's own signal that the
  // create job finished; the wizard stays put on failure.
  await expect(page).toHaveURL(/\/storage\/?$/, { timeout: poolCreateTimeoutMs });
}

/**
 * Creates a software-encrypted pool from the Review step, and stops on the
 * Download Encryption Key dialog.
 *
 * Not {@link submitPool}: for an encrypted pool the wizard opens that dialog when
 * the create job finishes, and returns to the Storage dashboard only once it is
 * closed. So the dialog appearing is the signal that the job ended, and it gets
 * the same ceiling.
 */
export async function submitEncryptedPool(page: Page): Promise<void> {
  await page.locator(poolWizardLocators.createPool).click();
  await confirmDestructiveAction(page);

  await expect(page.locator(downloadKeyDialogLocators.title)).toBeVisible({ timeout: poolCreateTimeoutMs });
}

/**
 * Clicks Download Encryption Key on the open dialog and returns the download.
 *
 * The file is not built in the browser: the click starts a `core.download` job
 * for `pool.dataset.export_keys` and then fetches its result, so the download
 * gets longer than an action.
 */
export async function downloadPoolKey(page: Page): Promise<Download> {
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: keyDownloadTimeoutMs }),
    page.locator(downloadKeyDialogLocators.download).click(),
  ]);

  return download;
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
  await selectOption(page, datasetLocators.shareType, datasetLocators.shareTypeOption('SMB'));

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
 * Selects `parent` in the tree and opens the Add Dataset form under it.
 *
 * Waits for the form's own Parent Path to name `parent`. The form loads the
 * parent before it will save, and this is the readback that it loaded the one
 * that was selected.
 */
export async function openAddDatasetForm(page: Page, parent: string): Promise<void> {
  await goToDatasets(page);

  const node = page.locator(datasetLocators.treeNode(parent));
  await expect(node).toBeVisible();
  await node.click();

  await page.locator(datasetLocators.addDataset).click();
  await expect(page.locator(datasetLocators.parentPath)).toHaveText(parent);
}

/**
 * Selects a dataset in the tree and opens its edit form from the details card.
 *
 * The page lands with the pool root selected, and the root's card has an Edit
 * too, so the card's Path has to name `name` before the click. Otherwise Edit
 * can open the root's form.
 *
 * Then waits for the disabled Name field to hold the dataset's full name. It is
 * patched in only once the record has loaded, and so are the values in
 * Other Options, so changing a field before that would change it on an empty form.
 */
export async function openEditDatasetForm(page: Page, name: string): Promise<void> {
  await goToDatasets(page);

  const node = page.locator(datasetLocators.treeNode(name));
  await expect(node).toBeVisible();
  await node.click();
  await expect(page.locator(datasetDetailsLocators.path)).toHaveText(name);

  const edit = page.locator(datasetLocators.editDataset);
  await expect(edit).toBeVisible();
  await edit.click();

  await expect(page.locator(datasetLocators.name)).toHaveValue(name);
}

/**
 * Saves the open dataset form and waits for the panel to close.
 *
 * Works for the zvol form too: both are hosted by the same side panel, and Save is the panel's.
 */
export async function saveDatasetForm(page: Page): Promise<void> {
  await page.locator(datasetLocators.save).click();
  await expect(page.locator(datasetLocators.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Selects `parent` in the tree and opens the Add Zvol form under it.
 *
 * Waits for the Sync readout to show something. The form loads the parent before it knows what
 * a new zvol inherits, and the readout stays empty until then. A field changed before that would
 * be on a form that has not finished setting itself up.
 */
export async function openAddZvolForm(page: Page, parent: string): Promise<void> {
  await goToDatasets(page);

  const node = page.locator(datasetLocators.treeNode(parent));
  await expect(node).toBeVisible();
  await node.click();
  await expect(page.locator(datasetDetailsLocators.path)).toHaveText(parent);

  await page.locator(zvolLocators.add).click();
  // An empty element has no size, so Playwright does not count it as visible.
  await expect(page.locator(zvolLocators.syncValue)).toBeVisible();
}

/**
 * Selects a zvol in the tree and opens its edit form from the details card.
 *
 * Same order as `openEditDatasetForm`, and for the same reasons: the card has to belong to `name`
 * before Edit Zvol is clicked, and the disabled Name field is patched in only once the record has
 * loaded, in the same step that fills in the size and the properties.
 */
export async function openEditZvolForm(page: Page, name: string): Promise<void> {
  await goToDatasets(page);

  const node = page.locator(datasetLocators.treeNode(name));
  await expect(node).toBeVisible();
  await node.click();
  await expect(page.locator(datasetDetailsLocators.path)).toHaveText(name);

  const edit = page.locator(zvolLocators.edit);
  await expect(edit).toBeVisible();
  await edit.click();

  await expect(page.locator(zvolLocators.name)).toHaveValue(name);
}

/**
 * Sets Sync on the open zvol form, by the label its select shows.
 *
 * Sync is an inline editable, so the select is not on screen until the readout is clicked. The
 * editable closes itself on the next click outside it, which for every caller here is Save.
 */
export async function setZvolSync(page: Page, label: string): Promise<void> {
  await page.locator(zvolLocators.syncValue).click();
  await expect(page.locator(zvolLocators.sync)).toBeVisible();
  await selectOption(page, zvolLocators.sync, zvolLocators.syncOption(label));
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
 * Imports an exported pool by name, from the storage dashboard's Import Pool
 * panel.
 *
 * Waits for the panel's Import button to go. The panel closes only after the
 * import job's dialog has closed on the job finishing, so its closing is the
 * app's own signal that the job ended. Whether it succeeded is the caller's to
 * check through the API.
 */
export async function importPool(page: Page, pool: string): Promise<void> {
  await goToStorage(page);
  await page.locator(poolImportLocators.open).click();

  // The select renders only once `pool.import_find` has finished.
  const select = page.locator(poolImportLocators.pool);
  await expect(select).toBeVisible({ timeout: poolImportFindTimeoutMs });
  await select.click();

  const option = page.locator(poolImportLocators.poolOption(pool));
  await expect(option, `The Import Pool panel should offer exactly one pool named "${pool}".`).toHaveCount(1);
  await option.click();

  const submit = page.locator(poolImportLocators.submit);
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(submit).toBeHidden({ timeout: poolImportTimeoutMs });
}

/**
 * Starts a scrub of `pool` from the Scrub Now button on its Storage Health card.
 *
 * The button raises a confirmation with no tick box, and its Start Scrub is
 * what starts the `pool.scrub` job. Returns once that dialog has closed; the
 * scrub itself runs on afterwards, so waiting for it is the caller's.
 */
export async function startScrub(page: Page, pool: string): Promise<void> {
  await goToStorage(page);

  const start = page.locator(poolScrubLocators.start(pool));
  await expect(start).toBeVisible({ timeout: saveTimeoutMs });
  await start.click();

  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await page.locator(confirmDialogLocators.confirm).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Prunes `pool`'s dedup table from Prune on its Storage Health card, by
 * percentage or by age, and waits for the dialog to close on the job's success.
 *
 * Percentage is the choice the dialog opens on, so it is left as it is. Its
 * slider is a native range input, which takes a value from `fill`.
 */
export async function pruneDedupTable(
  page: Page,
  pool: string,
  by: { percentage: number } | { days: number },
): Promise<void> {
  await goToStorage(page);

  const open = page.locator(pruneDedupLocators.open(pool));
  await expect(open).toBeVisible({ timeout: saveTimeoutMs });
  await open.click();
  await expect(page.locator(pruneDedupLocators.title)).toBeVisible();

  if ('percentage' in by) {
    await page.locator(pruneDedupLocators.percentage).fill(String(by.percentage));
  } else {
    await page.locator(pruneDedupLocators.pruneBy('Age')).click();
    await page.locator(pruneDedupLocators.days).fill(String(by.days));
  }
  await page.locator(pruneDedupLocators.submit).click();

  // The dialog stays open on a failure, behind the error the job raised.
  await expect(page.locator(pruneDedupLocators.title)).toBeHidden({ timeout: dedupPruneTimeoutMs });
}

/**
 * Opens the Auto TRIM dialog from the Advanced Actions menu in `pool`'s header
 * on the Storage dashboard. Returns once the dialog has rendered.
 */
export async function openAutotrimDialog(page: Page, pool: string): Promise<void> {
  await goToStorage(page);

  const menu = page.locator(autotrimLocators.menu(pool));
  await expect(menu).toBeVisible({ timeout: saveTimeoutMs });
  await menu.click();
  await page.locator(autotrimLocators.open(pool)).click();
  await expect(page.locator(autotrimLocators.title)).toBeVisible();
}

/** Saves the Auto TRIM dialog and waits for it to close, which it does once `pool.update` has finished. */
export async function saveAutotrimDialog(page: Page): Promise<void> {
  await page.locator(autotrimLocators.save).click();
  await expect(page.locator(autotrimLocators.title)).toBeHidden({ timeout: poolUpdateTimeoutMs });
}

/**
 * Opens the Set Quota dialog from the Deduplication Table line on `pool`'s
 * Storage Health card. Returns once the dialog has rendered.
 */
export async function openSetDedupQuota(page: Page, pool: string): Promise<void> {
  await goToStorage(page);

  const open = page.locator(dedupQuotaLocators.open(pool));
  await expect(open).toBeVisible({ timeout: saveTimeoutMs });
  await open.click();
  await expect(page.locator(dedupQuotaLocators.title)).toBeVisible();
}

/** Picks Auto, Custom or None in the Set Quota dialog's Quota. */
export async function chooseDedupQuotaType(page: Page, label: 'Auto' | 'Custom' | 'None'): Promise<void> {
  await selectOption(page, dedupQuotaLocators.quotaType, dedupQuotaLocators.quotaTypeOption(label));
}

/**
 * Saves the Set Quota dialog and waits for it to close. It closes only once the
 * `pool.update` job behind its progress dialog has succeeded, and stays open on
 * a failure, behind the error the job raised.
 */
export async function saveDedupQuota(page: Page): Promise<void> {
  await page.locator(dedupQuotaLocators.save).click();
  await expect(page.locator(dedupQuotaLocators.title)).toBeHidden({ timeout: poolUpdateTimeoutMs });
}

/**
 * Opens the scheduled scrub form from the Scheduled Scrub line on `pool`'s
 * Storage Health card: Schedule or Configure, whichever the line offers.
 * Returns once Threshold has rendered, so the panel is open.
 */
export async function openScrubScheduleForm(page: Page, pool: string): Promise<void> {
  await goToStorage(page);

  const configure = page.locator(scheduledScrubLocators.card.configure(pool));
  await expect(configure).toBeVisible({ timeout: saveTimeoutMs });
  await configure.click();
  await expect(page.locator(scheduledScrubLocators.form.threshold)).toBeVisible();
}

/** Picks a schedule preset in the scheduled scrub form by its whole label — see `hourlyScheduleLabel`. */
export async function chooseScrubSchedule(page: Page, label: string): Promise<void> {
  const { form } = scheduledScrubLocators;
  await selectOption(page, form.schedule, form.scheduleOption(label));
}

/**
 * Saves the scheduled scrub form and waits for the panel to close, which it
 * does only once `pool.scrub.create` or `pool.scrub.update` has succeeded.
 */
export async function saveScrubScheduleForm(page: Page): Promise<void> {
  const save = page.locator(scheduledScrubLocators.form.save);
  await save.click();
  await expect(save).toBeHidden({ timeout: saveTimeoutMs });
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

/**
 * Exports the pool from the open Disconnect dialog, keeping its data on the
 * disks, and returns once the dialog has closed.
 *
 * `deleteConfiguration` is the "Delete saved configurations from TrueNAS?" tick,
 * which the form starts ticked, so it is set either way rather than only when
 * it is wanted. The dialog closes only after the export job's own dialog has,
 * which is the app's signal that the job ended. Whether it did what was asked
 * is the caller's to check through the API.
 */
export async function exportPoolFromDialog(
  page: Page,
  { deleteConfiguration }: { deleteConfiguration: boolean },
): Promise<void> {
  await page.locator(poolDisconnectLocators.exportOption).click();

  // Export's own checkboxes rendering is the readback for the click, as the
  // name field is for Delete's.
  const cascade = page.locator(poolDisconnectLocators.cascade);
  await expect(cascade).toBeVisible();
  await cascade.setChecked(deleteConfiguration);
  await page.locator(poolDisconnectLocators.confirm).setChecked(true);

  const submit = page.locator(poolDisconnectLocators.submit);
  await expect(submit).toBeEnabled();
  await submit.click();

  await expect(page.locator(poolDisconnectLocators.title)).toBeHidden({ timeout: poolExportTimeoutMs });
}
