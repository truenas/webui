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
import { GlobalSearchComponent } from 'app/modules/global-search/components/global-search/global-search.component';
import { GlobalSearchResultsComponent } from 'app/modules/global-search/components/global-search-results/global-search-results.component';
import { UiSearchProvider } from 'app/modules/global-search/services/ui-search.service';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';

const mockedSearchResults = [
  { hierarchy: ['Filtered Result 1'], requiredRoles: [Role.FullAdmin] },
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
    ],
    providers: [
      mockAuth(),
      { provide: MatDialogRef, useValue: {} },
      mockProvider(UiSearchProvider, {
        search: () => of(mockedSearchResults),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should update search results when typing in the input', fakeAsync(() => {
    const inputElement = spectator.query('.search-input');

    expect(spectator.component.searchResults).toBeUndefined();

    spectator.typeInElement('Filtered', inputElement);
    tick(150);
    spectator.detectChanges();

    expect(spectator.component.searchResults).toBe(mockedSearchResults);
    expect(spectator.component.searchResults).toHaveLength(1);
  }));

  it('should reset search input and results', () => {
    spectator.component.resetInput();
    spectator.detectChanges();

    expect(spectator.component.searchControl.value).toBeNull();
    expect(document.activeElement).toBe(spectator.query('input'));
  });
});
