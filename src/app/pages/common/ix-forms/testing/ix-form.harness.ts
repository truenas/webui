import { ComponentHarness } from '@angular/cdk/testing';
import { IxCheckboxHarness } from 'app/pages/common/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxInputHarness } from 'app/pages/common/ix-forms/components/ix-input/ix-input.harness';
import { IxTextareaHarness } from 'app/pages/common/ix-forms/components/ix-textarea/ix-textarea.harness';
import { IxFormControlHarness } from 'app/pages/common/ix-forms/interfaces/ix-form-control-harness.interface';

const childSelectors = [
  IxInputHarness,
  IxCheckboxHarness,
  IxTextareaHarness,
] as const;

type SupportedFormControlHarness = InstanceType<(typeof childSelectors)[number]>;

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

  async getValues(): Promise<{ [label: string]: string | number | boolean }> {
    const controlsDict = await this.getControlHarnessesDict();

    const result: { [label: string]: string | number | boolean } = {};
    for (const label in controlsDict) {
      const control = controlsDict[label] as IxFormControlHarness;

      result[label] = await control.getValue() as string | number | boolean;
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
