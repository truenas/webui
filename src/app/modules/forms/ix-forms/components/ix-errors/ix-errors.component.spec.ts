import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ReactiveFormsModule, FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
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
    control.markAsTouched();
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
    control.markAsTouched();
    spectator.detectComponentChanges();

    expect(spectator.inject(LiveAnnouncer).announce).toHaveBeenCalledWith('Errors in Name: Custom error');
  });

  it('displays errors immediately when control has errors on init', () => {
    const invalidControl = new FormControl(5, [Validators.min(10)]);

    spectator.setHostInput('control', invalidControl);
    spectator.detectComponentChanges();

    expect(spectator.inject(LiveAnnouncer).announce).toHaveBeenCalledWith('Errors in Name: Minimum value is 10');
    expect(spectator.query('.form-error')).toExist();
    expect(spectator.query('.error-message')).toHaveText('Minimum value is 10');
  });

  it('does not announce errors when control is in PENDING state', () => {
    jest.clearAllMocks();

    const asyncControl = new FormControl('', {
      asyncValidators: () => new Promise(() => {}),
    });

    spectator.setHostInput('control', asyncControl);
    spectator.detectComponentChanges();

    expect(spectator.inject(LiveAnnouncer).announce).not.toHaveBeenCalled();
  });

  it('clears errors when control becomes valid', () => {
    const dynamicControl = new FormControl('invalid', [Validators.minLength(10)]);

    spectator.setHostInput('control', dynamicControl);
    spectator.detectComponentChanges();

    expect(spectator.inject(LiveAnnouncer).announce).toHaveBeenCalledWith('Errors in Name: The length of Name should be at least 10');

    jest.clearAllMocks();

    dynamicControl.setValue('valid value with length');
    spectator.detectComponentChanges();

    expect(spectator.component.messages).toEqual([]);
  });

  it('does not display errors for empty required fields on init (new form scenario)', () => {
    jest.clearAllMocks();

    const emptyRequiredControl = new FormControl('', [Validators.required]);

    spectator.setHostInput('control', emptyRequiredControl);
    spectator.detectComponentChanges();

    expect(spectator.query('.form-error')).not.toExist();
    expect(spectator.inject(LiveAnnouncer).announce).not.toHaveBeenCalled();
  });

  it('does not mark control as touched when displaying initial errors', () => {
    const invalidControl = new FormControl(5, [Validators.min(10)]);

    spectator.setHostInput('control', invalidControl);
    spectator.detectComponentChanges();

    expect(invalidControl.touched).toBe(false);
  });

  // One ix-errors is mounted per control and manual errors usually arrive together from a single
  // failed save, so a static id on the dismiss icon put several identical elements on one page.
  describe('the dismiss icon\'s test id', () => {
    function manualErrorOn(errored: FormControl): void {
      errored.setErrors({ ixManualValidateError: { message: 'Custom error' } });
      // The whole block is behind `touched || dirty`, so an untouched control renders nothing.
      errored.markAsTouched();
      spectator.setHostInput('control', errored);
      spectator.detectComponentChanges();
    }

    /** `tn-icon` writes the id on the element inside its host, so read it from there. */
    function dismissIconTestId(): string | null | undefined {
      return spectator.query('.close-icon')
        ?.querySelector('[data-test]')
        ?.getAttribute('data-test');
    }

    it('is scoped to the name of the control it reports on', () => {
      const form = new FormGroup({ smb_shares: new FormControl('') });

      manualErrorOn(form.controls.smb_shares);

      expect(dismissIconTestId()).toBe('icon-dismiss-error-smb-shares');
    });

    it('falls back to the label when the control has no parent to name it', () => {
      manualErrorOn(new FormControl(''));

      expect(dismissIconTestId()).toBe('icon-dismiss-error-name');
    });

    // A control inside a FormArray is named by its index, and the array can renumber it without
    // the `control` input ever changing identity. Reading the name per change detection is what
    // keeps the id current; a cached one would leave two rows claiming the same index.
    it('follows the control when its array renumbers it', () => {
      const array = new FormArray([new FormControl(''), new FormControl('')]);

      manualErrorOn(array.at(1) as FormControl);

      expect(dismissIconTestId()).toBe('icon-dismiss-error-1');

      array.removeAt(0);
      spectator.detectComponentChanges();

      expect(dismissIconTestId()).toBe('icon-dismiss-error-0');
    });
  });
});
