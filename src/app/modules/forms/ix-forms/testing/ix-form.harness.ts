import {
  ComponentHarness,
  parallel,
} from '@angular/cdk/testing';
import { IxFormControlHarness } from 'app/modules/forms/ix-forms/interfaces/ix-form-control-harness.interface';
import {
  formControlHarnessTypes,
  indexControlsByLabel, getControlValues, IxFormBasicValueType, getDisabledStates,
} from 'app/modules/forms/ix-forms/testing/control-harnesses.helpers';

/**
 * This class provides sugar syntax to make it easier to work with forms.
 * When possibilities of this class are not enough, use individual harnesses such as TnInputHarness, etc.
 */
export class IxFormHarness extends ComponentHarness {
  static readonly hostSelector = 'form';

  /**
   * Every control under this `<form>`: the remaining ix-* composites AND the `tn-form-field`s
   * around tn-* controls, through {@link formControlHarnessTypes}. Indexing only the ix-* list
   * would leave a fully migrated form empty, which is what most forms now are.
   */
  getControlHarnesses = this.locatorForAll(...formControlHarnessTypes);

  /**
   * Returns a dictionary of form control harnesses indexed by their labels.
   */
  async getControlHarnessesDict(): Promise<Record<string, IxFormControlHarness>> {
    const controls = await this.getControlHarnesses();
    return indexControlsByLabel(controls);
  }

  async getControl(label: string): Promise<IxFormControlHarness> {
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
      const control = controlsDict[label];
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
