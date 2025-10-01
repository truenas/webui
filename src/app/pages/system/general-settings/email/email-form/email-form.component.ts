import { ChangeDetectionStrategy, Component, OnInit, signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl, Validators, ReactiveFormsModule, NonNullableFormBuilder,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
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
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { emailValidator } from 'app/modules/forms/ix-forms/validators/email-validation/email-validation';
import { portRangeValidator } from 'app/modules/forms/ix-forms/validators/range-validation/range-validation';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { AppState } from 'app/store';
import { selectProductType } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-email-form',
  templateUrl: './email-form.component.html',
  styleUrls: ['./email-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxRadioGroupComponent,
    IxInputComponent,
    IxSelectComponent,
    IxCheckboxComponent,
    IxIconComponent,
    OauthButtonComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class EmailFormComponent implements OnInit {
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private formBuilder = inject(NonNullableFormBuilder);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private validatorService = inject(IxValidatorsService);
  private snackbar = inject(SnackbarService);
  private systemGeneralService = inject(SystemGeneralService);
  private store$ = inject(Store<AppState>);
  slideInRef = inject<SlideInRef<MailConfig | undefined, boolean>>(SlideInRef);

  private productType = toSignal(this.store$.select(selectProductType));

  protected readonly requiredRoles = [Role.AlertWrite];

  sendMethodControl = new FormControl(MailSendMethod.Smtp, { nonNullable: true });

  form = this.formBuilder.group({
    fromemail: ['', [emailValidator()]],
    fromname: [''],
    outgoingserver: [''],
    port: [null as number | null, [
      this.validatorService.validateOnCondition(
        (control) => !!control.parent && this.isSmtp && this.hasSmtpAuthentication,
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

  private oauthCredentials: MailOauthConfig | Record<string, never>;

  get oauthType(): OauthButtonType | undefined {
    switch (this.sendMethodControl.value) {
      case MailSendMethod.Gmail:
        return OauthButtonType.Gmail;
      case MailSendMethod.Outlook:
        return OauthButtonType.Outlook;
      default:
        return undefined;
    }
  }

  get oauthUrl(): string | undefined {
    switch (this.sendMethodControl.value) {
      case MailSendMethod.Gmail:
        return 'https://truenas.com/oauth/gmail?origin=';
      case MailSendMethod.Outlook:
        return 'https://www.truenas.com/oauth/outlook?origin=';
      default:
        return undefined;
    }
  }

  constructor() {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
    this.emailConfig = this.slideInRef.getData();
  }

  get hasSmtpAuthentication(): boolean {
    return Boolean(this.form.controls.smtp.value);
  }

  get isSmtp(): boolean {
    return this.sendMethodControl.value === MailSendMethod.Smtp;
  }

  get isFromEmailRequired(): boolean {
    return this.isSmtp || this.sendMethodControl.value === MailSendMethod.Outlook;
  }

  get hasOauthAuthorization(): boolean {
    return !!this.oauthCredentials?.client_id && this.sendMethodControl.value === this.oauthCredentials.provider;
  }

  get isValid(): boolean {
    return !this.isSmtp ? this.hasOauthAuthorization && this.form.valid : this.form.valid;
  }

  ngOnInit(): void {
    if (this.emailConfig) {
      this.initEmailForm(this.emailConfig);
    }
  }

  protected onSendTestEmailPressed(): void {
    this.api.call('mail.local_administrator_email')
      .pipe(
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
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
    this.oauthCredentials = credentials as MailOauthConfig;
  }

  protected onSubmit(): void {
    this.isLoading.set(true);
    const update = this.prepareConfigUpdate();

    this.api.call('mail.update', [update])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.snackbar.success(this.translate.instant('Email settings updated.'));
          this.slideInRef.close({ response: true });
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          this.formErrorHandler.handleValidationErrors(error, this.form);
        },
      });
  }

  private initEmailForm(emailConfig: MailConfig): void {
    this.form.patchValue(emailConfig);

    if (emailConfig.oauth?.client_id) {
      this.sendMethodControl.setValue(emailConfig.oauth?.provider);
      this.oauthCredentials = emailConfig.oauth;
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
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Test email sent.'));
      });
  }

  private prepareConfigUpdate(): MailConfigUpdate {
    let update: MailConfigUpdate;
    if (this.isSmtp) {
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
          ...this.oauthCredentials as MailOauthConfig,
          provider: this.sendMethodControl.value,
        },
      };

      if (this.sendMethodControl.value === MailSendMethod.Outlook) {
        update.outgoingserver = 'smtp-mail.outlook.com';
        update.port = 587;
        update.security = MailSecurity.Tls;
      }
    }

    return update;
  }
}
