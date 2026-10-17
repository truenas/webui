/**
 * The custom schedule dialog every `ix-scheduler` opens, driven through the UI.
 * Shared by every task form that has a schedule.
 */
import { expect, type Page } from '@playwright/test';
import { selectOption } from './storage';
import { schedulerLocators } from '../locators/cron';

/** What to type into the dialog, and which weekdays to untick. */
export interface CustomSchedule {
  minutes: string;
  hours: string;
  /** "Days of Month". */
  days: string;
  /** Days of Week labels to untick — `Sun`, `Mon`. Every one starts ticked; see {@link chooseCustomSchedule}. */
  untickWeekdays: string[];
}

/**
 * Picks "Create Custom schedule" on the `ix-scheduler` bound to `control` —
 * `schedule` on most task forms — fills the dialog in, and presses Done.
 *
 * On a form whose schedule is still a preset, the dialog opens on Hourly, which
 * ticks every weekday and every month. Each weekday to untick is asserted
 * ticked first, so a dialog that opened on something else fails here rather
 * than being clicked into the opposite state.
 *
 * The weekdays left ticked are what the dialog writes as the crontab's
 * day-of-week, by name and in Mon…Sun order (`mon,tue,…`).
 */
export async function chooseCustomSchedule(page: Page, control: string, schedule: CustomSchedule): Promise<void> {
  const dialog = schedulerLocators;
  await selectOption(page, dialog.presets(control), dialog.createCustom(control));
  await expect(page.locator(dialog.minutes)).toBeVisible();

  await page.locator(dialog.minutes).fill(schedule.minutes);
  await page.locator(dialog.hours).fill(schedule.hours);
  await page.locator(dialog.days).fill(schedule.days);
  for (const label of schedule.untickWeekdays) {
    const weekday = page.locator(dialog.weekday(label));
    await expect(weekday).toBeChecked();
    await weekday.click();
    await expect(weekday).not.toBeChecked();
  }

  await page.locator(dialog.done).click();
  await expect(page.locator(dialog.done)).toBeHidden();
}
