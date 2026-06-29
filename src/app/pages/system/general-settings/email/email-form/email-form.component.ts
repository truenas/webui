import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, OnInit, signal, inject, input, output, viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl, Validators, ReactiveFormsModule, NonNullableFormBuilder,
} from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent,
  TnIconComponent, TnInputComponent, TnSelectComponent, InputType,
} from '@truenas/ui-components';
import { EMPTY, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { MailSecurity } from 'app/enums/mail-security.enum';
import { Role } from 'app/enums/role.enum';
import { helptextSystemEmail } from 'app/helptext/system/email';
import {
  MailConfig, MailConfigUpdate, MailOauthConfig, MailSendMethod,
} from 'app/interfaces/mail-config.interface';
import { OauthButtonType } from 'app/modules/buttons/oauth-button/interfaces/oauth-button.interface';
import { OauthButtonComponent } from 'app/modules/buttons/oauth-button/oauth-button.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  FormSubmitEvent,
  IxFormComponent,
  SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { emailValidator } from 'app/modules/forms/ix-forms/validators/email-validation/email-validation';
import { portRangeValidator } from 'app/modules/forms/ix-forms/validators/range-validation/range-validation';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { AppState } from 'app/store';
import { selectProductType } from 'app/store/system-info/system-info.selectors';

@Component({
  selector: 'ix-email-form',
  templateUrl: './email-form.component.html',
  styleUrls: ['./email-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    IxFormComponent,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    IxRadioGroupComponent,
    TnInputComponent,
    TnSelectComponent,
    TnCheckboxComponent,
    TnIconComponent,
    TnButtonComponent,
    OauthButtonComponent,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class EmailFormComponent implements OnInit {
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private formBuilder = inject(NonNullableFormBuilder);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private validatorService = inject(IxValidatorsService);
  private snackbar = inject(SnackbarService);
  private store$ = inject(Store<AppState>);
  private destroyRef = inject(DestroyRef);

  readonly config = input<MailConfig | undefined>(undefined);

  readonly closed = output<boolean>();

  private readonly ixForm = viewChild(IxFormComponent);

  private productType = toSignal(this.store$.select(selectProductType));

  protected readonly InputType = InputType;
  readonly requiredRoles = [Role.AlertWrite];
  protected readonly requiredRolesMailWrite = [Role.MailWrite];

  sendMethodControl = new FormControl(MailSendMethod.Smtp, { nonNullable: true });

  form = this.formBuilder.group({
    fromemail: ['', [emailValidator()]],
    fromname: [''],
    outgoingserver: [''],
    port: [null as number | null, [
      this.validatorService.validateOnCondition(
        (control) => !!control.parent && this.isSmtp() && this.hasSmtpAuthentication,
        Validators.required,
      ),
      portRangeValidator(),
    ]],
    security: [MailSecurity.Plain],
    smtp: [false],
    user: [''],
    pass: [''],
  });

  protected isLoading = signal(false);
  protected emailConfig: MailConfig | undefined;

  readonly sendMethodOptions$ = of([
    {
      label: helptextSystemEmail.sendMailMethod.smtp.label,
      value: MailSendMethod.Smtp,
    },
    {
      label: helptextSystemEmail.sendMailMethod.gmail.label,
      value: MailSendMethod.Gmail,
    },
    {
      label: helptextSystemEmail.sendMailMethod.outlook.label,
      value: MailSendMethod.Outlook,
    },
  ]);

  readonly securityOptions$ = of([
    { label: this.translate.instant('Plain (No Encryption)'), value: MailSecurity.Plain },
    { label: this.translate.instant('SSL (Implicit TLS)'), value: MailSecurity.Ssl },
    { label: this.translate.instant('TLS (STARTTLS)'), value: MailSecurity.Tls },
  ]);

  readonly helptext = helptextSystemEmail;

  private oauthCredentials = signal<MailOauthConfig | Record<string, never>>({});
  private sendMethod = toSignal(this.sendMethodControl.valueChanges, {
    initialValue: this.sendMethodControl.value,
  });

  protected isSmtp = computed(() => this.sendMethod() === MailSendMethod.Smtp);

  protected hasOauthAuthorization = computed(() => {
    const creds = this.oauthCredentials();
    return !!(creds as MailOauthConfig)?.client_id
      && this.sendMethod() === (creds as MailOauthConfig).provider;
  });

  protected extraDisabled = computed(() => !this.isSmtp() && !this.hasOauthAuthorization());

  get oauthType(): OauthButtonType | undefined {
    switch (this.sendMethod()) {
      case MailSendMethod.Gmail:
        return OauthButtonType.Gmail;
      case MailSendMethod.Outlook:
        return OauthButtonType.Outlook;
      default:
        return undefined;
    }
  }

  get oauthUrl(): string | undefined {
    switch (this.sendMethod()) {
      case MailSendMethod.Gmail:
        return 'https://truenas.com/oauth/gmail?origin=';
      case MailSendMethod.Outlook:
        return 'https://www.truenas.com/oauth/outlook?origin=';
      default:
        return undefined;
    }
  }

  constructor() {
    this.sendMethodControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.form.controls.port.updateValueAndValidity();
    });

    this.form.controls.smtp.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.form.controls.port.updateValueAndValidity();
    });
  }

  get hasSmtpAuthentication(): boolean {
    return Boolean(this.form.controls.smtp.value);
  }

  get isFromEmailRequired(): boolean {
    return this.isSmtp() || this.sendMethod() === MailSendMethod.Outlook;
  }

  get isValid(): boolean {
    return !this.isSmtp() ? this.hasOauthAuthorization() && this.form.valid : this.form.valid;
  }

  ngOnInit(): void {
    if (this.emailConfig) {
      this.initEmailForm(this.emailConfig);
    } else {
      this.loadEmailConfig();
    }
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

  protected handleSubmit = (_: FormSubmitEvent): SubmitResult => ({
    request$: this.api.call('mail.update', [this.prepareConfigUpdate()]),
    successMessage: this.translate.instant('Email settings updated.'),
    closeWith: () => true,
  });

  protected onSendTestEmailPressed(): void {
    this.api.call('mail.local_administrator_email')
      .pipe(
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((email) => {
        if (!email) {
          this.dialogService.info(
            this.translate.instant('Email'),
            this.translate.instant('No e-mail address is set for root user or any other local administrator. Please, configure such an email address first.'),
          );
          // TODO: Consider taking user to the user edit page
          return;
        }

        this.sendTestEmail();
      });
  }

  protected onLoggedIn(credentials: unknown): void {
    this.oauthCredentials.set(credentials as MailOauthConfig);
  }

  private loadEmailConfig(): void {
    this.isLoading.set(true);
    this.api.call('mail.config').pipe(
      catchError((error: unknown) => {
        this.errorHandler.showErrorModal(error);
        this.isLoading.set(false);
        return EMPTY;
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((config) => {
      this.isLoading.set(false);
      this.initEmailForm(config);
    });
  }

  private initEmailForm(emailConfig: MailConfig): void {
    this.form.patchValue(emailConfig);

    if (emailConfig.oauth?.client_id) {
      this.sendMethodControl.setValue(emailConfig.oauth?.provider);
      this.oauthCredentials.set(emailConfig.oauth);
    }
  }

  private sendTestEmail(): void {
    const productType = this.productType();
    const email = {
      subject: 'Test Message',
      text: `This is a test message from TrueNAS ${productType.replace('_', ' ')}.`,
    };
    const config = this.prepareConfigUpdate();

    this.dialogService.jobDialog(
      this.api.job('mail.send', [email, config]),
      { title: this.translate.instant('Email') },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Test email sent.'));
      });
  }

  private prepareConfigUpdate(): MailConfigUpdate {
    let update: MailConfigUpdate;
    if (this.isSmtp()) {
      update = {
        ...this.form.value,
        oauth: null,
      } as MailConfigUpdate;

      if (!this.hasSmtpAuthentication) {
        delete update.user;
        delete update.pass;
      }
    } else {
      update = {
        fromemail: this.form.getRawValue().fromemail,
        fromname: this.form.getRawValue().fromname,
        oauth: {
          ...this.oauthCredentials() as MailOauthConfig,
          provider: this.sendMethod(),
        },
      };

      if (this.sendMethod() === MailSendMethod.Outlook) {
        update.outgoingserver = 'smtp-mail.outlook.com';
        update.port = 587;
        update.security = MailSecurity.Tls;
      }
    }

    return update;
  }
}
