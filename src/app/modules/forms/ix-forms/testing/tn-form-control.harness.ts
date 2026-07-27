import {
  TnCheckboxHarness, TnFormFieldHarness, TnInputHarness, TnRadioHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { IxFormControlHarness } from 'app/modules/forms/ix-forms/interfaces/ix-form-control-harness.interface';

/**
 * Adapter that lets a `tn-form-field`-wrapped tn-* control be driven through the same
 * {@link IxFormControlHarness} contract the ix-* control harnesses implement, so a form
 * part-way through the tn-* migration — with ix-* and tn-* controls side by side — can still
 * be filled and read by label through one indexed lookup.
 *
 * Extends {@link TnFormFieldHarness} rather than composing it: both share the same
 * `tn-form-field` host, and `locatorFor` only searches descendants — so inheriting is
 * the only way to reuse the library's own `getLabel()` instead of re-deriving it.
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
   * label-less search fields in the pool-manager wizard). {@link indexControlsByLabel} keys on
   * this, and rejects a second empty key rather than letting two such controls collide — query
   * those directly through their own tn-* harness instead.
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
    for (const radio of radios) {
      if (await radio.isChecked()) {
        return radio.getLabelText();
      }
    }
    return '';
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
    for (const radio of radios) {
      if ((await radio.getLabelText()) === String(value)) {
        await radio.check();
        return;
      }
    }
    throw new Error(`Could not set value "${String(value)}" on tn-form-field control.`);
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
