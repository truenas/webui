/**
 * Stories: an admin adds, edits and deletes a Graphite exporter on Reporting > Exporters, and the
 * form refuses a name already in use.
 *
 * Each save is asserted twice: the row says the screen believed it, `reporting.exporters.query`
 * says the appliance did it, and carries the destination, which the list does not show.
 *
 * Edit and delete each run beside a second exporter that must come through untouched. Every row
 * carries its own Edit and Delete buttons, so a row-targeting bug changes the wrong exporter
 * without failing anything else.
 *
 * Every exporter points at `127.0.0.1`, where nothing listens. Middleware stores an exporter without
 * contacting its destination, so nothing leaves the appliance. See `fixtures/reporting-exporters.ts`.
 */
import {
  countExporters, ensureExporterAbsent, ensureGraphiteExporterPresent, findExporter,
  type GraphiteDestination,
} from '../fixtures/reporting-exporters';
import {
  chooseGraphiteType, deleteExporter, fillGraphiteDestination, openAddExporterForm, openEditExporterForm,
  saveExporterForm,
} from '../flows/reporting-exporters';
import { reportingExportersLocators } from '../locators/reporting-exporters';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';
import { slowCallTimeoutMs } from '../support/timeouts';

/** Created through the form, never over the API: that is the thing under test. */
const created = 'e2e-exporter-created';

/** Provisioned over the API so there is something to edit or delete. */
const target = 'e2e-exporter-target';

/** The exporter that must survive whatever is done to the target. */
const bystander = 'e2e-exporter-bystander';

const allNames = [created, target, bystander];

/** Graphite's plaintext port on the appliance itself, where nothing listens. */
const loopback = { destinationIp: '127.0.0.1', destinationPort: 2003 };

const createdDestination: GraphiteDestination = { ...loopback, namespace: 'e2e-created' };
const targetDestination: GraphiteDestination = { ...loopback, namespace: 'e2e-target' };
const bystanderDestination: GraphiteDestination = { ...loopback, namespace: 'e2e-bystander' };

/** How a stored Graphite exporter's required attributes read back. */
function graphiteAttributes(destination: GraphiteDestination): Record<string, unknown> {
  return {
    exporter_type: 'GRAPHITE',
    destination_ip: destination.destinationIp,
    destination_port: destination.destinationPort,
    namespace: destination.namespace,
  };
}

/** Both exporters over the API: acting on one from its row is the thing under test. */
async function seedTargetAndBystander(api: E2eApiClient): Promise<void> {
  await ensureGraphiteExporterPresent(api, target, targetDestination);
  await ensureGraphiteExporterPresent(api, bystander, bystanderDestination);
}

/**
 * Removed before each test as well as after, so an interrupted run leaves the next one able to
 * start, and unconditionally so a failure still cleans up.
 */
test.beforeEach(async ({ api }) => {
  for (const name of allNames) {
    await ensureExporterAbsent(api, name);
  }
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`the reporting exporters ${allNames.join(', ')}`)) {
    return;
  }

  await runCleanupSteps(allNames.map((name): [string, () => Promise<void>] => [
    `remove the reporting exporter ${name}`, () => ensureExporterAbsent(api, name),
  ]));
});

test('an admin adds a Graphite exporter, and the appliance really has one', async ({ page, api }) => {
  const { list, form } = reportingExportersLocators;

  await openAddExporterForm(page);
  await page.locator(form.name).fill(created);
  await chooseGraphiteType(page);
  await fillGraphiteDestination(page, createdDestination);
  await saveExporterForm(page);

  await expect(page.locator(list.name(created))).toHaveText(created);
  await expect(page.locator(list.type(created))).toHaveText('GRAPHITE');
  await expect(page.locator(list.enabled(created))).toBeChecked();

  // The optional attributes were left blank. The form drops a blank attribute rather than sending
  // `''`, so middleware fills in its own defaults: a `prefix` of `''`, which middleware accepts,
  // would have meant the blank was sent.
  expect(await findExporter(api, created)).toMatchObject({
    enabled: true,
    attributes: {
      ...graphiteAttributes(createdDestination),
      prefix: 'scale',
      update_every: 1,
      buffer_on_failures: 10,
      send_names_instead_of_ids: true,
      matching_charts: '*',
    },
  });
});

test('editing an exporter from its row changes the exporter that was picked', async ({ page, api }) => {
  const { list, form } = reportingExportersLocators;
  await seedTargetAndBystander(api);
  const before = await findExporter(api, target);
  const edited: GraphiteDestination = { ...targetDestination, destinationPort: 2004, namespace: 'e2e-edited' };

  await openEditExporterForm(page, target, targetDestination.destinationIp);
  await page.locator(form.destinationPort).fill(String(edited.destinationPort));
  await page.locator(form.namespace).fill(edited.namespace);
  // Enabled on the seeded exporter, so a stored `enabled: false` can only have come from this click.
  await page.locator(form.enabled).click();
  await saveExporterForm(page);

  // The name is the row tag and was left alone, so the row keeps its ids.
  await expect(page.locator(list.enabled(target))).not.toBeChecked();
  await expect(page.locator(list.enabled(bystander))).toBeChecked();

  // The same record, by id: an update, not a delete and a create that happen to leave the list
  // looking the same.
  expect(await findExporter(api, target)).toMatchObject({
    id: before?.id,
    enabled: false,
    attributes: graphiteAttributes(edited),
  });

  expect(await findExporter(api, bystander)).toMatchObject({
    enabled: true,
    attributes: graphiteAttributes(bystanderDestination),
  });
});

test('deleting an exporter from its row removes the exporter that was picked', async ({ page, api }) => {
  await seedTargetAndBystander(api);

  await deleteExporter(page, target);

  // Polled rather than read once: a row can also be hidden while the list is between loads, which
  // proves nothing.
  await expect.poll(() => findExporter(api, target), { timeout: slowCallTimeoutMs }).toBeUndefined();

  // The whole point of the second exporter: the list looks right either way.
  await expect(page.locator(reportingExportersLocators.list.row(bystander))).toBeVisible();
  expect(await findExporter(api, bystander)).toMatchObject({
    enabled: true,
    attributes: graphiteAttributes(bystanderDestination),
  });
});

test('the form refuses a second exporter under a name already in use', async ({ page, api }) => {
  const { form } = reportingExportersLocators;
  await ensureGraphiteExporterPresent(api, bystander, bystanderDestination);

  // A complete, valid Graphite exporter in every field but the name, so the refusal can only be
  // the name. The form has no unique-name check of its own: this is middleware's answer to the
  // save, mapped back onto the Name field.
  await openAddExporterForm(page);
  await page.locator(form.name).fill(bystander);
  await chooseGraphiteType(page);
  await fillGraphiteDestination(page, createdDestination);
  await page.locator(form.save).click();

  await expect(page.locator(form.nameField))
    .toContainText('Specified name is already in use', { timeout: slowCallTimeoutMs });
  await expect(page.locator(form.save)).toBeVisible();

  // Read from the appliance, not the list: the list reloads only after a save succeeds, so it would
  // show one row even if a second exporter had been stored.
  expect(await countExporters(api, bystander)).toBe(1);
  expect(await findExporter(api, bystander)).toMatchObject({
    enabled: true,
    attributes: graphiteAttributes(bystanderDestination),
  });
});
