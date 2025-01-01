import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { auditEventLabels, AuditService } from 'app/enums/audit.enum';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { Option } from 'app/interfaces/option.interface';
import { QueryFilters } from 'app/interfaces/query-api.interface';
import { AdvancedSearchComponent } from 'app/modules/forms/search-input/components/advanced-search/advanced-search.component';
import { AdvancedSearchHarness } from 'app/modules/forms/search-input/components/advanced-search/advanced-search.harness';
import { AdvancedSearchAutocompleteService } from 'app/modules/forms/search-input/services/advanced-search-autocomplete.service';
import { QueryParserService } from 'app/modules/forms/search-input/services/query-parser/query-parser.service';
import { QueryToApiService } from 'app/modules/forms/search-input/services/query-to-api/query-to-api.service';
import { searchProperties, textProperty } from 'app/modules/forms/search-input/utils/search-properties.utils';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';

describe('AdvancedSearchComponent – editing', () => {
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

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        query: [
          [
            'OR',
            [
              [
                ['event', 'in', ['AUTHENTICATION', 'CLOSE']],
                ['username', '=', 'admin'],
                ['service', '=', 'MIDDLEWARE'],
              ],
              [
                ['event', '=', 'AUTHENTICATION'],
                ['service', '=', 'SMB'],
              ],
            ],
          ],
        ] as QueryFilters<AuditEntry>,
        properties: searchProperties<AuditEntry>([
          textProperty(
            'username',
            'Username',
            of<Option[]>([]),
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
        ]),
      },
    });
    searchHarness = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, AdvancedSearchHarness);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    jest.spyOn(spectator.component.switchToBasic, 'emit');
  });

  describe('no default input provided', () => {
    it('resets text area when reset icon is pressed', async () => {
      await searchHarness.setValue('test');
      expect(await searchHarness.getValue()).toBe('test');
      await (await searchHarness.getResetIcon()).click();
      expect(await searchHarness.getValue()).toBe('');
    });

    it('emits (switchToBasic) when Switch To Basic is pressed', async () => {
      expect(await (await searchHarness.getSwitchLink()).text()).toBe('Switch To Basic');
      await searchHarness.clickSwitchToBasic();

      expect(spectator.component.switchToBasic.emit).toHaveBeenCalled();
    });
  });

  describe('has default input provided', () => {
    it('correctly sets predefined input value', async () => {
      expect(await searchHarness.getValue()).toBe(
        '(("Event" IN ("Authentication", "Close") AND "Username" = "admin" AND "Сервіс" = "Проміжне програмне забезпечення") OR ("Event" = "Authentication" AND "Сервіс" = "Ес-ем-бе"))',
      );
    });
  });

  describe('handles errors', () => {
    it('shows error icon and stores error', async () => {
      await searchHarness.setValue('Username = "root');

      const icon = await loader.getHarness(IxIconHarness.with({ ancestor: '.prefix-icon' }));
      expect(await icon.getName()).toBe('warning');
      // TODO: Refactor not to rely on protected property.
      expect(spectator.component.errorMessages![0].message).toBe('Syntax error at 11-16');
    });
  });
});
