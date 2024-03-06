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
import { UiSearchProviderService } from 'app/modules/global-ui-search/services/ui-search.service';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { UiSearchComponent } from './ui-search.component';

const mockedSearchResults = [
  { hierarchy: ['Filtered Result 1'], requiredRoles: ['FULL_ADMIN'] },
];

describe('UiSearchComponent', () => {
  let spectator: Spectator<UiSearchComponent>;

  const createComponent = createComponentFactory({
    component: UiSearchComponent,
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
      mockProvider(UiSearchProviderService, {
        search: () => of(mockedSearchResults),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should update search results when typing in the input', fakeAsync(() => {
    const inputElement = spectator.query('.search-input');

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
