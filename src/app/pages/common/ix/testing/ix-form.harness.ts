import { ComponentHarness } from '@angular/cdk/testing';
import { IxCheckboxHarness } from 'app/pages/common/ix/components/ix-checkbox/ix-checkbox.harness';
import { IxComboboxHarness } from 'app/pages/common/ix/components/ix-combobox/ix-combobox.harness';
import { IxInputHarness } from 'app/pages/common/ix/components/ix-input/ix-input.harness';
import { IxSelectHarness } from 'app/pages/common/ix/components/ix-select/ix-select.harness';
import { IxFormControlHarness } from 'app/pages/common/ix/interfaces/ix-form-control-harness.interface';

const childSelectors = [
  IxInputHarness,
  IxCheckboxHarness,
  IxSelectHarness,
  IxComboboxHarness,
] as const;

type SupportedFormControlHarness = InstanceType<(typeof childSelectors)[number]>;
type IxFormBasicValueType = string | number | boolean | string[] | number[];
/**
 * This class provides sugar syntax to make it easier to work with forms.
 * When possibilities of this class are not enough, use individual harnesses such as IxInputHarness, etc.
 */
export class IxFormHarness extends ComponentHarness {
  static hostSelector = 'form';

  getControlHarnesses = this.locatorForAll(...childSelectors);

  /**
   * Returns a dictionary of form control harnesses indexed by their labels.
   */
  async getControlHarnessesDict(): Promise<{ [label: string]: SupportedFormControlHarness }> {
    const controls = await this.getControlHarnesses();

    const result: { [label: string]: SupportedFormControlHarness } = {};
    const getLabels = controls.map((control) => control.getLabelText().then((label) => {
      result[label] = control as SupportedFormControlHarness;
    }));

    await Promise.all(getLabels);

    return result;
  }

  async getValues(): Promise<{ [label: string]: IxFormBasicValueType }> {
    const controlsDict = await this.getControlHarnessesDict();

    const result: { [label: string]: IxFormBasicValueType } = {};
    for (const label in controlsDict) {
      const control = controlsDict[label] as IxFormControlHarness;

      result[label] = await control.getValue() as IxFormBasicValueType;
    }

    return result;
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
  async fillForm(values: { [label: string]: unknown }): Promise<void> {
    const controls = await this.getControlHarnessesDict();
    for (const label in values) {
      const control = controls[label] as IxFormControlHarness;

      if (!control) {
        throw new Error(`Could not find control with label ${label}.`);
      }

      await control.setValue(values[label]);
    }
  }
}
