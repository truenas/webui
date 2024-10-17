import { ComponentHarness } from '@angular/cdk/testing';
import { IxFormControlHarness } from 'app/modules/forms/ix-forms/interfaces/ix-form-control-harness.interface';
import {
  getControlValues,
  indexControlsByLabel, IxFormBasicValueType,
  SupportedFormControlHarness,
  supportedFormControlSelectors,
} from 'app/modules/forms/ix-forms/testing/control-harnesses.helpers';

/**
 * TODO: Some functionality is very similar to IxFormHarness.
 * See if can be optimized somehow.
 */
export class IxListItemHarness extends ComponentHarness {
  static readonly hostSelector = 'ix-list-item';

  getControlHarnesses = this.locatorForAll(...supportedFormControlSelectors);

  async getControlHarnessesDict(): Promise<Record<string, SupportedFormControlHarness>> {
    const controls = await this.getControlHarnesses();
    return indexControlsByLabel(controls);
  }

  async getFormValues(): Promise<Record<string, IxFormBasicValueType>> {
    const controlsDict = await this.getControlHarnessesDict();
    return getControlValues(controlsDict);
  }

  async fillForm(values: Record<string, unknown>): Promise<void> {
    const labels = Object.keys(values);
    for (const label of labels) {
      const controlsDict = await this.getControlHarnessesDict();
      const control = controlsDict[label] as IxFormControlHarness;
      if (!control) {
        throw new Error(`Could not find control with label ${label}.`);
      }
      await control.setValue(values[label]);
    }
  }
}
