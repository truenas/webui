import { OptionHarnessFilters } from '@angular/material/core/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { OptionHarness } from 'app/modules/forms/ix-forms/components/ix-select/option.harness';

/**
 * Overrides some methods in MatSelectHarness to use OptionHarness instead of MatOptionHarness.
 * Our custom OptionHarness removes tooltip text from option text.
 */
export class SelectHarness extends MatSelectHarness {
  protected optionClass = OptionHarness;

  /** Gets the options inside the select panel. */
  override async getOptions(filter?: Omit<OptionHarnessFilters, 'ancestor'>): Promise<OptionHarness[]> {
    return this.documentRootLocatorFactory().locatorForAll(
      this.optionClass.with({
        ...(filter || {}),
        ancestor: await this.getPanelSelector(),
      } as OptionHarnessFilters),
    )();
  }

  private async getPanelSelector(): Promise<string> {
    const id = await (await this.host()).getAttribute('id');
    return `#${id}-panel`;
  }
}
