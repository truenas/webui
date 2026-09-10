import { AbstractControl, AsyncValidatorFn } from '@angular/forms';

/**
 * `@ngneat/reactive-forms` widens `setAsyncValidators` with an options argument
 * that Angular's own signature does not carry. Angular's implementation ignores
 * extra arguments, so passing it is safe for either control.
 */
type SetAsyncValidatorsWithOptions = (
  validators: AsyncValidatorFn[],
  options?: { emitEvent?: boolean },
) => void;

/**
 * Adds an async validator to `control` without the attachment itself counting as
 * a validation event.
 *
 * `AbstractControl.addAsyncValidators()` looks like it should be inert — Angular's
 * own version only stores the validator. But `@ngneat/reactive-forms` (which every
 * form built through its `FormBuilder` uses) overrides `setAsyncValidators` to also
 * run `updateValueAndValidity()`, and `addAsyncValidators` routes through that
 * override with no options. So merely attaching a validator emits a status change.
 *
 * On an untouched, empty, required control that emission is enough for `ix-errors`
 * to mark the control touched and render "<field> is required" — before the user
 * has reached the field at all. That is NAS-143522: opening "Add Rsync Task" showed
 * the error under User, and only under User, because it is the one field whose
 * component attaches an async validator on init.
 *
 * Passing `{ emitEvent: false }` keeps the validator attached and the control's
 * validity up to date while leaving `statusChanges` silent, which is what the
 * call sites always intended.
 */
export function attachAsyncValidator(control: AbstractControl, validator: AsyncValidatorFn): void {
  const validators = control.asyncValidator ? [control.asyncValidator, validator] : [validator];

  (control.setAsyncValidators as SetAsyncValidatorsWithOptions)(validators, { emitEvent: false });
}
