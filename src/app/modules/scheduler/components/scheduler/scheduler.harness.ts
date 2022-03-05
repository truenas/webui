import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import { MatSelectHarness, SelectHarnessFilters } from '@angular/material/select/testing';
import * as cronParser from 'cron-parser';
import { IxFormControlHarness } from 'app/modules/ix-forms/interfaces/ix-form-control-harness.interface';
import { getErrorText } from 'app/modules/ix-forms/utils/harness.utils';
import { SchedulerModalHarness } from 'app/modules/scheduler/components/scheduler-modal/scheduler-modal.harness';

export interface SchedulerFilters extends SelectHarnessFilters {
  label?: string;
}

export class SchedulerHarness extends ComponentHarness implements IxFormControlHarness {
  static hostSelector = 'ix-scheduler';

  static with(options: SchedulerFilters): HarnessPredicate<SchedulerHarness> {
    return new HarnessPredicate(SchedulerHarness, options)
      .addOption('label', options.label,
        (harness, label) => HarnessPredicate.stringMatches(harness.getLabelText(), label));
  }

  getSelectHarness = this.locatorFor(MatSelectHarness);
  getErrorText = getErrorText;

  async getLabelText(): Promise<string> {
    const label = await this.locatorFor('label')();
    return label.text({ exclude: '.required' });
  }

  async openCustomModal(): Promise<void> {
    const select = (await this.getSelectHarness());
    await select.open();
    await select.clickOptions({ text: /Custom/ });
  }

  async getValue(): Promise<string> {
    return (await this.getSelectHarness()).getValueText();
  }

  async setValue(crontab: string): Promise<void> {
    await this.openCustomModal();

    const locator = this.documentRootLocatorFactory();
    const modal = await locator.locatorFor(SchedulerModalHarness)();

    const [minutes, hours, days] = crontab.split(' ');
    await modal.setMinutes(minutes);
    await modal.setHours(hours);
    await modal.setDays(days);

    const parsed = cronParser.parseExpression(crontab);
    await modal.setMonths(parsed.fields.month);
    await modal.setDaysOfWeek(parsed.fields.dayOfWeek);
    await modal.pressDone();
  }

  async isDisabled(): Promise<boolean> {
    return (await this.getSelectHarness()).isDisabled();
  }
}
