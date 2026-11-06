import { HarnessPredicate } from '@angular/cdk/testing';
import {
  FormFieldHarnessFilters,
  TnAutocompleteHarness,
  TnCheckboxGroupHarness,
  TnCheckboxHarness,
  TnFormFieldHarness,
  TnInputHarness,
  TnRadioHarness,
  TnSelectHarness,
  TnFilePickerHarness,
} from '@truenas/ui-components';
import { IxCodeEditorHarness } from 'app/modules/forms/controls/ix-code-editor/ix-code-editor.harness';
import {
  IxIpInputWithNetmaskHarness,
} from 'app/modules/forms/controls/ix-ip-input-with-netmask/ix-ip-input-with-netmask.harness';
import { IxPermissionsHarness } from 'app/modules/forms/controls/ix-permissions/ix-permissions.harness';
import { ixControlLabelTag } from 'app/modules/forms/ix-forms/directives/registered-control.directive';
import {
  IxFormControlHarness, unreadableControl,
} from 'app/modules/forms/ix-forms/interfaces/ix-form-control-harness.interface';
import {
  IxGroupChipsHarness,
  IxGroupComboboxHarness,
  IxUserChipsHarness,
  IxUserComboboxHarness,
} from 'app/modules/forms/ix-forms/testing/user-group-picker.harnesses';

/**
 * Drives a `tn-form-field`-wrapped control through the {@link IxFormControlHarness} contract, so mixed
 * ix-* and tn-* forms fill and read by label through one lookup. Extends {@link TnFormFieldHarness} to reuse
 * its `getLabel()`. Supports `tn-input`, `tn-select`, `tn-autocomplete`, `tn-checkbox(-group)`,
 * `tn-radio` and the user/group pickers; projected ix-* composites are matched first (see {@link delegate}).
 * Anything else reads as {@link unreadableControl}, so form-wide readers drop it and `toEqual` fails.
 */
export class TnFormControlHarness extends TnFormFieldHarness implements IxFormControlHarness {
  static override readonly hostSelector = 'tn-form-field';

  /**
   * `ix-ip-input-with-netmask` renders a bare `<input>` for the address and a `tn-select` for the
   * netmask, so {@link select} matches that netmask picker and {@link getValue} would report '12'
   * where the field's value is '172.17.0.0/12'. Delegating to the control's own harness reads the
   * whole `address/netmask` instead. See {@link delegate} for the full set.
   */
  private ipInputWithNetmask = this.locatorForOptional(IxIpInputWithNetmaskHarness);
  /**
   * The other two webui-specific controls a field may wrap. Like the netmask input above they
   * render tn-* internals of their own — `ix-permissions` a grid of `tn-checkbox`es, whose first
   * one the checkbox locator would otherwise report as the field's value — so each is driven
   * through its own harness rather than through an internal.
   */
  private permissions = this.locatorForOptional(IxPermissionsHarness);
  private codeEditor = this.locatorForOptional(IxCodeEditorHarness);
  /**
   * A `tn-file-picker`'s inner `<input>` is not matched by the tn-input locator, and its value can
   * be a list — driven through its own harness, adapted by {@link filePickerDelegate}.
   */
  private filePicker = this.locatorForOptional(TnFilePickerHarness);
  /**
   * Any other projected ix-* control, found by the `ix-label` marker `RegisteredControlDirective` stamps
   * on registration. Probed before the tn-* locators and answered with {@link unreadableControl},
   * because a composite's tn-* internals would read back a plausible wrong value. Only named controls
   * get the marker; one that must match regardless needs its own locator, like {@link ipInputWithNetmask}.
   */
  private projectedIxControl = this.locatorForOptional(`[${ixControlLabelTag}]`);
  private input = this.locatorForOptional(TnInputHarness);
  /**
   * The `tn-input`'s own element. White-box, and only used to clear it: see {@link setValue}.
   */
  private inputElement = this.locatorForOptional('tn-input input.tn-input, tn-input textarea.tn-input');
  private select = this.locatorForOptional(TnSelectHarness);
  /**
   * Probed BEFORE {@link checkbox} everywhere below: a group renders `tn-checkbox`es of its own,
   * so the single-checkbox locator matches its first option and would report one option's boolean
   * where the field's value is the whole checked array.
   */
  private checkboxGroup = this.locatorForOptional(TnCheckboxGroupHarness);
  private checkbox = this.locatorForOptional(TnCheckboxHarness);
  private radios = this.locatorForAll(TnRadioHarness);
  /**
   * The user/group fields. They are `ControlValueAccessor`s in their own right —
   * the control name sits on the wrapper, not on the `tn-autocomplete` /
   * `tn-chip-input` inside — so they need their own branches rather than being
   * reachable through the plain autocomplete/chip harnesses.
   */
  private userAutocomplete = this.locatorForOptional(IxUserComboboxHarness);
  private groupAutocomplete = this.locatorForOptional(IxGroupComboboxHarness);
  private userChips = this.locatorForOptional(IxUserChipsHarness);
  private groupChips = this.locatorForOptional(IxGroupChipsHarness);
  /**
   * A bare `tn-autocomplete` — the disk picker and the dynamic form's enum fields.
   *
   * Probed AFTER the user/group pickers above: those render a `tn-autocomplete` of their own, and
   * this locator would otherwise reach inside one and drive it directly, bypassing the wrapper
   * that is the field's actual control.
   */
  private autocomplete = this.locatorForOptional(TnAutocompleteHarness);
  /**
   * White-box: present only while the select shows its placeholder, i.e. nothing is selected.
   * `TnSelectHarness.getDisplayText()` returns the placeholder string rather than '', and the
   * library exposes no `hasValue()`, so there is no public equivalent to compose here yet.
   */
  private selectPlaceholder = this.locatorForOptional('.tn-select-text.placeholder');
  /** Only `tn-radio-group` renders this, and only with an explicit `[ariaLabel]`. */
  private namedRadioGroup = this.locatorForOptional('[role="radiogroup"][aria-label]');
  /** Only `tn-checkbox-group` renders this, and only with an explicit `[ariaLabel]`. */
  private namedCheckboxGroup = this.locatorForOptional('[role="group"][aria-label]');

  /**
   * Re-declared because `TnFormFieldHarness.with()` names its own class in the predicate. Matches on
   * {@link getLabelText}, so self-naming checkboxes and radio groups resolve as `indexControlsByLabel`
   * files them. **Keep the options in sync with `FormFieldHarnessFilters`**: a new library filter would
   * type-check here but never narrow. Re-check when bumping `@truenas/ui-components`.
   */
  static override with(options: FormFieldHarnessFilters = {}): HarnessPredicate<TnFormControlHarness> {
    return new HarnessPredicate(TnFormControlHarness, options)
      .addOption('label', options.label, (harness, label) => {
        return HarnessPredicate.stringMatches(harness.getLabelText(), label);
      })
      .addOption('testId', options.testId, async (harness, testId) => {
        return (await harness.getTestId()) === testId;
      });
  }

  /**
   * The projected ix-* control this field wraps, when it is one this adapter can drive. Checked
   * before every tn-* locator, since those would reach inside it.
   */
  private async delegate(): Promise<IxFormControlHarness | null> {
    return (await this.ipInputWithNetmask())
      ?? (await this.permissions())
      ?? (await this.codeEditor())
      ?? (await this.filePickerDelegate());
  }

  /**
   * The picker shows a list as "a, b"; specs and callers read and write the comma-separated
   * "a,b" the legacy explorer harness reported. The field, not the picker, owns the label.
   */
  private async filePickerDelegate(): Promise<IxFormControlHarness | null> {
    const picker = await this.filePicker();
    if (!picker) {
      return null;
    }
    return {
      getLabelText: () => Promise.resolve(''),
      getValue: async () => (await picker.getValue()).replace(/,\s+/g, ','),
      setValue: (value: unknown) => picker.setValue(value == null ? '' : String(value)),
      isDisabled: () => picker.isDisabled(),
    };
  }


  /**
   * Empty only when the field carries no label and holds nothing that names itself — neither a
   * `tn-checkbox`'s own `[label]` nor a radio group's `[ariaLabel]`. `indexControlsByLabel` leaves
   * such a control out of the index entirely (no label a caller could pass would reach it); query
   * it through its own tn-* harness instead.
   */
  async getLabelText(): Promise<string> {
    const label = await this.getLabel();
    if (label) {
      return label;
    }
    // A projected ix-* control renders no label of its own any more — the field names it — so a
    // field holding one and carrying no label of its own is genuinely nameless. Answer that here
    // rather than falling through to the tn-* branches below, where a composite's first
    // `tn-checkbox` would otherwise name the whole field.
    if (await this.projectedIxControl()) {
      return '';
    }
    // Same as the radio group below, and checked before the lone-checkbox branch: a group's
    // first option would otherwise name the whole field.
    const checkboxGroup = await this.namedCheckboxGroup();
    if (checkboxGroup) {
      return (await checkboxGroup.getAttribute('aria-label')) ?? '';
    }
    // A tn-checkbox carries its own label (via `[label]`) inside a bare tn-form-field
    // that has no field-level label of its own.
    const checkbox = await this.checkbox();
    if (checkbox) {
      return checkbox.getLabelText();
    }
    // Same idea for a label-less `tn-radio-group`: its `[ariaLabel]` is the group's accessible
    // name, so it is a real name to index under rather than a nameless control. (When the field
    // does carry a label the group takes its name from it via `aria-labelledby` and writes no
    // `aria-label` at all, so this branch never competes with the field's own label.)
    const radioGroup = await this.namedRadioGroup();
    if (radioGroup) {
      return (await radioGroup.getAttribute('aria-label')) ?? '';
    }
    return '';
  }

  async getValue(): Promise<unknown> {
    const delegate = await this.delegate();
    if (delegate) {
      return delegate.getValue();
    }
    if (await this.projectedIxControl()) {
      return unreadableControl;
    }
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
    // The labels of the checked options, which is what the DOM carries — the values themselves
    // live in the bound control.
    const checkboxGroup = await this.checkboxGroup();
    if (checkboxGroup) {
      return checkboxGroup.getValue();
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
    const principal = await this.principalAutocomplete();
    if (principal) {
      return principal.getInputValue();
    }
    const principalChips = await this.principalChips();
    if (principalChips) {
      return principalChips.getChips();
    }
    const autocomplete = await this.autocomplete();
    if (autocomplete) {
      // The label of the picked option, which is what the input shows — the value itself lives in
      // the bound control, same as the select branch above.
      return autocomplete.getInputValue();
    }
    return unreadableControl;
  }

  /** The single-valued user/group field in this form field, if it holds one. */
  private async principalAutocomplete(): Promise<IxUserComboboxHarness | IxGroupComboboxHarness | null> {
    return (await this.userAutocomplete()) ?? (await this.groupAutocomplete());
  }

  /** The list-valued user/group field in this form field, if it holds one. */
  private async principalChips(): Promise<IxUserChipsHarness | IxGroupChipsHarness | null> {
    return (await this.userChips()) ?? (await this.groupChips());
  }

  async setValue(value: unknown): Promise<void> {
    const delegate = await this.delegate();
    if (delegate) {
      await delegate.setValue(value == null ? '' : String(value));
      return;
    }
    if (await this.projectedIxControl()) {
      throw new Error(
        `tn-form-field "${await this.getLabelText()}" wraps an ix-* control TnFormControlHarness `
        + 'cannot drive — use that control\'s own harness.',
      );
    }
    const input = await this.input();
    if (input) {
      const text = value == null ? '' : String(value);
      if (text === '') {
        // Clearing IS setting an empty value, and `TnInputHarness.setValue('')` cannot express
        // it: it clears the element and then calls `sendKeys()` with no keys, which the CDK
        // rejects outright ('No keys have been specified'). `clear()` alone dispatches the same
        // `input` event, so the control still sees the empty value.
        const element = await this.inputElement();
        if (!element) {
          // `input()` matched, so there IS a control here — this only misses if the library
          // stops rendering it as an `input`/`textarea` with `.tn-input`. Failing loudly keeps
          // that drift at the harness instead of surfacing as a stale value in a caller's assert.
          throw new Error(
            `tn-form-field "${await this.getLabelText()}" holds a tn-input whose inner element `
            + 'could not be reached — TnFormControlHarness cannot clear it.',
          );
        }
        await element.clear();
        return;
      }
      await input.setValue(text);
      return;
    }
    const select = await this.select();
    if (select) {
      await select.selectOption(String(value));
      return;
    }
    // Replaces the whole checked set, so `setValue([])` clears the group rather than no-opping.
    const checkboxGroup = await this.checkboxGroup();
    if (checkboxGroup) {
      await checkboxGroup.setValue((value ?? []) as string[]);
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
    const principal = await this.principalAutocomplete();
    if (principal) {
      // Typed and committed on blur rather than picked from the dropdown: a spec
      // filling a form by label is naming the value it wants, not asserting that
      // the directory happens to offer it.
      await principal.setInputValue(value == null ? '' : String(value));
      await principal.blur();
      return;
    }
    const principalChips = await this.principalChips();
    if (principalChips) {
      const names = Array.isArray(value) ? value : [value];
      for (const name of names) {
        await principalChips.addChip(String(name));
      }
      return;
    }
    const autocomplete = await this.autocomplete();
    if (autocomplete) {
      // Typed first, then picked from the dropdown. The input holds the *current* selection's
      // label, and the panel filters by whatever the input holds — so selecting straight away
      // would only ever find options matching the value already there. Typing the wanted label
      // narrows the panel to it from any prior state; the click is what commits the value, since
      // an autocomplete indexed here is `[requireSelection]`-style and a typed string alone
      // commits nothing.
      const text = String(value);
      await autocomplete.setInputValue(text);
      await autocomplete.selectOption(text);
      return;
    }
    throw new Error(
      `tn-form-field "${await this.getLabelText()}" holds no control TnFormControlHarness can set `
      + '(supported: tn-input, tn-select, tn-autocomplete, tn-checkbox, tn-checkbox-group, '
      + 'tn-radio, ix-user-*/ix-group-*) — drive it through its own tn-* harness.',
    );
  }

  /**
   * The options a `tn-select` in this field offers, read with the panel opened and closed again.
   * Deliberately outside the {@link IxFormControlHarness} contract, which knows only about the
   * value a control *has* — it lives here so a spec asserting which options a select offers can
   * still address it by label, instead of hanging a CSS anchor on the select for the test's sake.
   */
  async getSelectOptions(): Promise<string[]> {
    if (await this.delegate() || await this.projectedIxControl()) {
      throw new Error(
        `tn-form-field "${await this.getLabelText()}" wraps an ix-* control, whose internal `
        + 'tn-select is not the field\'s own — read its options through that control\'s harness.',
      );
    }
    const select = await this.select();
    if (!select) {
      throw new Error(`tn-form-field "${await this.getLabelText()}" holds no tn-select to read options from.`);
    }
    await select.open();
    const options = await select.getOptions();
    await select.close();
    return options;
  }

  /**
   * A radio group reads as disabled only when every option is, matching a group disabled as a unit,
   * so a partially disabled group reads as enabled; check options with `TnRadioHarness.isDisabled()`.
   * Returns {@link unreadableControl} for an unsupported control, as {@link getValue} explains.
   */
  async isDisabled(): Promise<boolean | typeof unreadableControl> {
    const delegate = await this.delegate();
    if (delegate) {
      return delegate.isDisabled();
    }
    if (await this.projectedIxControl()) {
      return unreadableControl;
    }
    const input = await this.input();
    if (input) {
      return input.isDisabled();
    }
    const select = await this.select();
    if (select) {
      return select.isDisabled();
    }
    const checkboxGroup = await this.checkboxGroup();
    if (checkboxGroup) {
      return checkboxGroup.isDisabled();
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
    const autocomplete = await this.autocomplete();
    if (autocomplete) {
      return autocomplete.isDisabled();
    }
    return unreadableControl;
  }
}
