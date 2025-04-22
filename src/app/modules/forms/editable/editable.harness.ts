import {
  BaseHarnessFilters, ContentContainerComponentHarness, HarnessPredicate, TestKey,
} from '@angular/cdk/testing';
import {
  fillControlValues,
  indexControlsByLabel,
  SupportedFormControlHarness, supportedFormControlSelectors,
} from 'app/modules/forms/ix-forms/testing/control-harnesses.helpers';

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

  getControlHarnesses = this.locatorForAll(...supportedFormControlSelectors);

  async getControlHarnessesDict(): Promise<Record<string, SupportedFormControlHarness>> {
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

    const controls = await this.getControlHarnesses();
    if (controls.length === 0) {
      throw new Error('No controls found in editable');
    }

    await controls[0].setValue(value as never);

    await this.tryToClose();
  }
}
