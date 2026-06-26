import { ComponentHarness, parallel } from '@angular/cdk/testing';
import {
  TnButtonHarness, TnCheckboxHarness, TnInputHarness,
} from '@truenas/ui-components';
import { DayOfTheWeekRange, MonthRange } from 'cron-parser/types';

export class SchedulerModalHarness extends ComponentHarness {
  static readonly hostSelector = 'ix-scheduler-modal';

  getMinutesInput = this.locatorFor(TnInputHarness.with({ name: 'minutes' }));
  getHoursInput = this.locatorFor(TnInputHarness.with({ name: 'hours' }));
  getDaysInput = this.locatorFor(TnInputHarness.with({ name: 'days' }));
  getMonthCheckboxes = this.locatorForAll(TnCheckboxHarness.with({ ancestor: '.months' }));
  getDaysOfWeekCheckboxes = this.locatorForAll(TnCheckboxHarness.with({ ancestor: '.weekdays' }));

  async setMinutes(minutes: string): Promise<void> {
    const input = await this.getMinutesInput();
    await input.setValue(minutes);
  }

  async setHours(hours: string): Promise<void> {
    const input = await this.getHoursInput();
    await input.setValue(hours);
  }

  async setDays(days: string): Promise<void> {
    const input = await this.getDaysInput();
    await input.setValue(days);
  }

  async setMonths(months: readonly MonthRange[]): Promise<void> {
    const checkboxes = await this.getMonthCheckboxes();
    await parallel(() => checkboxes.map((checkbox, i) => {
      return months.includes((i + 1) as MonthRange)
        ? checkbox.check()
        : checkbox.uncheck();
    }));
  }

  async setDaysOfWeek(daysOfWeek: readonly DayOfTheWeekRange[]): Promise<void> {
    // TODO: Will break if Sunday is not the first day of the week.
    const checkboxes = await this.getDaysOfWeekCheckboxes();
    await parallel(() => checkboxes.map((checkbox, i) => {
      return daysOfWeek.includes(i as DayOfTheWeekRange)
        ? checkbox.check()
        : checkbox.uncheck();
    }));
  }

  async pressDone(): Promise<void> {
    const doneButton = await this.locatorFor(TnButtonHarness.with({ label: 'Done' }))();
    await doneButton.click();
  }
}
