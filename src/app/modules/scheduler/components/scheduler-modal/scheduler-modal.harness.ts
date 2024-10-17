import { ComponentHarness, parallel } from '@angular/cdk/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { DayOfTheWeekRange, MonthRange } from 'cron-parser/types';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';

export class SchedulerModalHarness extends ComponentHarness {
  static readonly hostSelector = 'ix-scheduler-modal';

  getMinutesInput = this.locatorFor(IxInputHarness.with({ label: 'Minutes' }));
  getHoursInput = this.locatorFor(IxInputHarness.with({ label: 'Hours' }));
  getDaysInput = this.locatorFor(IxInputHarness.with({ label: 'Days of Month' }));
  getMonthCheckboxes = this.locatorForAll(MatCheckboxHarness.with({ ancestor: '.months' }));
  getDaysOfWeekCheckboxes = this.locatorForAll(MatCheckboxHarness.with({ ancestor: '.weekdays' }));

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
    const doneButton = await this.locatorFor(MatButtonHarness.with({ text: 'Done' }))();
    await doneButton.click();
  }
}
