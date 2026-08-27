import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { Option } from 'app/interfaces/option.interface';
import { QueryFilters } from 'app/interfaces/query-api.interface';
import { AdvancedSearchComponent } from 'app/modules/forms/search-input/components/advanced-search/advanced-search.component';
import { AdvancedSearchHarness } from 'app/modules/forms/search-input/components/advanced-search/advanced-search.harness';
import { AdvancedSearchAutocompleteService } from 'app/modules/forms/search-input/services/advanced-search-autocomplete.service';
import { QueryParserService } from 'app/modules/forms/search-input/services/query-parser/query-parser.service';
import { QueryToApiService } from 'app/modules/forms/search-input/services/query-to-api/query-to-api.service';
import { dateProperty, searchProperties, textProperty } from 'app/modules/forms/search-input/utils/search-properties.utils';

describe('AdvancedSearchComponent – filter stacking', () => {
  let spectator: Spectator<AdvancedSearchComponent<AuditEntry>>;
  let searchHarness: AdvancedSearchHarness;
  let emittedFilters: QueryFilters<AuditEntry>;

  const createComponent = createComponentFactory({
    component: AdvancedSearchComponent<AuditEntry>,
    providers: [
      QueryToApiService,
      QueryParserService,
      AdvancedSearchAutocompleteService,
    ],
  });

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        query: [] as QueryFilters<AuditEntry>,
        properties: searchProperties<AuditEntry>([
          textProperty('event', 'Event', of<Option[]>([])),
          textProperty('username', 'Username', of<Option[]>([])),
          dateProperty('message_timestamp', 'Timestamp'),
        ]),
      },
    });
    searchHarness = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, AdvancedSearchHarness);
    spectator.component.paramsChange.subscribe((filters) => {
      emittedFilters = filters;
    });
  });

  it('keeps every condition when the same property is excluded more than once', async () => {
    await searchHarness.setValue('Event != "AUTHENTICATION" AND Event != "CLOSE"');

    expect(emittedFilters).toEqual([
      ['event', '!=', 'AUTHENTICATION'],
      ['event', '!=', 'CLOSE'],
    ]);
  });

  it('keeps both ends of a range on the same property', async () => {
    await searchHarness.setValue('Timestamp > "2026-08-01" AND Timestamp < "2026-08-17"');

    expect(emittedFilters).toEqual([
      ['message_timestamp', '>', expect.any(Number)],
      ['message_timestamp', '<', expect.any(Number)],
    ]);
  });

  it('keeps conditions on the same property mixed with other properties in order', async () => {
    await searchHarness.setValue('Event != "AUTHENTICATION" AND Username = "paul" AND Event != "CLOSE"');

    expect(emittedFilters).toEqual([
      ['event', '!=', 'AUTHENTICATION'],
      ['username', '=', 'paul'],
      ['event', '!=', 'CLOSE'],
    ]);
  });

  it('keeps the last value when the same property is matched with = more than once', async () => {
    await searchHarness.setValue('Username = "paul" AND Event != "CLOSE" AND Username = "root"');

    expect(emittedFilters).toEqual([
      ['event', '!=', 'CLOSE'],
      ['username', '=', 'root'],
    ]);
  });

  it('leaves OR groups untouched', async () => {
    await searchHarness.setValue('Event = "AUTHENTICATION" OR Event = "CLOSE"');

    expect(emittedFilters).toEqual([
      ['OR', [['event', '=', 'AUTHENTICATION'], ['event', '=', 'CLOSE']]],
    ]);
  });
});
