import {
  ComponentHarness, ComponentHarnessConstructor, HarnessLoader, parallel,
} from '@angular/cdk/testing';
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
import { IxUserPickerHarness } from 'app/modules/forms/ix-forms/components/ix-user-picker/ix-user-picker.harness';
import { IxFormControlHarness } from 'app/modules/forms/ix-forms/interfaces/ix-form-control-harness.interface';
import { TnFormControlHarness } from 'app/modules/forms/ix-forms/testing/tn-form-control.harness';
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
  IxUserPickerHarness,
] as const;

export type SupportedFormControlHarness = InstanceType<(typeof supportedFormControlSelectors)[number]>;

export type IxFormBasicValueType = string | number | boolean | string[] | number[];

/**
 * Every control-harness type a form may contain — the ix-* harnesses plus {@link
 * TnFormControlHarness} — typed once as harnesses that expose the {@link IxFormControlHarness}
 * surface. Forms part-way through the tn-* migration hold both kinds side by side, so anything
 * that wants "every control in this form" has to query the whole heterogeneous list.
 *
 * Described here rather than at each call site so the list can't drift between them. The
 * assertion is the price of a heterogeneous constructor list: `locatorForAll`/`getAllHarnesses`
 * need a single constructor type, and the harnesses share only the interface, not a base class.
 */
export const formControlHarnessTypes = [
  ...supportedFormControlSelectors,
  TnFormControlHarness,
] as unknown as ComponentHarnessConstructor<ComponentHarness & IxFormControlHarness>[];

/**
 * Every form control under `loader`, indexed by label. The loader-scoped counterpart of
 * `PoolManagerHarness.getControlHarnessesInStep()`, which has to scope to its own component host
 * instead — both share {@link formControlHarnessTypes} so they can't index different things.
 */
export async function indexFormControls(loader: HarnessLoader): Promise<Record<string, IxFormControlHarness>> {
  const controlsByType = await parallel(() => {
    return formControlHarnessTypes.map((harnessType) => loader.getAllHarnesses(harnessType));
  });

  return indexControlsByLabel(controlsByType.flat());
}

/**
 * All four helpers below take the {@link IxFormControlHarness} surface rather than the narrower
 * {@link SupportedFormControlHarness} union: it is the only surface they use, and forms part-way
 * through the tn-* migration index a mix of ix-* harnesses and {@link TnFormControlHarness}, which
 * is not a member of that union. Callers holding the narrower type still pass without a cast.
 */
export async function indexControlsByLabel<T extends IxFormControlHarness>(
  controls: T[],
): Promise<Record<string, T>> {
  const result: Record<string, T> = {};
  let unlabelledCount = 0;
  for (const control of controls) {
    const label = await control.getLabelText();
    if (!label) {
      unlabelledCount += 1;
    }
    result[label] = control;
  }

  // Repeated *labelled* controls are legitimate and long-standing here — an `ix-list` renders
  // one set of labels per row — so those stay last-wins, as they have always been. Two or more
  // unlabelled controls are different: they all index under '', and there is no label a caller
  // could pass to reach a specific one, so handing back whichever happened to be last is a
  // silently wrong answer. Drop the ambiguous entry instead of throwing: the index backs whole
  // forms, and a form is allowed to contain an unreachable control alongside perfectly
  // addressable ones. Only the '' lookup then fails, with `fillControlValues`'
  // "Could not find control with label ." — every sibling keeps working.
  if (unlabelledCount > 1) {
    delete result[''];
  }

  return result;
}

export async function getControlValues(
  controlsDict: Record<string, IxFormControlHarness>,
): Promise<Record<string, IxFormBasicValueType>> {
  const result: Record<string, IxFormBasicValueType> = {};
  // eslint-disable-next-line guard-for-in,no-restricted-syntax
  for (const label in controlsDict) {
    result[label] = await controlsDict[label].getValue() as IxFormBasicValueType;
  }

  return result;
}

export async function fillControlValues(
  controlsDict: Record<string, IxFormControlHarness>,
  values: Record<string, unknown>,
): Promise<void> {
  // eslint-disable-next-line guard-for-in,no-restricted-syntax
  for (const label in values) {
    const control = controlsDict[label];

    if (!control) {
      throw new Error(`Could not find control with label ${label}.`);
    }

    await control.setValue(values[label]);
  }
}

export async function getDisabledStates(
  controlsDict: Record<string, IxFormControlHarness>,
): Promise<Record<string, boolean>> {
  const result: Record<string, boolean> = {};
  // eslint-disable-next-line guard-for-in,no-restricted-syntax
  for (const label in controlsDict) {
    result[label] = await controlsDict[label].isDisabled();
  }

  return result;
}
