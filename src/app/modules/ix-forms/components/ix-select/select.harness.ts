import { LegacyOptionHarnessFilters } from '@angular/material/legacy-core/testing';
import { MatLegacySelectHarness as MatSelectHarness } from '@angular/material/legacy-select/testing';
import { OptionHarness } from 'app/modules/ix-forms/components/ix-select/option.harness';

export class SelectHarness extends MatSelectHarness {
  protected _optionClass = OptionHarness;

  async getOptions(filter?: Omit<LegacyOptionHarnessFilters, 'ancestor'>): Promise<OptionHarness[]> {
    return super.getOptions(filter) as Promise<OptionHarness[]>;
  }
}
