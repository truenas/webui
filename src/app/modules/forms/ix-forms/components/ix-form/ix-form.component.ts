import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { isEqual } from 'lodash-es';
import { Observable, of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TranslatedString } from 'app/modules/translate/translate.helper';

export interface FormSubmitEvent<T = Record<string, unknown>> {
  /**
   * Whether this form is in edit mode (editData was provided).
   */
  isEdit: boolean;

  /**
   * All current form values (equivalent to formGroup.getRawValue()).
   */
  allValues: T;

  /**
   * Only the properties that changed from the initial state.
   * In create mode this is the same as allValues.
   */
  changedValues: Partial<T>;
}

export interface SubmitResult {
  request$: Observable<unknown>;
  successMessage: TranslatedString;
}

/**
 * Unified form wrapper component that standardizes form behavior and layout.
 *
 * Handles:
 * - Common chrome: modal header, card wrapper, save button, form actions.
 * - Change tracking: captures initial form state and provides a diff on submit.
 * - Loading state: shows progress bar in header and disables save button.
 * - Dirty confirmation: auto-registers with SlideInRef (when present).
 * - Submit lifecycle: loading → API call → success snackbar + close / error handling.
 *
 * Usage:
 * ```html
 * <ix-form [formGroup]="form" [editData]="existingEntity" [title]="title"
 *          [requiredRoles]="requiredRoles" [submitHandler]="handleSubmit">
 *   <ix-fieldset [title]="'Options' | translate">
 *     <ix-input formControlName="name" [label]="'Name' | translate" />
 *   </ix-fieldset>
 * </ix-form>
 * ```
 */
@Component({
  selector: 'ix-form',
  templateUrl: './ix-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class IxFormComponent<T extends Record<string, unknown> = Record<string, unknown>> implements OnInit {
  /**
   * The reactive FormGroup this form manages.
   */
  readonly formGroup = input.required<FormGroup>();

  /**
   * Initial entity data for edit mode. Pass undefined/null for create mode.
   */
  readonly editData = input<T | null | undefined>(null);

  /**
   * Title shown in the modal header.
   */
  readonly title = input<string>('');

  /**
   * Roles required to submit the form.
   */
  readonly requiredRoles = input<Role[]>([]);

  /**
   * Callback that receives the form submit event and returns the API
   * request and success message. The component handles the full lifecycle:
   * loading state → API call → snackbar + close / error handling.
   */
  readonly submitHandler = input.required<(event: FormSubmitEvent<T>) => SubmitResult>();

  /**
   * Loading state – disables the save button and shows the progress bar.
   */
  readonly isLoading = signal(false);

  private initialSnapshot: Record<string, unknown> | null = null;

  private slideInRef = inject(SlideInRef, { optional: true }) as SlideInRef<unknown, unknown> | null;
  private errorHandler = inject(FormErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);

  get isEdit(): boolean {
    return this.editData() != null;
  }

  ngOnInit(): void {
    if (this.slideInRef) {
      this.slideInRef.requireConfirmationWhen(() => of(this.formGroup().dirty));
    }

    const data = this.editData();
    if (data != null) {
      this.formGroup().patchValue(data);
      this.initialSnapshot = this.formGroup().getRawValue() as Record<string, unknown>;
    }
  }

  onFormSubmit(): void {
    const allValues = this.formGroup().getRawValue() as T;
    const event: FormSubmitEvent<T> = {
      isEdit: this.isEdit,
      allValues,
      changedValues: this.getChangedValues(allValues),
    };

    const { request$, successMessage } = this.submitHandler()(event);

    this.isLoading.set(true);
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.snackbar.success(successMessage);
        this.isLoading.set(false);
        this.slideInRef?.close({ response: true });
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.errorHandler.handleValidationErrors(error, this.formGroup());
      },
    });
  }

  private getChangedValues(current: T): Partial<T> {
    if (!this.initialSnapshot) {
      return { ...current };
    }

    const changed: Record<string, unknown> = {};
    for (const key of Object.keys(current)) {
      if (!(key in this.initialSnapshot) || !isEqual(current[key], this.initialSnapshot[key])) {
        changed[key] = current[key];
      }
    }
    return changed as Partial<T>;
  }
}
