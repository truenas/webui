import { HarnessPredicate } from '@angular/cdk/testing';
import {
  FormFieldHarnessFilters,
  TnCheckboxGroupHarness,
  TnCheckboxHarness, TnFormFieldHarness, TnInputHarness, TnRadioHarness, TnSelectHarness,
} from '@truenas/ui-components';
import {
  IxIpInputWithNetmaskHarness,
} from 'app/modules/forms/ix-forms/components/ix-ip-input-with-netmask/ix-ip-input-with-netmask.harness';
import { ixControlLabelTag } from 'app/modules/forms/ix-forms/directives/registered-control.directive';
import {
  IxFormControlHarness, unreadableControl,
} from 'app/modules/forms/ix-forms/interfaces/ix-form-control-harness.interface';

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
 * **Supported controls: `tn-input`, `tn-select`, `tn-checkbox`, `tn-checkbox-group`, `tn-radio`.**
 *
 * A field may also wrap a composite ix-* control rather than a bare tn-* one (the ix-* control
 * hands its label row to the field so it lines up with the `tn-input`s beside it). Those are
 * matched FIRST — see {@link projectedIxControl} — because the tn-* locators below would otherwise
 * reach *inside* one and drive an internal that is not the field's control at all.
 *
 * A field wrapping anything else (`tn-autocomplete`, `tn-chip-input`, `tn-file-input`, …) still
 * indexes by label,
 * but {@link getValue} and {@link isDisabled} return {@link unreadableControl} — whole-form
 * readers like `getControlValues`/`getDisabledStates` walk every control at once, so a throw there
 * would take the rest of the form down with it, while returning `''`/`false` would let an
 * assertion pass while reading nothing. The sentinel does neither: readers drop the entry, so a
 * form-wide `toEqual` fails on the missing key. {@link setValue} targets one control and does
 * throw. Extend the branches below when a form needs one of those, or drive that control through
 * its own tn-* harness.
 */
export class TnFormControlHarness extends TnFormFieldHarness implements IxFormControlHarness {
  static override readonly hostSelector = 'tn-form-field';

  /**
   * `ix-ip-input-with-netmask` renders a bare `<input>` for the address and a `tn-select` for the
   * netmask, so {@link select} matches that netmask picker and {@link getValue} would report '12'
   * where the field's value is '172.17.0.0/12'. Delegating to the control's own harness reads the
   * whole `address/netmask` instead — the only projected ix-* control this adapter can drive.
   */
  private ipInputWithNetmask = this.locatorForOptional(IxIpInputWithNetmaskHarness);
  /**
   * Any *other* projected ix-* control. `RegisteredControlDirective` — the host directive every
   * ix-* control carries — stamps `ix-label` on its own element once the control registers, so
   * this recognises them all without naming twenty-odd selectors by hand and going stale.
   *
   * Probed before every tn-* locator below, and answered with {@link unreadableControl}: a
   * composite renders tn-* internals of its own (a `tn-select` for a unit, a `tn-checkbox` per
   * row), and reading one of those back reports a plausible wrong value rather than nothing —
   * exactly what the sentinel exists to prevent. Drive such a field through the ix-* control's
   * own harness, or give it a branch here.
   *
   * The marker only lands on a control the directive could register, which needs a name — an
   * ix-* control bound through a bare `[formControl]` is invisible here. Forms name their
   * controls, so that gap is theoretical; a control that must be recognised regardless needs its
   * own element-matched locator, the way {@link ipInputWithNetmask} has one.
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
   * `TnFormFieldHarness.with()` names its own class in the predicate it builds, so inheriting it
   * would hand back a plain field harness with none of the control access below. Matches on
   * {@link getLabelText} rather than the field's own `getLabel()`, so a self-naming `tn-checkbox`
   * or `tn-radio-group` is reachable under the same name `indexControlsByLabel` files it under.
   *
   * **Keep the options below in sync with `FormFieldHarnessFilters`.** Re-listing them by hand is
   * what re-declaring the predicate costs: should the library grow a third filter, a caller
   * passing it here still type-checks but the option is never added, so the predicate matches
   * every field instead of narrowing. Re-check this list when bumping `@truenas/ui-components`.
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
    // A projected ix-* control names itself through its own `ix-label`, so ask it rather than
    // the tn-* internals it renders — a composite's first `tn-checkbox` would otherwise name
    // the whole field below.
    const ipInputWithNetmask = await this.ipInputWithNetmask();
    if (ipInputWithNetmask) {
      return ipInputWithNetmask.getLabelText();
    }
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
    const ipInputWithNetmask = await this.ipInputWithNetmask();
    if (ipInputWithNetmask) {
      return ipInputWithNetmask.getValue();
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
    return unreadableControl;
  }

  async setValue(value: unknown): Promise<void> {
    const ipInputWithNetmask = await this.ipInputWithNetmask();
    if (ipInputWithNetmask) {
      await ipInputWithNetmask.setValue(value == null ? '' : String(value));
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
    throw new Error(
      `tn-form-field "${await this.getLabelText()}" holds no control TnFormControlHarness can set `
      + '(supported: tn-input, tn-select, tn-checkbox, tn-checkbox-group, tn-radio) — drive it '
      + 'through its own tn-* harness.',
    );
  }

  /**
   * The options a `tn-select` in this field offers, read with the panel opened and closed again.
   * Deliberately outside the {@link IxFormControlHarness} contract, which knows only about the
   * value a control *has* — it lives here so a spec asserting which options a select offers can
   * still address it by label, instead of hanging a CSS anchor on the select for the test's sake.
   */
  async getSelectOptions(): Promise<string[]> {
    if (await this.ipInputWithNetmask() || await this.projectedIxControl()) {
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
   * **Sharp edge:** a radio group reports disabled only when *every* option is, which is what the
   * `IxFormControlHarness` contract means for a group disabled as a unit (how `setDisabledState`
   * drives one). A partially-disabled group — individual options disabled to bar certain choices —
   * therefore reads as enabled, and no assertion here can see which options are off. Assert those
   * through `TnRadioHarness.isDisabled()` per option instead.
   *
   * Returns {@link unreadableControl} for a control with no branch here, for the reason spelled out
   * on {@link getValue}: a `false` would read as "enabled" for a control that may well be disabled.
   */
  async isDisabled(): Promise<boolean | typeof unreadableControl> {
    const ipInputWithNetmask = await this.ipInputWithNetmask();
    if (ipInputWithNetmask) {
      return ipInputWithNetmask.isDisabled();
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
    return unreadableControl;
  }
}
