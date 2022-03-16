import { ComponentHarness, parallel } from '@angular/cdk/testing';
import { IxCheckboxHarness } from 'app/modules/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxChipsHarness } from 'app/modules/ix-forms/components/ix-chips/ix-chips.harness';
import { IxComboboxHarness } from 'app/modules/ix-forms/components/ix-combobox/ix-combobox.harness';
import { IxExplorerHarness } from 'app/modules/ix-forms/components/ix-explorer/ix-explorer.harness';
import { IxInputHarness } from 'app/modules/ix-forms/components/ix-input/ix-input.harness';
import {
  IxIpInputWithNetmaskHarness,
} from 'app/modules/ix-forms/components/ix-ip-input-with-netmask/ix-ip-input-with-netmask.harness';
import { IxRadioGroupHarness } from 'app/modules/ix-forms/components/ix-radio-group/ix-radio-group.harness';
import { IxSelectHarness } from 'app/modules/ix-forms/components/ix-select/ix-select.harness';
import { IxSlideToggleHarness } from 'app/modules/ix-forms/components/ix-slide-toggle/ix-slide-toggle.harness';
import { IxTextareaHarness } from 'app/modules/ix-forms/components/ix-textarea/ix-textarea.harness';
import { IxFormControlHarness } from 'app/modules/ix-forms/interfaces/ix-form-control-harness.interface';
import { JiraOauthHarness } from 'app/modules/ix-forms/testing/jira-oauth.harness';
import { SchedulerHarness } from 'app/modules/scheduler/components/scheduler/scheduler.harness';

const childSelectors = [
  IxInputHarness,
  IxCheckboxHarness,
  IxSelectHarness,
  IxTextareaHarness,
  IxComboboxHarness,
  IxChipsHarness,
  IxExplorerHarness,
  IxSlideToggleHarness,
  IxRadioGroupHarness,
  JiraOauthHarness,
  SchedulerHarness,
  IxIpInputWithNetmaskHarness,
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
    for (const label in values) {
      const control = controls[label] as IxFormControlHarness;

      if (!control) {
        throw new Error(`Could not find control with label ${label}.`);
      }

      await control.setValue(values[label]);
    }
  }
}
