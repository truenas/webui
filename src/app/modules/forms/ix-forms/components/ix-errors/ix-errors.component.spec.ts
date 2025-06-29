import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { createHostFactory, mockProvider, SpectatorHost } from '@ngneat/spectator/jest';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';

describe('IxErrorsComponent', () => {
  let spectator: SpectatorHost<IxErrorsComponent>;
  const control = new FormControl('');

  const createHost = createHostFactory({
    component: IxErrorsComponent,
    imports: [ReactiveFormsModule],
    providers: [mockProvider(LiveAnnouncer)],
  });

  beforeEach(() => {
    spectator = createHost('<ix-errors [control]="control" [label]="label"></ix-errors>', {
      hostProps: {
        control,
        label: 'Name',
      },
    });
  });

  it('announces validation errors', () => {
    control.setValidators([Validators.required]);
    control.updateValueAndValidity();
    spectator.detectComponentChanges();

    expect(spectator.inject(LiveAnnouncer).announce).toHaveBeenCalledWith('Errors in Name: Name is required');
  });

  it('announces manual validation errors', () => {
    control.setErrors({
      ixManualValidateError: { message: 'Custom error' },
      manualValidateError: true,
      manualValidateErrorMsg: 'Custom error',
    });
    spectator.detectComponentChanges();

    expect(spectator.inject(LiveAnnouncer).announce).toHaveBeenCalledWith('Errors in Name: Custom error');
  });
});
