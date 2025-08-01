import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, signal, inject } from '@angular/core';
import {
  FormBuilder, FormControl, Validators, ReactiveFormsModule,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { forkJoin, of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextSystemSupport as helptext } from 'app/helptext/system/support';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SupportConfig, SupportConfigUpdate } from 'app/modules/feedback/interfaces/file-ticket.interface';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { emailValidator } from 'app/modules/forms/ix-forms/validators/email-validation/email-validation';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-proactive',
  templateUrl: './proactive.component.html',
  styleUrls: ['./proactive.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxCheckboxComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class ProactiveComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private errorHandler = inject(ErrorHandlerService);
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  private dialogService = inject(DialogService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private translate = inject(TranslateService);
  private snackbar = inject(SnackbarService);
  slideInRef = inject<SlideInRef<undefined, boolean>>(SlideInRef);

  protected readonly requiredRoles = [Role.SupportWrite];

  protected isLoading = signal(false);
  title = helptext.proactive.title;
  isFormDisabled = false;
  form = this.formBuilder.group({
    name: ['', [Validators.required]],
    title: ['', [Validators.required]],
    email: ['', [Validators.required, emailValidator()]],
    phone: ['', [Validators.required]],
    enabled: [false],
    secondary_name: ['', [Validators.required]],
    secondary_title: ['', [Validators.required]],
    secondary_email: ['', [Validators.required, emailValidator()]],
    secondary_phone: ['', [Validators.required]],
  });

  readonly helptext = helptext;

  constructor() {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
  }

  ngOnInit(): void {
    this.loadConfig();
  }

  protected onSubmit(): void {
    const values = this.form.value as SupportConfigUpdate;
    this.isLoading.set(true);

    this.api.call('support.update', [values])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.slideInRef.close({ response: true });

          this.snackbar.success(
            this.translate.instant(helptext.proactive.dialogMessage),
          );
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          this.formErrorHandler.handleValidationErrors(error, this.form);
          this.cdr.markForCheck();
        },
      });
  }

  private loadConfig(): void {
    this.isLoading.set(true);

    forkJoin([
      this.api.call('support.config'),
      this.api.call('support.is_available'),
      this.api.call('support.is_available_and_enabled'),
    ])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: ([config, isAvailable, isEnabled]) => {
          this.isLoading.set(false);

          if (!isAvailable) {
            this.supportUnavailable();
            return;
          }

          this.patchFormValues(config, isEnabled);
        },
        error: (error: unknown) => {
          this.isFormDisabled = true;
          this.form.disable();
          this.cdr.markForCheck();
          this.errorHandler.showErrorModal(error);
        },
      });
  }

  private supportUnavailable(): void {
    this.isFormDisabled = true;
    this.form.disable();
    this.dialogService.warn(
      helptext.proactive.dialogUnavailableTitle,
      helptext.proactive.dialogUnavailableWarning,
    );
  }

  private patchFormValues(config: Partial<SupportConfig>, isEnabled: boolean): void {
    const updateValues: Partial<SupportConfig> = {};

    Object.keys(config).forEach((key: keyof SupportConfig) => {
      const control = (this.form.controls[key as never] || {}) as FormControl;
      if (config[key] !== control.value) {
        updateValues[key] = config[key] as never;
      }
    });

    updateValues.enabled = isEnabled;

    this.form.patchValue(updateValues);
  }
}
