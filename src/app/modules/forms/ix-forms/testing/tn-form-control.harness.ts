import {
  TnCheckboxHarness, TnFormFieldHarness, TnInputHarness, TnRadioHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { IxFormControlHarness } from 'app/modules/forms/ix-forms/interfaces/ix-form-control-harness.interface';

/**
 * Returned by {@link TnFormControlHarness.getValue} for a `tn-form-field` holding a control the
 * harness cannot read. Whole-form readers (`getControlValues`) leave such a control out of their
 * result rather than reporting a made-up value for it.
 */
export const unreadableControlValue = Symbol('unreadableControlValue');

/**
 * Adapter that lets a `tn-form-field`-wrapped tn-* control be driven through the same
 * {@link IxFormControlHarness} contract the ix-* control harnesses implement, so a form
 * part-way through the tn-* migration — with ix-* and tn-* controls side by side — can still
 * be filled and read by label through one indexed lookup.
 *
 * Extends {@link TnFormFieldHarness} rather than composing it: both share the same
 * `tn-form-field` host, and `locatorFor` only searches descendants — so inheriting is
 * the only way to reuse the library's own `getLabel()` instead of re-deriving it.
 *
 * **Supported controls: `tn-input`, `tn-select`, `tn-checkbox`, `tn-radio`.** A field wrapping
 * anything else (`tn-autocomplete`, `tn-chip-input`, `tn-file-input`, …) still indexes by label,
 * but {@link getValue} returns {@link unreadableControlValue} — whole-form readers like
 * `getControlValues` walk every control at once, so a throw there would take the rest of the
 * form's values down with it, while returning `''` would let an assertion pass while reading
 * nothing. The sentinel does neither: readers drop the entry, so a form-wide `toEqual` fails on
 * the missing key. {@link setValue} targets one control and does throw. Extend the branches below
 * when a form needs one of those, or drive that control through its own tn-* harness.
 */
export class TnFormControlHarness extends TnFormFieldHarness implements IxFormControlHarness {
  static override readonly hostSelector = 'tn-form-field';

  private input = this.locatorForOptional(TnInputHarness);
  private select = this.locatorForOptional(TnSelectHarness);
  private checkbox = this.locatorForOptional(TnCheckboxHarness);
  private radios = this.locatorForAll(TnRadioHarness);
  /**
   * White-box: present only while the select shows its placeholder, i.e. nothing is selected.
   * `TnSelectHarness.getDisplayText()` returns the placeholder string rather than '', and the
   * library exposes no `hasValue()`, so there is no public equivalent to compose here yet.
   */
  private selectPlaceholder = this.locatorForOptional('.tn-select-text.placeholder');

  /**
   * Empty when the field carries no label and holds no self-labeling control (e.g. the
   * label-less search fields in the pool-manager wizard). `indexControlsByLabel` keys on this,
   * and drops the empty key entirely once a second such control appears rather than letting them
   * collide — query those directly through their own tn-* harness instead.
   */
  async getLabelText(): Promise<string> {
    const label = await this.getLabel();
    if (label) {
      return label;
    }
    // A tn-checkbox carries its own label (via `[label]`) inside a bare tn-form-field
    // that has no field-level label of its own.
    const checkbox = await this.checkbox();
    if (checkbox) {
      return checkbox.getLabelText();
    }
    return '';
  }

  async getValue(): Promise<unknown> {
    const input = await this.input();
    if (input) {
      return input.getValue();
    }
    const select = await this.select();
    if (select) {
      // `getDisplayText()` falls back to the placeholder when nothing is picked; the
      // IxFormControlHarness contract these specs assert against reports that as ''.
      return await this.selectPlaceholder() ? '' : select.getDisplayText();
    }
    const checkbox = await this.checkbox();
    if (checkbox) {
      return checkbox.isChecked();
    }
    const radios = await this.radios();
    if (radios.length) {
      for (const radio of radios) {
        if (await radio.isChecked()) {
          return radio.getLabelText();
        }
      }
      // A group with nothing picked, which is a real value — not an unreadable control.
      return '';
    }
    return unreadableControlValue;
  }

  async setValue(value: unknown): Promise<void> {
    const input = await this.input();
    if (input) {
      await input.setValue(value == null ? '' : String(value));
      return;
    }
    const select = await this.select();
    if (select) {
      await select.selectOption(String(value));
      return;
    }
    const checkbox = await this.checkbox();
    if (checkbox) {
      if (value) {
        await checkbox.check();
      } else {
        await checkbox.uncheck();
      }
      return;
    }
    const radios = await this.radios();
    if (radios.length) {
      for (const radio of radios) {
        if ((await radio.getLabelText()) === String(value)) {
          await radio.check();
          return;
        }
      }
      throw new Error(`No radio option labelled "${String(value)}" in tn-form-field "${await this.getLabelText()}".`);
    }
    throw new Error(
      `tn-form-field "${await this.getLabelText()}" holds no control TnFormControlHarness can set `
      + '(supported: tn-input, tn-select, tn-checkbox, tn-radio) — drive it through its own tn-* harness.',
    );
  }

  async isDisabled(): Promise<boolean> {
    const input = await this.input();
    if (input) {
      return input.isDisabled();
    }
    const select = await this.select();
    if (select) {
      return select.isDisabled();
    }
    const checkbox = await this.checkbox();
    if (checkbox) {
      return checkbox.isDisabled();
    }
    const radios = await this.radios();
    if (radios.length) {
      const disabledStates = await Promise.all(radios.map((radio) => radio.isDisabled()));
      return disabledStates.every(Boolean);
    }
    return false;
  }
}
