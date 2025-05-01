import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { auditEventLabels } from 'app/enums/audit.enum';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { Option } from 'app/interfaces/option.interface';
import { FilterPreset } from 'app/interfaces/query-api.interface';
import { AdvancedSearchComponent } from 'app/modules/forms/search-input/components/advanced-search/advanced-search.component';
import { AdvancedSearchHarness } from 'app/modules/forms/search-input/components/advanced-search/advanced-search.harness';
import { AdvancedSearchAutocompleteService } from 'app/modules/forms/search-input/services/advanced-search-autocomplete.service';
import { QueryParserService } from 'app/modules/forms/search-input/services/query-parser/query-parser.service';
import { QueryToApiService } from 'app/modules/forms/search-input/services/query-to-api/query-to-api.service';
import { searchProperties, textProperty } from 'app/modules/forms/search-input/utils/search-properties.utils';

describe('AdvancedSearchComponent – presets', () => {
  let spectator: Spectator<AdvancedSearchComponent<AuditEntry>>;
  let loader: HarnessLoader;
  let searchHarness: AdvancedSearchHarness;

  const createComponent = createComponentFactory({
    component: AdvancedSearchComponent<AuditEntry>,
    providers: [
      QueryToApiService,
      QueryParserService,
      AdvancedSearchAutocompleteService,
    ],
  });

  const userPresets: FilterPreset<AuditEntry>[] = [
    {
      label: 'Has SMB Access',
      query: [['service', '=', 'SMB']],
    },
    {
      label: 'Is Admin',
      query: [['username', '=', 'admin']],
    },
  ];

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        query: [],
        filterPresets: userPresets,
        properties: searchProperties<AuditEntry>([
          textProperty('username', 'Username', of<Option[]>([])),
          textProperty('service', 'Service', of<Option[]>([]), auditEventLabels),
        ]),
      },
    });

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    searchHarness = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, AdvancedSearchHarness);
  });

  it('renders preset buttons when filterPresets are provided', async () => {
    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    const texts = await Promise.all(buttons.map((btn) => btn.getText()));

    expect(texts).toContain('+ Has SMB Access');
    expect(texts).toContain('+ Is Admin');
  });

  it('updates the input field when a preset button is clicked', async () => {
    const adminBtn = await loader.getHarness(MatButtonHarness.with({ text: '+ Is Admin' }));
    await adminBtn.click();

    const value = await searchHarness.getValue();
    expect(value).toBe('"Username" = "admin"');
  });

  it('appends multiple presets into the search input', async () => {
    const smbBtn = await loader.getHarness(MatButtonHarness.with({ text: '+ Has SMB Access' }));
    const adminBtn = await loader.getHarness(MatButtonHarness.with({ text: '+ Is Admin' }));

    await smbBtn.click();
    await adminBtn.click();

    expect(await searchHarness.getValue()).toBe('"Service" = "SMB" AND "Username" = "admin"');
  });

  it('removes preset buttons once clicked', async () => {
    const smbBtn = await loader.getHarness(MatButtonHarness.with({ text: '+ Has SMB Access' }));
    await smbBtn.click();

    const remaining = await loader.getAllHarnesses(MatButtonHarness);
    const labels = await Promise.all(remaining.map((btn) => btn.getText()));

    expect(labels).not.toContain('+ Has SMB Access');
    expect(labels).toContain('+ Is Admin');
  });

  it('restores preset buttons when manually cleared from input', async () => {
    const adminBtn = await loader.getHarness(MatButtonHarness.with({ text: '+ Is Admin' }));
    await adminBtn.click();

    expect(await searchHarness.getValue()).toContain('"Username" = "admin"');

    await searchHarness.setValue('');
    await spectator.fixture.whenStable();

    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    const labels = await Promise.all(buttons.map((btn) => btn.getText()));
    expect(labels).toContain('+ Is Admin');
  });
});
