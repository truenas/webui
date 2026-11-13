import { DestroyRef, Directive, inject } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { TnFormFieldComponent } from '@truenas/ui-components';
import { manualValidateErrorKey } from 'app/modules/forms/ix-forms/manual-validate-error.constants';
import { SignalFormErrors } from 'app/modules/forms/signal-forms/signal-form-errors.service';

/**
 * Makes dismissing a server error under a `[formField]` control retire it, so Save works again.
 *
 * `tn-form-field` can only hide a signal form error the user closes: the error comes from the schema
 * and stays on the field, which stays invalid. This listens for the dismissal and drops the verdict in
 * {@link SignalFormErrors}. It does nothing for a field outside a `tn-form-field`, or in a form without
 * the service. Comes with {@link signalFormImports}; there is no reason to import it alone.
 */
@Directive({
  selector: '[formField]',
})
export class IxSignalErrorDismissDirective {
  private formField = inject(FormField);
  private serverErrors = inject(SignalFormErrors, { optional: true });
  private tnFormField = inject(TnFormFieldComponent, { optional: true });

  constructor() {
    if (!this.serverErrors || !this.tnFormField) {
      return;
    }
    const subscription = this.tnFormField.dismiss.subscribe((key) => {
      if (key === manualValidateErrorKey) {
        this.serverErrors?.dismiss(this.formField.state());
      }
    });
    inject(DestroyRef).onDestroy(() => subscription.unsubscribe());
  }
}

/**
 * What a signal form's template imports to bind controls: `FormField` for `[formField]`, plus the
 * directive that lets a dismissed server error unblock Save.
 */
export const signalFormImports = [FormField, IxSignalErrorDismissDirective] as const;
