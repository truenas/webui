import { IxButtonGroupHarness } from 'app/modules/forms/ix-forms/components/ix-button-group/ix-button-group.harness';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxCheckboxListHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox-list/ix-checkbox-list.harness';
import { IxChipsHarness } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.harness';
import { IxComboboxHarness } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.harness';
import { IxDatepickerHarness } from 'app/modules/forms/ix-forms/components/ix-date-picker/ix-date-picker.harness';
import { IxExplorerHarness } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.harness';
import { IxFileInputHarness } from 'app/modules/forms/ix-forms/components/ix-file-input/ix-file-input.harness';
import { IxIconGroupHarness } from 'app/modules/forms/ix-forms/components/ix-icon-group/ix-icon-group.harness';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import {
  IxIpInputWithNetmaskHarness,
} from 'app/modules/forms/ix-forms/components/ix-ip-input-with-netmask/ix-ip-input-with-netmask.harness';
import { IxPermissionsHarness } from 'app/modules/forms/ix-forms/components/ix-permissions/ix-permissions.harness';
import { IxRadioGroupHarness } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.harness';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { IxSlideToggleHarness } from 'app/modules/forms/ix-forms/components/ix-slide-toggle/ix-slide-toggle.harness';
import { IxStarRatingHarness } from 'app/modules/forms/ix-forms/components/ix-star-rating/ix-star-rating.harness';
import { IxTextareaHarness } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.harness';
import { IxFormControlHarness } from 'app/modules/forms/ix-forms/interfaces/ix-form-control-harness.interface';
import { SchedulerHarness } from 'app/modules/scheduler/components/scheduler/scheduler.harness';

export const supportedFormControlSelectors = [
  IxInputHarness,
  IxCheckboxHarness,
  IxPermissionsHarness,
  IxSelectHarness,
  IxTextareaHarness,
  IxComboboxHarness,
  IxChipsHarness,
  IxExplorerHarness,
  IxSlideToggleHarness,
  IxRadioGroupHarness,
  IxCheckboxListHarness,
  SchedulerHarness,
  IxIpInputWithNetmaskHarness,
  IxFileInputHarness,
  IxStarRatingHarness,
  IxButtonGroupHarness,
  IxIconGroupHarness,
  IxDatepickerHarness,
] as const;

export type SupportedFormControlHarness = InstanceType<(typeof supportedFormControlSelectors)[number]>;

export type IxFormBasicValueType = string | number | boolean | string[] | number[];

export async function indexControlsByLabel(
  controls: SupportedFormControlHarness[],
): Promise<Record<string, SupportedFormControlHarness>> {
  const result: Record<string, SupportedFormControlHarness> = {};
  for (const control of controls) {
    const label = await control.getLabelText();
    result[label] = control;
  }

  return result;
}

export async function getControlValues(
  controlsDict: Record<string, SupportedFormControlHarness>,
): Promise<Record<string, IxFormBasicValueType>> {
  const result: Record<string, IxFormBasicValueType> = {};
  // eslint-disable-next-line guard-for-in,no-restricted-syntax
  for (const label in controlsDict) {
    const control = controlsDict[label] as IxFormControlHarness;

    result[label] = await control.getValue() as IxFormBasicValueType;
  }

  return result;
}

export async function fillControlValues(
  controlsDict: Record<string, SupportedFormControlHarness>,
  values: Record<string, unknown>,
): Promise<void> {
  // eslint-disable-next-line guard-for-in,no-restricted-syntax
  for (const label in values) {
    const control = controlsDict[label] as IxFormControlHarness;

    if (!control) {
      throw new Error(`Could not find control with label ${label}.`);
    }

    await control.setValue(values[label]);
  }
}

export async function getDisabledStates(
  controlsDict: Record<string, SupportedFormControlHarness>,
): Promise<Record<string, boolean>> {
  const result: Record<string, boolean> = {};
  // eslint-disable-next-line guard-for-in,no-restricted-syntax
  for (const label in controlsDict) {
    const control = controlsDict[label] as IxFormControlHarness;

    result[label] = await control.isDisabled();
  }

  return result;
}
