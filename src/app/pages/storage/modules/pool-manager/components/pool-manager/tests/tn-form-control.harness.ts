import { ComponentHarness } from '@angular/cdk/testing';
import {
  TnCheckboxHarness, TnInputHarness, TnRadioHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { IxFormControlHarness } from 'app/modules/forms/ix-forms/interfaces/ix-form-control-harness.interface';

/**
 * Adapter that lets a `tn-form-field`-wrapped tn-* control be driven through the
 * same {@link IxFormControlHarness} contract the pool-manager tests use for
 * ix-* controls, so a wizard step mixing tn-* and ix-* controls can still be
 * filled/read by label via {@link PoolManagerHarness}.
 */
export class TnFormControlHarness extends ComponentHarness implements IxFormControlHarness {
  static readonly hostSelector = 'tn-form-field';

  private label = this.locatorForOptional('.tn-form-field-label');
  private input = this.locatorForOptional(TnInputHarness);
  private select = this.locatorForOptional(TnSelectHarness);
  private checkbox = this.locatorForOptional(TnCheckboxHarness);
  private radios = this.locatorForAll(TnRadioHarness);
  /** Present only while the select shows its placeholder, i.e. nothing is selected. */
  private selectPlaceholder = this.locatorForOptional('.tn-select-text.placeholder');

  async getLabelText(): Promise<string> {
    const label = await this.label();
    if (label) {
      // Strip the trailing required asterisk, matching TnFormFieldHarness.getLabel().
      return (await label.text()).replace(/\s*\*\s*$/, '').trim();
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
