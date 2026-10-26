/**
 * Custom apps from YAML: Discover's Install via YAML, and an installed custom app's Edit. Both open
 * the same side panel, whose Save runs `app.create` or `app.update` behind a job progress dialog and
 * closes the panel only once the job has succeeded.
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { appInstallTimeoutMs } from '../fixtures/apps';
import { appCatalogLocators, customAppLocators, installedAppLocators } from '../locators/apps';

/**
 * From Apps > Installed: Discover Apps, then Install via YAML under Custom App's menu. Names the app,
 * puts `compose` in the editor, saves, and returns once the panel has closed on the installed list.
 * The form navigates to `/apps/installed`, which then selects an app and moves on to its own route
 * (`/apps/installed/<train>/<name>`), so either URL is the list.
 */
export async function installCustomAppFromYaml(page: Page, name: string, compose: string): Promise<void> {
  await page.locator(appCatalogLocators.discoverApps).click();
  await page.locator(customAppLocators.menu).click();
  await page.locator(customAppLocators.installViaYaml).click();

  await page.locator(customAppLocators.releaseName).fill(name);
  await page.locator(customAppLocators.config).fill(compose);
  await page.locator(customAppLocators.save).click();

  await expect(page.locator(customAppLocators.save)).toBeHidden({ timeout: appInstallTimeoutMs });
  await expect(page).toHaveURL(/\/apps\/installed(\/|$)/);
}

/** The editor's text as CodeMirror renders it, one `.cm-line` per line; enough for a short file. */
async function readEditorText(config: Locator): Promise<string> {
  return (await config.innerText()).trimEnd();
}

/**
 * Selects the app's row and presses Edit on its Application Info card. Waits for the panel to finish
 * loading the app's current config, which contains `loaded`, then replaces it with `compose` and
 * saves.
 */
export async function editCustomAppYaml(page: Page, name: string, loaded: string, compose: string): Promise<void> {
  const app = installedAppLocators(name);
  await page.locator(app.name).click();
  await page.locator(app.edit).click();

  const config = page.locator(customAppLocators.config);
  const save = page.locator(customAppLocators.save);
  await expect(config).toContainText(loaded);
  // Save stays disabled until the panel has loaded the real config, so this is "done loading".
  await expect(save).toBeEnabled();

  // A fill has once kept part of the loaded file next to the new one, which middleware rejects as
  // invalid YAML and leaves the panel open until the install timeout. Confirm the editor holds
  // exactly the new file before saving, and fill again if it does not.
  await expect(async () => {
    await config.fill(compose);
    expect(await readEditorText(config)).toBe(compose.trimEnd());
  }).toPass({ timeout: 30_000 });
  await save.click();

  await expect(page.locator(customAppLocators.save)).toBeHidden({ timeout: appInstallTimeoutMs });
}
