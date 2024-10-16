import {
  BaseHarnessFilters, ComponentHarness, HarnessPredicate, parallel,
} from '@angular/cdk/testing';
import { IxFormControlHarness } from 'app/modules/forms/ix-forms/interfaces/ix-form-control-harness.interface';
import {
  supportedFormControlSelectors,
  SupportedFormControlHarness,
  indexControlsByLabel, getControlValues, IxFormBasicValueType, getDisabledStates,
} from 'app/modules/forms/ix-forms/testing/control-harnesses.helpers';

export interface IxFieldsetHarnessFilters extends BaseHarnessFilters {
  title?: string;
}

export class IxFieldsetHarness extends ComponentHarness {
  static readonly hostSelector = 'ix-fieldset';

  static with(options: IxFieldsetHarnessFilters): HarnessPredicate<IxFieldsetHarness> {
    return new HarnessPredicate(IxFieldsetHarness, options)
      .addOption('title', options.title, (harness, title) => HarnessPredicate.stringMatches(harness.getTitleText(), title));
  }

  getControlHarnesses = this.locatorForAll(...supportedFormControlSelectors);
  getTitle = this.locatorForOptional('.title');

  async getTitleText(): Promise<string> {
    const title = await this.getTitle();
    if (!title) {
      return '';
    }
    return title.text();
  }

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

  async getDisabledState(): Promise<Record<string, boolean>> {
    const controls = await this.getControlHarnessesDict();
    return getDisabledStates(controls);
  }
}
