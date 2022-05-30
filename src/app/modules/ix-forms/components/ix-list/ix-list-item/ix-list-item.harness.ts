import { ComponentHarness } from '@angular/cdk/testing';
import {
  fillControlValues,
  getControlValues,
  indexControlsByLabel, IxFormBasicValueType,
  SupportedFormControlHarness,
  supportedFormControlSelectors,
} from 'app/modules/ix-forms/testing/control-harnesses.helpers';

/**
 * TODO: Some functionality is very similar to IxFormHarness.
 * See if can be optimized somehow.
 */
export class IxListItemHarness extends ComponentHarness {
  static hostSelector = 'ix-list-item';

  getControlHarnesses = this.locatorForAll(...supportedFormControlSelectors);

  async getControlHarnessesDict(): Promise<{ [label: string]: SupportedFormControlHarness }> {
    const controls = await this.getControlHarnesses();
    return indexControlsByLabel(controls);
  }

  async getFormValues(): Promise<{ [label: string]: IxFormBasicValueType }> {
    const controlsDict = await this.getControlHarnessesDict();
    return getControlValues(controlsDict);
  }

  async fillForm(values: { [label: string]: unknown }): Promise<void> {
    const controls = await this.getControlHarnessesDict();
    return fillControlValues(controls, values);
  }
}
