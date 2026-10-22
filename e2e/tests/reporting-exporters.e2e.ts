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
 *
 * Creating or deleting an exporter takes middleware about 16 seconds, as it regenerates netdata's
 * configuration, and seeding and removing one per test was most of this spec's time. So one exporter
 * is carried through the stories — the add test creates it, the edit test changes it, the delete test
 * removes it — and the bystander lasts the whole file. Each test that needs an exporter still makes
 * sure it is there, over the API, so a retry or a test run on its own pays for the seeding instead.
 */
import {
  countExporters, ensureExporterAbsent, ensureGraphiteExporterPresent, findExporter,
  type GraphiteDestination, type StoredExporter,
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

/**
 * Created through the form by the add test — never over the API there, since that is the thing under
 * test — then edited and deleted by the tests after it.
 */
const subject = 'e2e-exporter-subject';

/** The exporter that must survive whatever is done to the subject. Created once, for the file. */
const bystander = 'e2e-exporter-bystander';

const allNames = [subject, bystander];

/** Graphite's plaintext port on the appliance itself, where nothing listens. */
const loopback = { destinationIp: '127.0.0.1', destinationPort: 2003 };

const subjectDestination: GraphiteDestination = { ...loopback, namespace: 'e2e-subject' };
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

/**
 * The subject as the add test leaves it, or as close as the API makes it when that test did not run
 * first: an enabled Graphite exporter. Acting on it from its row is the thing under test.
 */
async function ensureSubject(api: E2eApiClient): Promise<StoredExporter> {
  return ensureGraphiteExporterPresent(api, subject, subjectDestination);
}

/**
 * Removed before the file as well as after, so an interrupted run leaves the next one able to
 * start, and unconditionally so a failure still cleans up. A failed test restarts the worker, which
 * runs `afterAll` and then this again, so a retry starts from here too.
 */
test.beforeAll(async ({ api }) => {
  for (const name of allNames) {
    await ensureExporterAbsent(api, name);
  }
  await ensureGraphiteExporterPresent(api, bystander, bystanderDestination);
});

test.afterAll(async ({ api }) => {
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
  await page.locator(form.name).fill(subject);
  await chooseGraphiteType(page);
  await fillGraphiteDestination(page, subjectDestination);
  await saveExporterForm(page);

  await expect(page.locator(list.name(subject))).toHaveText(subject);
  await expect(page.locator(list.type(subject))).toHaveText('GRAPHITE');
  await expect(page.locator(list.enabled(subject))).toBeChecked();

  // The optional attributes were left blank. The form drops a blank attribute rather than sending
  // `''`, so middleware fills in its own defaults: a `prefix` of `''`, which middleware accepts,
  // would have meant the blank was sent.
  expect(await findExporter(api, subject)).toMatchObject({
    enabled: true,
    attributes: {
      ...graphiteAttributes(subjectDestination),
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
  const before = await ensureSubject(api);
  const edited: GraphiteDestination = { ...subjectDestination, destinationPort: 2004, namespace: 'e2e-edited' };

  await openEditExporterForm(page, subject, subjectDestination.destinationIp);
  await page.locator(form.destinationPort).fill(String(edited.destinationPort));
  await page.locator(form.namespace).fill(edited.namespace);
  // Enabled on the subject, so a stored `enabled: false` can only have come from this click.
  await page.locator(form.enabled).click();
  await saveExporterForm(page);

  // The name is the row tag and was left alone, so the row keeps its ids.
  await expect(page.locator(list.enabled(subject))).not.toBeChecked();
  await expect(page.locator(list.enabled(bystander))).toBeChecked();

  // The same record, by id: an update, not a delete and a create that happen to leave the list
  // looking the same.
  expect(await findExporter(api, subject)).toMatchObject({
    id: before.id,
    enabled: false,
    attributes: graphiteAttributes(edited),
  });

  expect(await findExporter(api, bystander)).toMatchObject({
    enabled: true,
    attributes: graphiteAttributes(bystanderDestination),
  });
});

test('deleting an exporter from its row removes the exporter that was picked', async ({ page, api }) => {
  await ensureSubject(api);

  await deleteExporter(page, subject);

  // Polled rather than read once: a row can also be hidden while the list is between loads, which
  // proves nothing.
  await expect.poll(() => findExporter(api, subject), { timeout: slowCallTimeoutMs }).toBeUndefined();

  // The whole point of the second exporter: the list looks right either way.
  await expect(page.locator(reportingExportersLocators.list.row(bystander))).toBeVisible();
  expect(await findExporter(api, bystander)).toMatchObject({
    enabled: true,
    attributes: graphiteAttributes(bystanderDestination),
  });
});

test('the form refuses a second exporter under a name already in use', async ({ page, api }) => {
  const { form } = reportingExportersLocators;

  // A complete, valid Graphite exporter in every field but the name, so the refusal can only be
  // the name. The form has no unique-name check of its own: this is middleware's answer to the
  // save, mapped back onto the Name field.
  await openAddExporterForm(page);
  await page.locator(form.name).fill(bystander);
  await chooseGraphiteType(page);
  await fillGraphiteDestination(page, subjectDestination);
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
