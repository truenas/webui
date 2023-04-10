import { BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { IxFormControlHarness } from 'app/modules/ix-forms/interfaces/ix-form-control-harness.interface';
import { getErrorText } from 'app/modules/ix-forms/utils/harness.utils';

export interface JiraOauthHarnessFilters extends BaseHarnessFilters {
  label: string;
}

export class JiraOauthHarness extends ComponentHarness implements IxFormControlHarness {
  static hostSelector = 'ix-jira-oauth';

  static with(options: JiraOauthHarnessFilters): HarnessPredicate<JiraOauthHarness> {
    return new HarnessPredicate(JiraOauthHarness, options)
      .addOption('label', options.label,
        (harness, label) => HarnessPredicate.stringMatches(harness.getLabelText(), label));
  }

  getMatInputHarness = this.locatorFor(MatInputHarness);
  getErrorText = getErrorText;

  async getLabelText(): Promise<string> {
    const label = await this.locatorFor('label')();
    return label.text({ exclude: '.required' });
  }

  async getValue(): Promise<string> {
    return (await this.getMatInputHarness()).getValue();
  }

  async setValue(value: string): Promise<void> {
    const harness = (await this.getMatInputHarness());
    return harness.setValue(value);
  }

  async getButtonText(): Promise<string> {
    const loginButton = await this.locatorFor(MatButtonHarness)();
    return loginButton.getText();
  }

  async isDisabled(): Promise<boolean> {
    return (await this.getMatInputHarness()).isDisabled();
  }
}
