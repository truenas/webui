import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { helptextSystemSupport as helptext } from 'app/helptext/system/support';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SupportConfig, SupportConfigUpdate } from 'app/modules/feedback/interfaces/file-ticket.interface';
import { IxSlideInRef } from 'app/modules/forms/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { emailValidator } from 'app/modules/forms/ix-forms/validators/email-validation/email-validation';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-proactive',
  templateUrl: './proactive.component.html',
  styleUrls: ['./proactive.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProactiveComponent implements OnInit {
  protected readonly requiredRoles = [Role.FullAdmin];

  isLoading = false;
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

  constructor(
    private formBuilder: FormBuilder,
    private errorHandler: ErrorHandlerService,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
    private slideInRef: IxSlideInRef<ProactiveComponent>,
    private formErrorHandler: FormErrorHandlerService,
    private translate: TranslateService,
    private snackbar: SnackbarService,
  ) {}

  ngOnInit(): void {
    this.loadConfig();
  }

  onSubmit(): void {
    const values = this.form.value as SupportConfigUpdate;
    this.isLoading = true;

    this.ws.call('support.update', [values])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.slideInRef.close();

          this.snackbar.success(
            this.translate.instant(helptext.proactive.dialog_mesage),
          );
        },
        error: (error: unknown) => {
          this.isLoading = false;
          this.formErrorHandler.handleWsFormError(error, this.form);
          this.cdr.markForCheck();
        },
      });
  }

  private loadConfig(): void {
    this.isLoading = true;

    forkJoin([
      this.ws.call('support.config'),
      this.ws.call('support.is_available'),
      this.ws.call('support.is_available_and_enabled'),
    ])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: ([config, isAvailable, isEnabled]) => {
          this.isLoading = false;
          this.cdr.markForCheck();

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
          this.dialogService.error(this.errorHandler.parseError(error));
        },
      });
  }

  supportUnavailable(): void {
    this.isFormDisabled = true;
    this.form.disable();
    this.dialogService.warn(
      helptext.proactive.dialog_unavailable_title,
      helptext.proactive.dialog_unavailable_warning,
    );
  }

  patchFormValues(config: Partial<SupportConfig>, isEnabled: boolean): void {
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
