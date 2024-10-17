import { ComponentHarness } from '@angular/cdk/testing';

export class ReviewWizardStepHarness extends ComponentHarness {
  static readonly hostSelector = 'ix-review-wizard-step';

  async getConfigurationItems(): Promise<Record<string, string>> {
    const itemTexts: Record<string, string> = {};
    const items = await this.locatorForAll('.topology-summary > .summary-item')();
    for (const item of items) {
      const label = await item.text({ exclude: '.value' });
      const value = await item.text({ exclude: '.label' });
      itemTexts[label] = value;
    }
    return itemTexts;
  }

  async getWarnings(): Promise<string[]> {
    const warningTexts: string[] = [];
    const warnings = await this.locatorForAll('.warning')();
    for (const warning of warnings) {
      warningTexts.push(await warning.text({ exclude: '.warning' }));
    }
    return warningTexts;
  }

  async getErrors(): Promise<string[]> {
    const errorTexts: string[] = [];
    const errors = await this.locatorForAll('.error-warning')();
    for (const error of errors) {
      errorTexts.push(await error.text({ exclude: '.error-warning' }));
    }
    return errorTexts;
  }
}
