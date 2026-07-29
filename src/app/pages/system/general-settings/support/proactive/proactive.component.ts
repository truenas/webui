import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal, inject, output, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder, FormControl, Validators, ReactiveFormsModule,
} from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TnCheckboxComponent, TnFormSectionComponent, TnFormFieldComponent, TnInputComponent } from '@truenas/ui-components';
import { forkJoin } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { helptextSystemSupport as helptext } from 'app/helptext/system/support';
import { SupportConfig, SupportConfigUpdate } from 'app/modules/feedback/interfaces/file-ticket.interface';
import {
  FormSubmitEvent,
  IxFormComponent,
  SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { WarningComponent } from 'app/modules/forms/ix-forms/components/warning/warning.component';
import { emailValidator } from 'app/modules/forms/ix-forms/validators/email-validation/email-validation';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-proactive',
  templateUrl: './proactive.component.html',
  styleUrls: ['./proactive.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxFormComponent,
    ReactiveFormsModule,
    TnFormFieldComponent,
    TnInputComponent,
    TnCheckboxComponent,
    WarningComponent,
    TranslateModule,
    TnFormSectionComponent,
  ],
})
export class ProactiveComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private errorHandler = inject(ErrorHandlerService);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  readonly closed = output<boolean>();

  private readonly ixForm = viewChild(IxFormComponent);

  readonly requiredRoles = [Role.SupportWrite];
  protected dataLoading = signal(false);
  protected isSupportUnavailable = signal(false);
  protected readonly initialFormSnapshot = signal<Partial<SupportConfigUpdate> | null>(null);

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

  ngOnInit(): void {
    this.loadConfig();
  }

  canSubmit(): boolean {
    return this.ixForm()?.canSubmit() ?? false;
  }

  submit(): void {
    this.ixForm()?.submit();
  }

  hasUnsavedChanges(): boolean {
    return this.ixForm()?.hasUnsavedChanges() ?? false;
  }

  protected handleSubmit = (event: FormSubmitEvent<SupportConfigUpdate>): SubmitResult => ({
    request$: this.api.call('support.update', [event.allValues]),
    successMessage: this.translate.instant(helptext.proactive.dialogMessage),
    closeWith: () => true,
  });

  private loadConfig(): void {
    this.dataLoading.set(true);

    forkJoin([
      this.api.call('support.config'),
      this.api.call('support.is_available'),
      this.api.call('support.is_available_and_enabled'),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([config, isAvailable, isEnabled]) => {
          this.dataLoading.set(false);

          if (!isAvailable) {
            this.supportUnavailable();
            return;
          }

          this.patchFormValues(config, isEnabled);
        },
        error: (error: unknown) => {
          this.dataLoading.set(false);
          this.supportUnavailable();
          this.errorHandler.showErrorModal(error);
        },
      });
  }

  private supportUnavailable(): void {
    this.isSupportUnavailable.set(true);
    this.form.disable();
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
    this.initialFormSnapshot.set(this.form.getRawValue() as Partial<SupportConfigUpdate>);
  }
}
