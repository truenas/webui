import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { auditEventLabels, AuditService } from 'app/enums/audit.enum';
import { QueryFilters } from 'app/interfaces/query-api.interface';
import { User } from 'app/interfaces/user.interface';
import { AdvancedSearchComponent } from 'app/modules/search-input/components/advanced-search/advanced-search.component';
import { AdvancedSearchHarness } from 'app/modules/search-input/components/advanced-search/advanced-search.harness';
import { AdvancedSearchAutocompleteService } from 'app/modules/search-input/services/advanced-search-autocomplete.service';
import { QueryParserService } from 'app/modules/search-input/services/query-parser/query-parser.service';
import { QueryToApiService } from 'app/modules/search-input/services/query-to-api/query-to-api.service';
import { PropertyType, SearchProperty } from 'app/modules/search-input/types/search-property.interface';

describe('AdvancedSearchComponent', () => {
  let spectator: Spectator<AdvancedSearchComponent<User>>;
  let searchHarness: AdvancedSearchHarness;
  const createComponent = createComponentFactory({
    component: AdvancedSearchComponent<User>,
    providers: [
      QueryToApiService,
      QueryParserService,
      AdvancedSearchAutocompleteService,
    ],
  });

  describe('no default input provided', () => {
    beforeEach(async () => {
      spectator = createComponent();
      jest.spyOn(spectator.component.switchToBasic, 'emit');
      searchHarness = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, AdvancedSearchHarness);
      searchHarness.setEditor(spectator.component.editorView);
    });

    it('resets text area when reset icon is pressed', async () => {
      await searchHarness.setValue('test');
      await (await searchHarness.getResetIcon()).click();
      const placeholderText = await searchHarness.getPlaceholder();

      expect(await searchHarness.getValue()).toBe(placeholderText);
    });

    it('emits (switchToBasic) when Switch To Basic is pressed', async () => {
      expect(await (await searchHarness.getSwitchLink()).text()).toBe('Switch To Basic');
      await searchHarness.clickSwitchToBasic();

      expect(spectator.component.switchToBasic.emit).toHaveBeenCalled();
    });
  });

  describe('has default input provided', () => {
    beforeEach(async () => {
      spectator = createComponent({
        props: {
          query: [
            [
              'OR',
              [
                [
                  [
                    'event',
                    'in',
                    [
                      'AUTHENTICATION',
                      'CLOSE',
                    ],
                  ],
                  [
                    'username',
                    '=',
                    'admin',
                  ],
                  [
                    'service',
                    '=',
                    'MIDDLEWARE',
                  ],
                ],
                [
                  [
                    'event',
                    '=',
                    'AUTHENTICATION',
                  ],
                  [
                    'service',
                    '=',
                    'SMB',
                  ],
                ],
              ],
            ],
          ] as QueryFilters<User>,
          properties: [
            {
              label: 'Username',
              property: 'username',
              propertyType: PropertyType.Text,
            },
            {
              label: 'Сервіс',
              property: 'service',
              propertyType: PropertyType.Text,
              enumMap: new Map<AuditService, string>([
                [AuditService.Middleware, 'Проміжне програмне забезпечення'],
                [AuditService.Smb, 'Ес-ем-бе'],
              ]),
            },
            {
              label: 'Event',
              property: 'event',
              enumMap: auditEventLabels,
              propertyType: PropertyType.Text,
            },
          ] as SearchProperty<User>[],
        },
      });
      searchHarness = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, AdvancedSearchHarness);
    });

    it('correctly sets predefined input value', async () => {
      expect(await searchHarness.getValue()).toBe(
        '(("Event" IN ("Authentication", "Close") AND "Username" = "admin" AND "Сервіс" = "Проміжне програмне забезпечення") OR ("Event" = "Authentication" AND "Сервіс" = "Ес-ем-бе"))',
      );
    });
  });

  describe('handles errors', () => {
    beforeEach(async () => {
      spectator = createComponent();
      searchHarness = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, AdvancedSearchHarness);
      searchHarness.setEditor(spectator.component.editorView);
    });

    it('shows error icon and stores error', async () => {
      await searchHarness.setValue('Username = "root');

      expect(spectator.query('ix-icon')).toHaveAttribute('data-mat-icon-name', 'warning');
      expect(spectator.component.errorMessages[0].message).toBe('Syntax error at 11-16');
    });
  });
});
