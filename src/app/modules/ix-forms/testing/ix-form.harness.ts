import {
  ComponentHarness,
  parallel,
} from '@angular/cdk/testing';
import { IxFormControlHarness } from 'app/modules/ix-forms/interfaces/ix-form-control-harness.interface';
import {
  supportedFormControlSelectors,
  SupportedFormControlHarness,
  indexControlsByLabel, getControlValues, IxFormBasicValueType, fillControlValues, getDisabledStates,
} from 'app/modules/ix-forms/testing/control-harnesses.helpers';

/**
 * This class provides sugar syntax to make it easier to work with forms.
 * When possibilities of this class are not enough, use individual harnesses such as IxInputHarness, etc.
 */
export class IxFormHarness extends ComponentHarness {
  static hostSelector = 'form';

  getControlHarnesses = this.locatorForAll(...supportedFormControlSelectors);

  /**
   * Returns a dictionary of form control harnesses indexed by their labels.
   */
  async getControlHarnessesDict(): Promise<Record<string, SupportedFormControlHarness>> {
    const controls = await this.getControlHarnesses();
    return indexControlsByLabel(controls);
  }

  async getControl(label: string): Promise<SupportedFormControlHarness> {
    const controlsDict = await this.getControlHarnessesDict();
    return controlsDict[label];
  }

  async getValues(): Promise<Record<string, IxFormBasicValueType>> {
    const controlsDict = await this.getControlHarnessesDict();
    return getControlValues(controlsDict);
  }

  async getLabels(): Promise<string[]> {
    const controls = await this.getControlHarnesses();

    return parallel(() => controls.map((control) => control.getLabelText()));
  }

  /**
   * Sequentially fill in the form.
   * Argument is a dictionary, where key is label:
   * ```
   * {
   *   'First Name': 'John',
   *   'Last Name': 'Smith',
   *   'Receive email updates': true,
   * }
   * ```
   */
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

  async getDisabledState(): Promise<Record<string, boolean>> {
    const controls = await this.getControlHarnessesDict();
    return getDisabledStates(controls);
  }
}
