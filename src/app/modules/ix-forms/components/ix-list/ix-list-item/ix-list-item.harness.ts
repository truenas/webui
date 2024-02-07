import { ComponentHarness } from '@angular/cdk/testing';
import { IxFormControlHarness } from 'app/modules/ix-forms/interfaces/ix-form-control-harness.interface';
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

  async getControlHarnessesDict(): Promise<Record<string, SupportedFormControlHarness>> {
    const controls = await this.getControlHarnesses();
    return indexControlsByLabel(controls);
  }

  async getFormValues(): Promise<Record<string, IxFormBasicValueType>> {
    const controlsDict = await this.getControlHarnessesDict();
    return getControlValues(controlsDict);
  }

  async fillForm(values: Record<string, unknown>): Promise<void> {
    const controls = await this.getControlHarnessesDict();
    return fillControlValues(controls, values);
  }

  /**
   * Sets the values section by section so that form can update as the values change.
   * E.g., if some values only show up after a checkbox has been checked, this would ensure that
   * the checkbox value is set first before trying to set the value for the attribute that's not
   * visible yet. Giving form time to update its state so the value can be set.
   * @param values An array of values in pairs that ensures form update as value changes one by one
   */
  async fillFormSections(sectionsValues: Record<string, unknown>[]): Promise<void> {
    for (const sectionValues of sectionsValues) {
      const controlsDict = await this.getControlHarnessesDict();
      const labels = Object.keys(sectionValues);
      for (const label of labels) {
        const control = controlsDict[label] as IxFormControlHarness;
        if (!control) {
          throw new Error(`Could not find control with label ${label}.`);
        }
        await control.setValue(sectionValues[label]);
      }
    }
  }
}
