import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { of } from 'rxjs';
import { SubmitResult } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import {
  BaseNamespaceFormComponent,
} from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/base-namespace-form.component';
import { NamespaceChanges } from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/namespace-changes.interface';

/**
 * Used during subsystem creation: doesn't persist anything, just hands the
 * `NamespaceChanges` payload back to the wizard. `suppressSuccessSnackbar`
 * mirrors the pre-migration behavior where no "Saved!" toast was shown.
 */
@Component({
  selector: 'ix-add-subsystem-namespace',
  templateUrl: './add-subsystem-namespace.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BaseNamespaceFormComponent,
  ],
})
export class AddSubsystemNamespaceComponent {
  // Required by `ComponentInSlideIn<D, R>` for caller-side type inference on
  // `.onSuccess((response) => ...)`. Not used by this component itself —
  // `<ix-form>` (via the base) injects its own `SlideInRef` and owns close.
  // Field is annotated explicitly because `inject<…>(SlideInRef)` won't
  // narrow the class's default generic args when nothing here reads from
  // the ref — leaving the caller's `response` typed as `unknown`.
  slideInRef = inject(SlideInRef) as SlideInRef<void, NamespaceChanges>;

  handleSubmit = (changes: NamespaceChanges): SubmitResult => ({
    request$: of(changes),
    successMessage: '' as TranslatedString,
  });
}
