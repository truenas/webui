import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import { MatSelectHarness, SelectHarnessFilters } from '@angular/material/select/testing';
import * as cronParser from 'cron-parser';
import { IxLabelHarness } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.harness';
import { IxFormControlHarness } from 'app/modules/forms/ix-forms/interfaces/ix-form-control-harness.interface';
import { getErrorText } from 'app/modules/forms/ix-forms/utils/harness.utils';
import { SchedulerModalHarness } from 'app/modules/scheduler/components/scheduler-modal/scheduler-modal.harness';

export interface SchedulerFilters extends SelectHarnessFilters {
  label?: string;
}

export class SchedulerHarness extends ComponentHarness implements IxFormControlHarness {
  static readonly hostSelector = 'ix-scheduler';

  static with(options: SchedulerFilters): HarnessPredicate<SchedulerHarness> {
    return new HarnessPredicate(SchedulerHarness, options)
      .addOption('label', options.label, (harness, label) => HarnessPredicate.stringMatches(harness.getLabelText(), label));
  }

  getSelectHarness = this.locatorFor(MatSelectHarness);
  getErrorText = getErrorText;

  async getLabelText(): Promise<string> {
    const label = await this.locatorForOptional(IxLabelHarness)();
    if (!label) {
      return '';
    }
    return label.getLabel();
  }

  async openCustomModal(): Promise<void> {
    const select = await this.getSelectHarness();
    await select.open();
    await select.clickOptions({ text: /Create/ });
  }

  async getValue(): Promise<string> {
    return (await this.getSelectHarness()).getValueText();
  }

  async setValue(crontab: string): Promise<void> {
    await this.openCustomModal();

    const locator = this.documentRootLocatorFactory();
    try {
      const modal = await locator.locatorFor(SchedulerModalHarness)();

      const parts = crontab.split(' ');
      const hasMinutes = parts.length === 5;

      if (hasMinutes) {
        await modal.setMinutes(parts[0]);
        await modal.setHours(parts[1]);
        await modal.setDays(parts[2]);
      } else {
        await modal.setHours(parts[0]);
        await modal.setDays(parts[1]);
      }

      const parsed = cronParser.parseExpression(hasMinutes ? crontab : `0 ${crontab}`);
      await modal.setMonths(parsed.fields.month);
      await modal.setDaysOfWeek(parsed.fields.dayOfWeek);
      await modal.pressDone();
    } catch (error: unknown) {
      if ((error as Error).message.includes('Failed to find element')
        && (error as Error).message.includes('ix-scheduler-modal')) {
        throw new Error('Failed to find ix-scheduler-modal. This may happen if Store with timezone is not provided.');
      }

      throw error;
    }
  }

  async isDisabled(): Promise<boolean> {
    return (await this.getSelectHarness()).isDisabled();
  }
}
