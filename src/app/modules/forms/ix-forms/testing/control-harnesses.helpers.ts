import {
  ComponentHarness, ComponentHarnessConstructor, HarnessLoader, parallel,
} from '@angular/cdk/testing';
import { IxButtonGroupHarness } from 'app/modules/forms/ix-forms/components/ix-button-group/ix-button-group.harness';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
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
import {
  IxFormControlHarness, unreadableControl,
} from 'app/modules/forms/ix-forms/interfaces/ix-form-control-harness.interface';
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
  for (const control of controls) {
    const label = await control.getLabelText();
    // Repeated *labelled* controls are legitimate and long-standing here — an `ix-list` renders
    // one set of labels per row — so those stay last-wins, as they have always been. An unlabelled
    // control is different: '' is not a name any caller would ask for, and a second one would
    // collide with the first under it. Skip them unconditionally rather than only once a second
    // appears — a threshold would make whether '' resolves depend on unrelated markup elsewhere
    // in the form, so adding a label-less field could silently drop an existing `''` assertion's
    // coverage instead of breaking it. Skipping rather than throwing keeps the index usable: a
    // form is allowed to hold an unreachable control alongside addressable ones, and only the ''
    // lookup fails — `fillControlValues` explains why. Note that "unlabelled" is narrow: a
    // `tn-checkbox`'s own `[label]` and a radio group's `[ariaLabel]` both count as labels
    // (see `TnFormControlHarness.getLabelText`), so only a genuinely nameless control lands here.
    if (!label) {
      continue;
    }
    result[label] = control;
  }

  return result;
}

export async function getControlValues(
  controlsDict: Record<string, IxFormControlHarness>,
): Promise<Record<string, IxFormBasicValueType>> {
  const result: Record<string, IxFormBasicValueType> = {};
  // eslint-disable-next-line guard-for-in,no-restricted-syntax
  for (const label in controlsDict) {
    const value = await controlsDict[label].getValue();
    // Leave a control the harness can't read out of the result entirely, rather than reporting a
    // stand-in value for it — a form-wide `toEqual` then fails on the missing key instead of
    // passing against a `''` that was never read from anything.
    if (value !== unreadableControl) {
      result[label] = value as IxFormBasicValueType;
    }
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
      // An empty label is never a typo, so say what it actually means: a control with no label of
      // any kind is left out of the index entirely, because no label could reach it.
      throw new Error(
        label
          ? `Could not find control with label ${label}.`
          : 'No control is indexed under an empty label — unlabelled controls are left out of the '
            + 'index, because no label would pick between them. Reach those through their own '
            + 'ix-*/tn-* harness instead.',
      );
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
    const isDisabled = await controlsDict[label].isDisabled();
    // Same treatment `getControlValues` gives an unreadable value, and for the same reason: a
    // control whose disabled state the harness cannot read is left out entirely rather than
    // reported as `false`, which would let a form-wide `toEqual` pass while the control is
    // genuinely disabled. The missing key fails the assertion instead.
    if (isDisabled !== unreadableControl) {
      result[label] = isDisabled;
    }
  }

  return result;
}
