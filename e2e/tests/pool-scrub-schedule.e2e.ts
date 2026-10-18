/**
 * Stories: on the Storage dashboard, an admin schedules a pool's scrub from the
 * Scheduled Scrub line on its Storage Health card, changes the schedule, and
 * switches it off.
 *
 * The form saves through `pool.scrub.create` when the pool has no task and
 * `pool.scrub.update` when it has one, so each test reads the task back from
 * `pool.scrub.query`, as well as what the line says afterwards. The UI has no
 * delete for a task: unticking Enabled is how a schedule goes off, and the line
 * then reads "Not Set".
 *
 * ## Why this spec builds its own pool
 *
 * Middleware may give a new pool a scrub task of its own, and every test here
 * changes it. A pool of one disk, rebuilt before each test and destroyed after,
 * keeps that away from the worker-scoped `pool` the other specs share. Its task
 * goes with it.
 *
 * Not covered: Scrub Now (`pool-scrub.e2e.ts`) and the boot pool's scrub
 * interval, which is on the Boot Environments page.
 */
import type { CronSchedule } from '../fixtures/cron';
import { ensurePoolPresent } from '../fixtures/pool';
import { ensureScrubTaskEnabled, ensureScrubTasksAbsent, findScrubTasks } from '../fixtures/pool-scrub';
import { ensurePoolAbsent, requireUnusedDisks } from '../fixtures/storage';
import { chooseCustomSchedule } from '../flows/scheduler';
import { chooseScrubSchedule, openScrubScheduleForm, saveScrubScheduleForm } from '../flows/storage';
import { hourlyScheduleLabel } from '../locators/cron';
import { scheduledScrubLocators } from '../locators/storage';
import { leavingTestData } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Built and destroyed here. Not a name any other spec looks for. */
const pool = 'e2e_scrub_schedule_tank';

const hourly: CronSchedule = {
  minute: '0', hour: '*', dom: '*', month: '*', dow: '*',
};
const monthly: CronSchedule = {
  minute: '0', hour: '0', dom: '1', month: '*', dow: '*',
};

/** The form's own default, and what a seeded task starts on. */
const defaultThreshold = 35;

test.beforeEach(async ({ api }) => {
  await ensurePoolAbsent(api, pool);
  await requireUnusedDisks(api, 1);
  await ensurePoolPresent(api, pool);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`pool "${pool}"`)) {
    return;
  }

  await ensurePoolAbsent(api, pool);
});

test('an admin schedules a scrub on a pool that has none', async ({ page, api }) => {
  await ensureScrubTasksAbsent(api, pool);

  const { card, form } = scheduledScrubLocators;
  await openScrubScheduleForm(page, pool);
  // The starting state the save has to change, read off the card behind the panel.
  await expect(page.locator(card.schedule(pool))).toHaveText('Not Set');
  await expect(page.locator(card.configure(pool))).toHaveText('Schedule');

  await chooseScrubSchedule(page, hourlyScheduleLabel);
  await page.locator(form.threshold).fill('20');
  await expect(page.locator(form.enabled)).toBeChecked();
  await saveScrubScheduleForm(page);

  // Configure appears only once the store holds an enabled task for the pool.
  await expect(page.locator(card.configure(pool))).toHaveText('Configure');
  await expect(page.locator(card.schedule(pool))).not.toHaveText('Not Set');

  const tasks = await findScrubTasks(api, pool);
  expect(tasks).toHaveLength(1);
  expect(tasks[0]).toMatchObject({ enabled: true, threshold: 20, schedule: hourly });
});

test('an admin changes the schedule and threshold of a scheduled scrub', async ({ page, api }) => {
  await ensureScrubTaskEnabled(api, pool, { schedule: monthly, threshold: defaultThreshold });
  const [before] = await findScrubTasks(api, pool);

  const { form } = scheduledScrubLocators;
  await openScrubScheduleForm(page, pool);
  // The existing task patched in, which says the panel is editing it.
  await expect(page.locator(form.threshold)).toHaveValue(String(defaultThreshold));

  await chooseCustomSchedule(page, 'schedule', {
    minutes: '15',
    hours: '3',
    days: '*',
    untickWeekdays: ['Sun'],
  });
  await page.locator(form.threshold).fill('10');
  await saveScrubScheduleForm(page);

  // The same task by id: an update, not a second task beside the first.
  const tasks = await findScrubTasks(api, pool);
  expect(tasks).toHaveLength(1);
  expect(tasks[0]).toMatchObject({
    id: before?.id,
    enabled: true,
    threshold: 10,
    schedule: {
      minute: '15',
      hour: '3',
      dom: '*',
      month: '*',
      // The dialog writes the weekdays left ticked by name, Monday first.
      dow: 'mon,tue,wed,thu,fri,sat',
    },
  });
});

test('an admin switches a scheduled scrub off', async ({ page, api }) => {
  await ensureScrubTaskEnabled(api, pool, { schedule: monthly, threshold: defaultThreshold });
  const [before] = await findScrubTasks(api, pool);

  const { card, form } = scheduledScrubLocators;
  await openScrubScheduleForm(page, pool);
  await expect(page.locator(form.enabled)).toBeChecked();
  await page.locator(form.enabled).click();
  await expect(page.locator(form.enabled)).not.toBeChecked();
  await saveScrubScheduleForm(page);

  await expect(page.locator(card.schedule(pool))).toHaveText('Not Set');
  await expect(page.locator(card.configure(pool))).toHaveText('Schedule');

  // Still there, switched off: the form has no delete.
  const tasks = await findScrubTasks(api, pool);
  expect(tasks).toHaveLength(1);
  expect(tasks[0]).toMatchObject({
    id: before?.id,
    enabled: false,
    threshold: defaultThreshold,
    schedule: monthly,
  });
});
