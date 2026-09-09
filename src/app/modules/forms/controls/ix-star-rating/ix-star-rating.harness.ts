import { ComponentHarness, parallel } from '@angular/cdk/testing';
import { TnIconButtonHarness, TnIconHarness } from '@truenas/ui-components';
import { IxFormControlHarness } from 'app/modules/forms/ix-forms/interfaces/ix-form-control-harness.interface';

/**
 * The control renders only the stars — its label, required indicator and error text belong to the
 * wrapping `<tn-form-field>`, so {@link getLabelText} has nothing to report and `indexControlsByLabel`
 * leaves it out of a form index. Drive it through this harness directly, and read its label/errors
 * through `TnFormFieldHarness` / `TnFormControlHarness`.
 */
export class IxStarRatingHarness extends ComponentHarness implements IxFormControlHarness {
  static readonly hostSelector = 'ix-star-rating';

  getButtons = this.locatorForAll(TnIconButtonHarness);

  getLabelText(): Promise<string> {
    return Promise.resolve('');
  }

  async getValue(): Promise<number> {
    const selectedIcons = await this.locatorForAll(TnIconHarness.with({ name: 'star' }))();
    return selectedIcons.length;
  }

  async setValue(value: number): Promise<void> {
    const buttons = await this.getButtons();
    return buttons[value - 1].click();
  }

  async isDisabled(): Promise<boolean> {
    const buttons = await this.getButtons();
    const buttonStates = await parallel(() => buttons.map((button) => button.isDisabled()));

    return buttonStates.every(Boolean);
  }
}
