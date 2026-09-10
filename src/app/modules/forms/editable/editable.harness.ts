import {
  BaseHarnessFilters, ContentContainerComponentHarness, HarnessPredicate, TestKey,
} from '@angular/cdk/testing';
import {
  TnAutocompleteHarness, TnCheckboxHarness, TnInputHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { IxFormControlHarness } from 'app/modules/forms/ix-forms/interfaces/ix-form-control-harness.interface';
import {
  fillControlValues,
  formControlHarnessTypes,
  indexControlsByLabel,
} from 'app/modules/forms/ix-forms/testing/control-harnesses.helpers';

/** The only part of a control's surface {@link EditableHarness.setFirstControlValue} uses. */
interface WritableControlHarness {
  setValue(value: never): Promise<void>;
}

export class EditableHarness extends ContentContainerComponentHarness {
  static readonly hostSelector = 'ix-editable';

  static with(options: BaseHarnessFilters): HarnessPredicate<EditableHarness> {
    return new HarnessPredicate(EditableHarness, options);
  }

  getTrigger = this.locatorForOptional('.edit-trigger');
  getEditSlot = this.locatorForOptional('.edit-slot');

  async isOpen(): Promise<boolean> {
    return Boolean(await this.getEditSlot());
  }

  async getShownValue(): Promise<string> {
    return (await this.getTrigger()).text();
  }

  async open(): Promise<void> {
    const trigger = await this.getTrigger();
    if (trigger) {
      await trigger.click();
    }
  }

  async tryToClose(): Promise<void> {
    await (await this.host()).sendKeys(TestKey.ESCAPE);
  }

  /**
   * The controls that carry a label — the remaining ix-* composites and `tn-form-field`-wrapped
   * tn-* ones. An editable usually holds neither: it renders a BARE `tn-input`/`tn-select`,
   * because the row it sits in already names the value. Those are reached through
   * {@link bareControls} instead.
   */
  getControlHarnesses = this.locatorForAll(...formControlHarnessTypes);

  private bareControls = this.locatorForAll(TnInputHarness, TnSelectHarness, TnAutocompleteHarness, TnCheckboxHarness);

  async getControlHarnessesDict(): Promise<Record<string, IxFormControlHarness>> {
    const controls = await this.getControlHarnesses();
    return indexControlsByLabel(controls);
  }

  /**
   * Opens the editable, attempts to write values to support IxFormControls and closes it.
   * If you only have single control without label, use setFirstControlValue() instead.
   */
  async setValue(values: Record<string, unknown>): Promise<void> {
    await this.open();

    const controlsDict = await this.getControlHarnessesDict();
    await fillControlValues(controlsDict, values);

    await this.tryToClose();
  }

  async setFirstControlValue(value: unknown): Promise<void> {
    await this.open();

    // Labelled controls first so a field that DOES name itself is driven through the harness
    // that understands it, rather than through an internal the bare locators would also match.
    const labelled: WritableControlHarness[] = await this.getControlHarnesses();
    const controls = labelled.length ? labelled : await this.bareControls();
    if (controls.length === 0) {
      throw new Error('No controls found in editable');
    }

    await controls[0].setValue(value as never);

    await this.tryToClose();
  }
}
