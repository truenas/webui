import { TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
import { stepCompletedSignal } from 'app/helpers/step-completed-signal.helper';

/**
 * `stepCompletedSignal` calls `toSignal`, which requires an injection context, so
 * the assertions run inside `TestBed.runInInjectionContext`. The signal-of-form
 * overload relies on `toObservable` (effect-scheduled) and is covered by the
 * iSCSI wizard step specs that consume it.
 */
describe('stepCompletedSignal', () => {
  it('seeds with the control validity and tracks status changes', () => {
    TestBed.runInInjectionContext(() => {
      const control = new FormControl('', Validators.required);
      const completed = stepCompletedSignal(control);

      expect(completed()).toBe(false);

      control.setValue('something');
      expect(completed()).toBe(true);

      control.setValue('');
      expect(completed()).toBe(false);
    });
  });

  it('seeds with true when the control is already valid', () => {
    TestBed.runInInjectionContext(() => {
      const control = new FormControl('valid', Validators.required);

      expect(stepCompletedSignal(control)()).toBe(true);
    });
  });
});
