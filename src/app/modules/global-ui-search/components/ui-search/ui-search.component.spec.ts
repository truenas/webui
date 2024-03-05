import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { UiSearchProviderService } from 'app/modules/global-ui-search/services/ui-search.service';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { UiSearchComponent } from './ui-search.component';

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
    mocks: [UiSearchProviderService],
    providers: [
      { provide: MatDialogRef, useValue: {} },
      mockProvider(UiSearchProviderService, {
        search: () => of([
          { hierarchy: ['Filtered Result 1'], requiredRoles: ['FULL_ADMIN'] },
        ]),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should reset search input and results', () => {
    spectator.component.resetInput();
    spectator.detectChanges();

    expect(spectator.component.searchControl.value).toBeNull();
    expect(document.activeElement).toBe(spectator.query('input'));
  });
});
