/**
 * Apps > Configuration > Sign-in to a Docker registry: adding a registry, editing one and deleting
 * one from its row.
 */
import { expect, type Page } from '@playwright/test';
import { openAppsConfigMenu } from './apps';
import { confirmDestructiveAction, selectOption } from './storage';
import { madeUpCredentials } from '../fixtures/docker-registries';
import { appsLocators } from '../locators/apps';
import { dockerRegistriesLocators, dockerRegistryFormLocators } from '../locators/docker-registries';
import { slowCallTimeoutMs } from '../support/timeouts';

const form = dockerRegistryFormLocators;

/** From Apps > Installed, opens Sign-in to a Docker registry from the Configuration menu. */
export async function goToDockerRegistries(page: Page): Promise<void> {
  await openAppsConfigMenu(page);
  await page.locator(appsLocators.dockerRegistries).click();
  await expect(page).toHaveURL(/\/apps\/docker-registries$/);
}

/**
 * Add Registry, and Other Registry in its URI select, which shows the URI and Name fields. Both open
 * empty: choosing Other Registry clears what Docker Hub had filled in.
 */
export async function openOtherRegistryForm(page: Page): Promise<void> {
  await page.locator(dockerRegistriesLocators.addRegistry).click();
  await selectOption(page, form.registry, form.otherRegistry);
  await expect(page.locator(form.uri)).toHaveValue('');
}

/** Presses Save and waits for the panel to close, which it does once middleware has stored the registry. */
export async function saveRegistry(page: Page): Promise<void> {
  const save = page.locator(form.save);

  await expect(save).toBeEnabled();
  await save.click();
  // A ceiling: create and update log in to the registry through the Docker daemon first.
  await expect(save).toBeHidden({ timeout: slowCallTimeoutMs });
}

/** Adds a registry under Other Registry with {@link madeUpCredentials}. */
export async function addRegistry(page: Page, uri: string, name: string): Promise<void> {
  await openOtherRegistryForm(page);

  await page.locator(form.uri).fill(uri);
  await page.locator(form.name).fill(name);
  await page.locator(form.username).fill(madeUpCredentials.username);
  await page.locator(form.password).fill(madeUpCredentials.password);

  await saveRegistry(page);
}

/** The row's Delete, and the shared confirm with its tick box. The list reloads once the delete succeeds. */
export async function deleteRegistry(page: Page, uri: string, name: string): Promise<void> {
  await page.locator(dockerRegistriesLocators.registry(uri, name).delete).click();
  await confirmDestructiveAction(page);
}
