import { A11yModule } from '@angular/cdk/a11y';
import { fakeAsync, tick } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Role } from 'app/enums/role.enum';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { GlobalSearchComponent } from 'app/modules/global-search/components/global-search/global-search.component';
import { GlobalSearchResultsComponent } from 'app/modules/global-search/components/global-search-results/global-search-results.component';
import { GlobalSearchSection } from 'app/modules/global-search/enums/global-search-section';
import { UiSearchProvider } from 'app/modules/global-search/services/ui-search.service';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';

const mockedSearchResults = [
  { hierarchy: ['Filtered Result 1'], requiredRoles: [Role.FullAdmin] },
  { hierarchy: ['Test result'], requiredRoles: [Role.FullAdmin] },
];

describe('GlobalSearchComponent', () => {
  let spectator: Spectator<GlobalSearchComponent>;

  const createComponent = createComponentFactory({
    component: GlobalSearchComponent,
    declarations: [GlobalSearchResultsComponent],
    imports: [
      FormsModule,
      ReactiveFormsModule,
      NoopAnimationsModule,
      RouterTestingModule,
      MatDialogModule,
      TranslateModule.forRoot(),
      IxIconModule,
      A11yModule,
      EmptyComponent,
    ],
    providers: [
      mockAuth(),
      { provide: MatDialogRef, useValue: {} },
      mockProvider(UiSearchProvider, {
        search: jest.fn().mockReturnValue(of(mockedSearchResults)),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    jest.clearAllMocks();
  });

  it('should update search results for "Filtered" input', fakeAsync(() => {
    const inputElement = spectator.query('.search-input');

    const mockSearchMethod = spectator.inject(UiSearchProvider).search as unknown as jest.Mock;

    mockSearchMethod.mockImplementation((term) => {
      if (term === 'Filtered') {
        return of([
          { hierarchy: ['Filtered Result 1'], requiredRoles: [Role.FullAdmin] },
        ]);
      }
      return of([]);
    });

    spectator.typeInElement('Filtered', inputElement);
    tick(150);
    spectator.detectChanges();

    expect(spectator.component.searchResults).toEqual([
      { hierarchy: ['Filtered Result 1'], requiredRoles: [Role.FullAdmin] },
      {
        hierarchy: ['Search Documentation for «{value}»'],
        section: GlobalSearchSection.Help,
        targetHref: 'https://www.truenas.com/docs/search/?query=Filtered',
      },
    ]);

    expect(spectator.component.searchResults).toHaveLength(2);
  }));

  it(
    'should handle empty UI search results for "Unknown" input and show only "Documentation Search" section result',
    fakeAsync(() => {
      const inputElement = spectator.query('.search-input');

      const mockSearchMethod = spectator.inject(UiSearchProvider).search as unknown as jest.Mock;

      mockSearchMethod.mockImplementation((term) => {
        if (term === 'Unknown') {
          return of([]);
        }
        return of(mockedSearchResults);
      });

      spectator.typeInElement('Unknown', inputElement);
      tick(150);
      spectator.detectChanges();

      expect(spectator.component.searchResults).toEqual([
        {
          hierarchy: ['Search Documentation for «{value}»'],
          section: GlobalSearchSection.Help,
          targetHref: 'https://www.truenas.com/docs/search/?query=Unknown',
        },
      ]);
      expect(spectator.component.searchResults).toHaveLength(1);
    }),
  );

  it('should reset search input and results', () => {
    const inputElement = spectator.query('.search-input');
    spectator.typeInElement('Filtered', inputElement);

    spectator.component.resetInput();
    spectator.detectChanges();

    expect(spectator.component.searchControl.value).toBeNull();
    expect(document.activeElement).toBe(spectator.query('input'));
  });
});
