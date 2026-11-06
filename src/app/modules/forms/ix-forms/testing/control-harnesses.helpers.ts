import {
  ComponentHarness, ComponentHarnessConstructor, HarnessLoader, parallel,
} from '@angular/cdk/testing';
import { IxStarRatingHarness } from 'app/modules/forms/controls/ix-star-rating/ix-star-rating.harness';
import {
  IxFormControlHarness, unreadableControl,
} from 'app/modules/forms/ix-forms/interfaces/ix-form-control-harness.interface';
import { TnFormControlHarness } from 'app/modules/forms/ix-forms/testing/tn-form-control.harness';
import { SchedulerHarness } from 'app/modules/scheduler/components/scheduler/scheduler.harness';

/**
 * ix-* controls that still render their own label row, so specs can find them without a `tn-form-field`.
 * `ix-permissions`, `ix-ip-input-with-netmask` and `ix-code-editor` are bare controls reached through
 * their field, and listing them would also close an import cycle.
 */
export const supportedFormControlSelectors = [
  SchedulerHarness,
  IxStarRatingHarness,
] as const;

export type IxFormBasicValueType = string | number | boolean | string[] | number[];

/**
 * Every control-harness type a form may hold, ix-* plus {@link TnFormControlHarness}, typed once as the
 * {@link IxFormControlHarness} surface; the cast is needed because they share an interface, not a base.
 * Order doesn't set precedence: results come in DOM order, so a composite with its own inner field
 * under the same label (`ix-scheduler`'s "Schedule") is shadowed; drive it through `SchedulerHarness`.
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
 * All four helpers below take the {@link IxFormControlHarness} surface rather than any narrower
 * union of the concrete harnesses: it is the only surface they use, and forms part-way through the
 * tn-* migration index a mix of ix-* harnesses and {@link TnFormControlHarness}, which share
 * nothing else. Callers holding a concrete harness type still pass without a cast.
 */
export async function indexControlsByLabel<T extends IxFormControlHarness>(
  controls: T[],
): Promise<Record<string, T>> {
  const result: Record<string, T> = {};
  for (const control of controls) {
    const label = await control.getLabelText();
    // Repeated labelled controls stay last-wins (a `tn-form-list` repeats labels per row). Unlabelled
    // controls are always skipped, never by threshold, so adding a label-less field elsewhere can't
    // silently change what '' resolves to; only the '' lookup fails (`fillControlValues` says why).
    // A `tn-checkbox`'s `[label]` and a radio group's `[ariaLabel]` count as labels.
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
