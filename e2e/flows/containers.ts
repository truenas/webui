/**
 * The Containers page, driven through the UI.
 */
import { expect, type Page } from '@playwright/test';
import { goToContainers } from './navigation';
import { containersLocators } from '../locators/containers';

/**
 * How long a save may take. Changing a network reconfigures the containers'
 * bridge. Also how long a refusal may take to come back from middleware.
 */
export const containerSettingsSaveTimeoutMs = 60_000;

/**
 * Opens Configuration > Settings, starting from the sidebar.
 *
 * `loadedV4Address` is the IPv4 address the appliance holds. The form fills
 * itself from `lxc.config` after it opens, so editing before that address
 * appears could type into a field the load then overwrites.
 */
export async function openContainerSettings(page: Page, loadedV4Address: string): Promise<void> {
  await goToContainers(page);
  await page.locator(containersLocators.header.configurationMenu).click();
  await page.locator(containersLocators.header.settings).click();
  await expect(page.locator(containersLocators.settings.v4Address)).toHaveValue(loadedV4Address);
}

/**
 * Saves the open settings form and waits for the panel to close.
 *
 * The panel closing is the app's own signal that the save succeeded. A refusal
 * leaves it open with the error attached.
 */
export async function saveContainerSettings(page: Page): Promise<void> {
  await page.locator(containersLocators.save).click();
  await expect(page.locator(containersLocators.save)).toBeHidden({ timeout: containerSettingsSaveTimeoutMs });
}

/**
 * Opens Create New Container from the page header, starting from the sidebar.
 * The button renders only once the page has read `lxc.config`, which the click
 * waits for.
 */
export async function openCreateContainerForm(page: Page): Promise<void> {
  await goToContainers(page);
  await page.locator(containersLocators.header.createContainer).click();
  await expect(page.locator(containersLocators.create.name)).toBeVisible();
}

/** How long the image browser may take to list the registry. */
const imageRegistryTimeoutMs = 60_000;

/**
 * Picks an image in the Create form's image browser: searches for `os` and
 * takes the first version of the first match, which is the image
 * `firstRegistryImage` names. Returns once the browser has closed and the
 * form's Image field holds the choice.
 *
 * The browser reads the registry from `images.sys.truenas.net` as it opens, so
 * the first Select can take a while to appear.
 */
export async function chooseFirstImage(page: Page, os: string): Promise<void> {
  const browser = containersLocators.imageBrowser;

  await page.locator(containersLocators.create.browseImages).click();
  await page.locator(browser.search).fill(os);
  await page.locator(browser.selectImageOfOs(os)).first().click({ timeout: imageRegistryTimeoutMs });
  await expect(page.locator(browser.search)).toBeHidden();
  await expect(page.locator(containersLocators.create.image)).not.toHaveValue('');
}

/**
 * Opens a container's details from the list, starting from the sidebar. The
 * Name cell is clicked rather than the row, whose first cell is a selection
 * checkbox.
 *
 * The page opens on the first container's details before the click lands, so
 * this waits for the one readout that names the container: its dataset,
 * `<pool>/.truenas_containers/containers/<name>`.
 */
export async function openContainerDetails(page: Page, name: string): Promise<void> {
  await goToContainers(page);
  await page.locator(containersLocators.list.name(name)).click();
  await expect(page.locator(containersLocators.details.dataset)).toContainText(`/containers/${name}`);
}

/** Dismisses the open side panel, for a form left unedited, which closes without asking. */
export async function closeContainerPanel(page: Page): Promise<void> {
  await page.locator(containersLocators.closePanel).click();
  await expect(page.locator(containersLocators.closePanel)).toBeHidden();
}
