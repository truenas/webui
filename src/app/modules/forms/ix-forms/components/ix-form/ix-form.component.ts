import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
   * Whether this form is in edit mode.
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

  /**
   * Optional callback invoked after the request succeeds and before
   * the slide-in closes. Use for side effects like dispatching store
   * actions. Receives the value emitted by request$.
   */
  onSuccess?: (result: unknown) => void;

  /**
   * Optional custom error handler. Return true if the error was handled
   * and the default form error handler should be skipped.
   */
  onError?: (error: unknown) => boolean;
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
 * Simple usage (auto title from addTitle/editTitle, auto-patches form with editData):
 * ```html
 * <ix-form [formGroup]="form" [editData]="existingEntity"
 *          [addTitle]="'Add Group' | translate"
 *          [editTitle]="'Edit Group' | translate"
 *          [requiredRoles]="requiredRoles" [submitHandler]="handleSubmit">
 *   <ix-fieldset [title]="'Options' | translate">
 *     <ix-input formControlName="name" [label]="'Name' | translate" />
 *   </ix-fieldset>
 * </ix-form>
 * ```
 *
 * With extra action buttons:
 * ```html
 * <ix-form [formGroup]="form" [addTitle]="'Add NFS Share' | translate" ...>
 *   <ix-fieldset>...</ix-fieldset>
 *   <button ixExtraActions mat-button (click)="toggleAdvanced()">
 *     {{ 'Advanced Options' | translate }}
 *   </button>
 * </ix-form>
 * ```
 *
 * Complex usage (form manages its own patching and async setup):
 * ```html
 * <ix-form [formGroup]="form" [initialFormSnapshot]="formSnapshot()"
 *          [externalLoading]="setupLoading()" [title]="title"
 *          [requiredRoles]="requiredRoles" [submitHandler]="handleSubmit">
 *   ...
 * </ix-form>
 * ```
 *
 * Pick one of `editData` or `initialFormSnapshot` — when both are provided
 * `initialFormSnapshot` wins and the editData auto-patch is skipped.
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
   * When provided, the form is auto-patched with this data on init.
   * For complex forms that do their own patching, use initialFormSnapshot instead.
   */
  readonly editData = input<Partial<T> | null | undefined>(null);

  /**
   * External initial snapshot for change tracking. Use this when the form
   * does its own async setup/patching. Pass the result of
   * formGroup.getRawValue() after setup is complete.
   */
  readonly initialFormSnapshot = input<Record<string, unknown> | null>(null);

  /**
   * Explicit title shown in the modal header.
   * Takes precedence over addTitle/editTitle.
   */
  readonly title = input<string>('');

  /**
   * Title for create mode (e.g. 'Add Group' | translate).
   * Used when no explicit title is set and the form is in create mode.
   */
  readonly addTitle = input<string>('');

  /**
   * Title for edit mode (e.g. 'Edit Group' | translate).
   * Used when no explicit title is set and the form is in edit mode.
   */
  readonly editTitle = input<string>('');

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
   * External loading state (e.g., during async setup). Combined with
   * internal submit loading to control the header progress bar and
   * save button disabled state.
   */
  readonly externalLoading = input(false);

  /**
   * Internal loading state – set during form submission.
   */
  readonly isSubmitting = signal(false);

  /**
   * Combined loading state – true during either external loading or submit.
   */
  readonly isLoading = computed(() => this.isSubmitting() || this.externalLoading());

  private readonly internalSnapshot = signal<Record<string, unknown> | null>(null);

  private slideInRef = inject(SlideInRef, { optional: true }) as SlideInRef<unknown, unknown> | null;
  private errorHandler = inject(FormErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);

  private readonly snapshot = computed<Record<string, unknown> | null>(() => {
    return this.initialFormSnapshot() ?? this.internalSnapshot();
  });

  readonly isEdit = computed(() => this.editData() != null || this.snapshot() != null);

  /**
   * Resolved title: explicit title wins, otherwise picks addTitle or editTitle
   * based on mode.
   */
  readonly resolvedTitle = computed(() => {
    return this.title() || (this.isEdit() ? this.editTitle() : this.addTitle());
  });

  ngOnInit(): void {
    if (this.slideInRef) {
      this.slideInRef.requireConfirmationWhen(() => of(this.formGroup().dirty));
    }

    if (this.initialFormSnapshot() != null) {
      return;
    }

    const data = this.editData();
    if (data != null) {
      this.formGroup().patchValue(data as Record<string, unknown>);
      this.internalSnapshot.set(this.formGroup().getRawValue() as Record<string, unknown>);
    }
  }

  onFormSubmit(): void {
    const allValues = this.formGroup().getRawValue() as T;
    const event: FormSubmitEvent<T> = {
      isEdit: this.isEdit(),
      allValues,
      changedValues: this.getChangedValues(allValues),
    };

    const {
      request$, successMessage, onSuccess, onError,
    } = this.submitHandler()(event);

    this.isSubmitting.set(true);
    let settled = false;
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result: unknown) => {
        if (settled) {
          return;
        }
        settled = true;
        this.snackbar.success(successMessage);
        this.isSubmitting.set(false);
        onSuccess?.(result);
        this.slideInRef?.close({ response: result ?? true });
      },
      error: (error: unknown) => {
        if (settled) {
          return;
        }
        settled = true;
        this.isSubmitting.set(false);
        if (!onError?.(error)) {
          this.errorHandler.handleValidationErrors(error, this.formGroup());
        }
      },
      complete: () => {
        if (!settled) {
          this.isSubmitting.set(false);
        }
      },
    });
  }

  private getChangedValues(current: T): Partial<T> {
    const snapshot = this.snapshot();
    if (!snapshot) {
      return { ...current };
    }

    const changed: Partial<T> = {};
    for (const key of Object.keys(current) as (keyof T)[]) {
      if (!(key as string in snapshot) || !isEqual(current[key], snapshot[key as string])) {
        changed[key] = current[key];
      }
    }
    return changed;
  }
}
