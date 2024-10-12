import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  createHostFactory, SpectatorHost, mockProvider,
} from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { of, Subject } from 'rxjs';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSlideInRef } from 'app/modules/forms/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { FormChangeGuardForSlideInDirective } from './form-change-guard-for-slide-in.directive';

describe('FormChangeGuardForSlideInDirective', () => {
  let spectator: SpectatorHost<FormChangeGuardForSlideInDirective<unknown>>;

  const createHost = createHostFactory({
    component: FormChangeGuardForSlideInDirective,
    imports: [ReactiveFormsModule],
    providers: [
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(TranslateService, {
        instant: jest.fn((key: string) => key),
      }),
      {
        provide: IxSlideInRef,
        useFactory: () => ({
          close: jest.fn(),
          slideInClosed$: new Subject<void>(),
        }),
      },
    ],
  });

  beforeEach(() => {
    spectator = createHost(`
      <form [formGroup]="form" formChangeGuardForSlideIn></form>
    `, {
      hostProps: {
        form: new FormGroup({}),
      },
    });
  });

  it('should set formChanged to true when form value changes', () => {
    spectator.component.formGroup.markAsPristine();

    spectator.component.formGroup.valueChanges.subscribe(() => {
      expect(spectator.component.formChanged).toBe(true);
    });
  });

  it('should emit close event if there are no unsaved changes', () => {
    spectator.component.formGroup.markAsPristine();

    spectator.detectChanges();

    spectator.component.closeWithConfirmation().subscribe((shouldClose) => {
      expect(shouldClose).toBe(true);
    });
  });

  it('should call confirmation dialog if there are unsaved changes', () => {
    const dialogService = spectator.inject(DialogService);

    spectator.component.closeWithConfirmation().subscribe(() => {
      expect(dialogService.confirm).toHaveBeenCalled();
    });
  });
});
