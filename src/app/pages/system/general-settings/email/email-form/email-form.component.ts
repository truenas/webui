import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import {
  FormBuilder, FormControl, Validators, ReactiveFormsModule,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { MailSecurity } from 'app/enums/mail-security.enum';
import { Role } from 'app/enums/role.enum';
import { helptextSystemEmail } from 'app/helptext/system/email';
import { GmailOauthConfig, MailConfig, MailConfigUpdate } from 'app/interfaces/mail-config.interface';
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
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebSocketService } from 'app/services/ws.service';

enum SendMethod {
  Smtp = 'smtp',
  Gmail = 'gmail',
}

@UntilDestroy()
@Component({
  selector: 'ix-email-form',
  templateUrl: './email-form.component.html',
  styleUrls: ['./email-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
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
  protected readonly requiredRoles = [Role.FullAdmin];

  sendMethodControl = new FormControl(SendMethod.Smtp);

  form = this.formBuilder.group({
    fromemail: ['', [Validators.required, emailValidator()]],
    fromname: [''],
    outgoingserver: [''],
    port: [null as number, [
      this.validatorService.validateOnCondition(
        (control) => control.parent && this.isSmtp && this.hasSmtpAuthentication,
        Validators.required,
      ),
      portRangeValidator(),
    ]],
    security: [MailSecurity.Plain],
    smtp: [false],
    user: [''],
    pass: [''],
  });

  isLoading = false;

  readonly oauthType = OauthButtonType;
  readonly sendMethodOptions$ = of([
    {
      label: helptextSystemEmail.send_mail_method.smtp.placeholder,
      tooltip: this.translate.instant(helptextSystemEmail.send_mail_method.smtp.tooltip),
      value: SendMethod.Smtp,
    },
    {
      label: helptextSystemEmail.send_mail_method.gmail.placeholder,
      tooltip: this.translate.instant(helptextSystemEmail.send_mail_method.gmail.tooltip),
      value: SendMethod.Gmail,
    },
  ]);

  readonly securityOptions$ = of([
    { label: this.translate.instant('Plain (No Encryption)'), value: MailSecurity.Plain },
    { label: this.translate.instant('SSL (Implicit TLS)'), value: MailSecurity.Ssl },
    { label: this.translate.instant('TLS (STARTTLS)'), value: MailSecurity.Tls },
  ]);

  readonly helptext = helptextSystemEmail;

  private oauthCredentials: GmailOauthConfig | Record<string, never>;

  constructor(
    private ws: WebSocketService,
    private dialogService: DialogService,
    private formErrorHandler: FormErrorHandlerService,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private validatorService: IxValidatorsService,
    private snackbar: SnackbarService,
    private systemGeneralService: SystemGeneralService,
    private slideInRef: SlideInRef<EmailFormComponent>,
    @Inject(SLIDE_IN_DATA) private emailConfig: MailConfig,
  ) {}

  get hasSmtpAuthentication(): boolean {
    return this.form.controls.smtp.value;
  }

  get isSmtp(): boolean {
    return this.sendMethodControl.value === SendMethod.Smtp;
  }

  get hasOauthAuthorization(): boolean {
    return Boolean(this.oauthCredentials?.client_id);
  }

  get isValid(): boolean {
    return this.isSmtp
      ? this.form.valid
      : this.hasOauthAuthorization;
  }

  ngOnInit(): void {
    if (this.emailConfig) {
      this.initEmailForm();
    }
  }

  onSendTestEmailPressed(): void {
    this.ws.call('mail.local_administrator_email').pipe(untilDestroyed(this)).subscribe((email) => {
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

  onLoggedIn(credentials: unknown): void {
    this.oauthCredentials = credentials as GmailOauthConfig;
  }

  onSubmit(): void {
    this.isLoading = true;
    const update = this.prepareConfigUpdate();

    this.ws.call('mail.update', [update])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.snackbar.success(this.translate.instant('Email settings updated.'));
          this.slideInRef.close(true);
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.formErrorHandler.handleWsFormError(error, this.form);
        },
      });
  }

  private initEmailForm(): void {
    this.form.patchValue(this.emailConfig);

    if (this.emailConfig?.oauth?.client_id) {
      this.sendMethodControl.setValue(SendMethod.Gmail);
      this.oauthCredentials = this.emailConfig.oauth;
    }
    this.cdr.markForCheck();
  }

  private sendTestEmail(): void {
    const productType = this.systemGeneralService.getProductType();
    const email = {
      subject: 'Test Message',
      text: `This is a test message from TrueNAS ${productType}.`,
    };
    const config = this.prepareConfigUpdate();

    this.dialogService.jobDialog(
      this.ws.job('mail.send', [email, config]),
      { title: this.translate.instant('Email') },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.catchError(),
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
        fromemail: '',
        fromname: '',
        oauth: this.oauthCredentials as GmailOauthConfig,
      };
    }

    return update;
  }
}
