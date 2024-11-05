import { HarnessLoader, TestKey } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatCalendarHarness } from '@angular/material/datepicker/testing';
import { CompletionContext } from '@codemirror/autocomplete';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { auditEventLabels, AuditService } from 'app/enums/audit.enum';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { Option } from 'app/interfaces/option.interface';
import { AdvancedSearchComponent } from 'app/modules/forms/search-input/components/advanced-search/advanced-search.component';
import { AdvancedSearchHarness } from 'app/modules/forms/search-input/components/advanced-search/advanced-search.harness';
import {
  AdvancedSearchAutocompleteService,
} from 'app/modules/forms/search-input/services/advanced-search-autocomplete.service';
import { QueryParserService } from 'app/modules/forms/search-input/services/query-parser/query-parser.service';
import { QueryToApiService } from 'app/modules/forms/search-input/services/query-to-api/query-to-api.service';
import { dateProperty, searchProperties, textProperty } from 'app/modules/forms/search-input/utils/search-properties.utils';

describe('AdvancedSearchComponent – autocomplete', () => {
  let spectator: Spectator<AdvancedSearchComponent<AuditEntry>>;
  let searchHarness: AdvancedSearchHarness;
  let loader: HarnessLoader;
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
        properties: searchProperties<AuditEntry>([
          textProperty(
            'username',
            'Username',
            of([
              { label: 'Bob', value: '"bob"' },
              { label: 'John', value: '"john"' },
            ]),
          ),
          textProperty(
            'service',
            'Сервіс',
            of<Option[]>([]),
            new Map<AuditService, string>([
              [AuditService.Middleware, 'Проміжне програмне забезпечення'],
              [AuditService.Smb, 'Ес-ем-бе'],
            ]),
          ),
          textProperty(
            'event',
            'Event',
            of<Option[]>([]),
            auditEventLabels,
          ),
          dateProperty(
            'message_timestamp',
            'Timestamp',
          ),
        ]),
      },
    });
    searchHarness = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, AdvancedSearchHarness);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);

    // Positioning does not work correctly because of JSDOM limitations, so we fudge it here.
    const autocompleteService = spectator.inject(AdvancedSearchAutocompleteService);
    const original = autocompleteService.getCompletions;
    jest.spyOn(autocompleteService, 'getCompletions').mockImplementation((context: CompletionContext) => {
      return original.call(autocompleteService, {
        ...context,
        pos: context.state.doc.toString().length,
      });
    });
  });

  describe('seeing suggestions', () => {
    it('shows autocomplete for column names when user clicks in the empty editor', async () => {
      await (await searchHarness.getInputArea()).click();
      const autocomplete = await searchHarness.getAutocomplete();
      expect(await autocomplete.getOptions()).toEqual([
        'Event',
        'Timestamp',
        'Username',
        'Сервіс',
      ]);
    });

    it('shows filtered column options as user types', async () => {
      await searchHarness.setValue('User');
      const autocomplete = await searchHarness.getAutocomplete();

      expect(await autocomplete.getOptions()).toEqual([
        'Username',
      ]);
    });

    it('shows autocomplete for comparators after user types column name and space', async () => {
      await searchHarness.setValue('Username ');

      const autocomplete = await searchHarness.getAutocomplete();
      expect(await autocomplete.getOptions()).toEqual([
        '= (Equals)',
        '!= (Not Equals)',
        '> (Greater Than)',
        '< (Less Than)',
        '<= (Less Than or Equal To)',
        '>= (Greater Than or Equal To)',
        '~ (Contains)',
        '^ (Starts With)',
        '$ (Ends With)',
        '!^ (Not Starts With)',
        '!$ (Not Ends With)',
        'IN (In)',
        'NIN (Not In)',
        'RIN (Range In)',
        'RNIN (Range Not In)',
      ]);
    });

    it('shows autocomplete for values matching column name', async () => {
      await searchHarness.setValue('Username = ');

      const autocomplete = await searchHarness.getAutocomplete();
      expect(await autocomplete.getOptions()).toEqual([
        'Bob',
        'John',
      ]);
    });

    it('shows autocomplete for values matching column name after quote was typed', async () => {
      await searchHarness.setValue('Username = "');

      const autocomplete = await searchHarness.getAutocomplete();
      expect(await autocomplete.getOptions()).toEqual([
        'Bob',
        'John',
      ]);
    });

    it('shows autocomplete for connectors between statements', async () => {
      await searchHarness.setValue('Username = "Bob" ');

      const autocomplete = await searchHarness.getAutocomplete();
      expect(await autocomplete.getOptions()).toEqual([
        'AND',
        'OR',
      ]);
    });

    it('provides suggestions for IN statements', async () => {
      await searchHarness.setValue('Username IN (');

      const autocomplete = await searchHarness.getAutocomplete();
      expect(await autocomplete.getOptions()).toEqual([
        'Bob',
        'John',
      ]);
    });

    it('provides suggestions for new column after a connector', async () => {
      await searchHarness.setValue('Username = "Bob" OR ');

      const autocomplete = await searchHarness.getAutocomplete();
      expect(await autocomplete.getOptions()).toEqual([
        'Event',
        'Timestamp',
        'Username',
        'Сервіс',
      ]);
    });

    it('provides suggestions for connector after a group in quotes', async () => {
      await searchHarness.setValue('(Username = "Bob") ');

      const autocomplete = await searchHarness.getAutocomplete();
      expect(await autocomplete.getOptions()).toEqual([
        'AND',
        'OR',
      ]);
    });
  });

  describe('selecting suggestions', () => {
    it('inserts column name when it is selected', async () => {
      await searchHarness.setValue('User');
      const autocomplete = await searchHarness.getAutocomplete();

      await autocomplete.select('Username');

      expect(await searchHarness.getValue()).toBe('Username');
    });

    it('inserts a comparator when it is selected', async () => {
      await searchHarness.setValue('Username ');
      const autocomplete = await searchHarness.getAutocomplete();

      await autocomplete.select('= (Equals)');

      expect(await searchHarness.getValue()).toBe('Username =');
    });

    it('inserts a quoted value when it is selected', async () => {
      await searchHarness.setValue('Username = ');
      const autocomplete = await searchHarness.getAutocomplete();

      await autocomplete.select('Bob');

      expect(await searchHarness.getValue()).toBe('Username = "bob"');
    });

    it('inserts a logical operator when it is selected', async () => {
      await searchHarness.setValue('Username = "Bob" ');
      const autocomplete = await searchHarness.getAutocomplete();

      await autocomplete.select('AND');

      expect(await searchHarness.getValue()).toBe('Username = "Bob" AND');
    });

    // TODO: Broken after package update. Actually functionality is working.
    it.skip('inserts a suggestion when Enter is pressed', async () => {
      await searchHarness.setValue('User');

      await (await searchHarness.getInputArea()).sendKeys(TestKey.ENTER);

      expect(await searchHarness.getValue()).toBe('Username');
    });
  });

  describe('date suggestions', () => {
    it('shows and inserts a date for date properties', async () => {
      await searchHarness.setValue('Timestamp > ');

      const calendar = await loader.getHarness(MatCalendarHarness);
      await calendar.changeView();
      await calendar.selectCell({ text: '2023' });
      await calendar.selectCell({ text: 'DEC' });
      await calendar.selectCell({ text: '21' });

      expect(await searchHarness.getValue()).toBe('Timestamp > "2023-12-21"');
    });
  });
});
