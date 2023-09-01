import {
  ComponentHarness,
  parallel,
} from '@angular/cdk/testing';
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
  async getControlHarnessesDict(): Promise<{ [label: string]: SupportedFormControlHarness }> {
    const controls = await this.getControlHarnesses();
    return indexControlsByLabel(controls);
  }

  async getControl(label: string): Promise<SupportedFormControlHarness> {
    const controlsDict = await this.getControlHarnessesDict();
    return controlsDict[label];
  }

  async getValues(): Promise<{ [label: string]: IxFormBasicValueType }> {
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
  async fillForm(values: { [label: string]: unknown }): Promise<void> {
    const controls = await this.getControlHarnessesDict();
    return fillControlValues(controls, values);
  }

  async getDisabledState(): Promise<{ [label: string]: boolean }> {
    const controls = await this.getControlHarnessesDict();
    return getDisabledStates(controls);
  }
}
