import { A11yModule } from '@angular/cdk/a11y';
import { fakeAsync, tick } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Role } from 'app/enums/role.enum';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { GlobalSearchComponent } from 'app/modules/global-search/components/global-search/global-search.component';
import { GlobalSearchResultsComponent } from 'app/modules/global-search/components/global-search-results/global-search-results.component';
import { GlobalSearchSection } from 'app/modules/global-search/enums/global-search-section.enum';
import * as focusHelper from 'app/modules/global-search/helpers/focus-helper';
import { GlobalSearchSectionsProvider } from 'app/modules/global-search/services/global-search-sections.service';
import { UiSearchProvider } from 'app/modules/global-search/services/ui-search.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { SidenavService } from 'app/services/sidenav.service';
import { SlideInService } from 'app/services/slide-in.service';
import { SystemInfoState } from 'app/store/system-info/system-info.reducer';
import { selectSystemInfoState } from 'app/store/system-info/system-info.selectors';

const mockedSearchResults = [
  { hierarchy: ['Filtered Result 1'], requiredRoles: [Role.FullAdmin] },
  { hierarchy: ['Test result'], requiredRoles: [Role.FullAdmin] },
];

describe('GlobalSearchComponent', () => {
  let spectator: Spectator<GlobalSearchComponent>;

  const createComponent = createComponentFactory({
    component: GlobalSearchComponent,
    imports: [
      FormsModule,
      ReactiveFormsModule,
      NoopAnimationsModule,
      RouterTestingModule,
      MatDialogModule,
      TranslateModule.forRoot(),
      IxIconComponent,
      A11yModule,
      EmptyComponent,
      GlobalSearchResultsComponent,
    ],
    providers: [
      mockAuth(),
      GlobalSearchSectionsProvider,
      { provide: MatDialogRef, useValue: {} },
      mockProvider(UiSearchProvider, {
        search: jest.fn().mockReturnValue(of(mockedSearchResults)),
        selectionChanged$: of(),
      }),
      mockProvider(SlideInService, {
        closeAll: jest.fn(),
      }),
      mockProvider(SidenavService, {
        isMobile: () => false,
        closeSecondaryMenu: jest.fn(),
      }),
      mockProvider(DialogService, {
        closeAllDialogs: jest.fn(),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectSystemInfoState,
            value: {
              systemInfo: {
                version: 'TrueNAS-SCALE-24.10.0-MASTER-20240324-065034',
              },
            } as SystemInfoState,
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    jest.clearAllMocks();
  });

  it('should update search results for "Filtered" input & show help section', fakeAsync(() => {
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
        targetHref: 'https://www.truenas.com/docs/scale/24.10/search/?query=Filtered',
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
          targetHref: 'https://www.truenas.com/docs/scale/24.10/search/?query=Unknown',
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

    expect(spectator.component.searchControl.value).toBe('');
    expect(document.activeElement).toBe(spectator.query('input'));
  });

  it('handles keydown events', fakeAsync(() => {
    jest.spyOn(focusHelper, 'moveToNextFocusableElement').mockImplementation();

    const inputElement = spectator.query<HTMLInputElement>('.search-input');

    'Filtered'.split('').forEach((symbol) => {
      if (spectator.component.isSearchInputFocused) {
        spectator.component.searchControl.setValue(spectator.component.searchControl.value + symbol);
      }
      spectator.dispatchKeyboardEvent(inputElement, 'keydown', symbol);
    });
    tick(150);
    spectator.detectChanges();
    expect(spectator.component.searchControl.value).toBe('Filtered');
    expect(spectator.component.searchResults).toHaveLength(3);

    spectator.dispatchKeyboardEvent(inputElement, 'keydown', 'Enter');
    expect(focusHelper.moveToNextFocusableElement).toHaveBeenCalled();
  }));

  it('should close all backdrops', () => {
    const slideInService = spectator.inject(SlideInService);
    const sidenavService = spectator.inject(SidenavService);
    const dialogService = spectator.inject(DialogService);

    spectator.component.closeAllBackdrops();

    expect(slideInService.closeAll).toHaveBeenCalled();
    expect(sidenavService.closeSecondaryMenu).toHaveBeenCalled();
    expect(dialogService.closeAllDialogs).toHaveBeenCalled();
  });
});
