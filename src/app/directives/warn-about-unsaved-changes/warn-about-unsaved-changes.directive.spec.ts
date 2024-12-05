import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  createHostFactory, SpectatorHost, mockProvider,
} from '@ngneat/spectator/jest';
import { of, Subject } from 'rxjs';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { WarnAboutUnsavedChangesDirective } from './warn-about-unsaved-changes.directive';

describe('WarnAboutUnsavedChangesDirective', () => {
  let spectator: SpectatorHost<WarnAboutUnsavedChangesDirective<unknown>>;

  const createHost = createHostFactory({
    component: WarnAboutUnsavedChangesDirective,
    imports: [ReactiveFormsModule],
    providers: [
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      {
        provide: SlideInRef,
        useFactory: () => ({
          close: jest.fn(),
          slideInClosed$: new Subject<void>(),
        }),
      },
    ],
  });

  beforeEach(() => {
    spectator = createHost(`
      <form [formGroup]="form" warnAboutUnsavedChanges></form>
    `, {
      hostProps: {
        form: new FormGroup({}),
      },
    });
  });

  it('should emit close event if there are no unsaved changes', () => {
    spectator.component.formGroup().markAsPristine();

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
