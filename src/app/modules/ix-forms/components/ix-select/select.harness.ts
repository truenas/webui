import { OptionHarnessFilters } from '@angular/material/core/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { OptionHarness } from 'app/modules/ix-forms/components/ix-select/option.harness';

export class SelectHarness extends MatSelectHarness {
  protected _optionClass = OptionHarness;

  async getOptions(filter?: Omit<OptionHarnessFilters, 'ancestor'>): Promise<OptionHarness[]> {
    return super.getOptions(filter) as Promise<OptionHarness[]>;
  }
}
