import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { MailSecurity } from 'app/enums/mail-security.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextSystemEmail } from 'app/helptext/system/email';
import { GmailOauthConfig, MailConfigUpdate } from 'app/interfaces/mail-config.interface';
import { OauthMessage } from 'app/interfaces/oauth-message.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { portRangeValidator } from 'app/modules/ix-forms/validators/range-validation/range-validation';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService, SystemGeneralService, WebSocketService } from 'app/services';
import { ErrorHandlerService } from 'app/services/error-handler.service';

enum SendMethod {
  Smtp = 'smtp',
  Gmail = 'gmail',
}

@UntilDestroy()
@Component({
  templateUrl: './email.component.html',
  styleUrls: ['./email.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailComponent implements OnInit {
  sendMethodControl = new FormControl(SendMethod.Smtp);

  form = this.formBuilder.group({
    fromemail: ['', [Validators.required, Validators.email]],
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
    private errorHandler: ErrorHandlerService,
    private formErrorHandler: FormErrorHandlerService,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private matDialog: MatDialog,
    private validatorService: IxValidatorsService,
    @Inject(WINDOW) private window: Window,
    private snackbar: SnackbarService,
    private systemGeneralService: SystemGeneralService,
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
    this.loadEmailConfig();
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

  onLoginToGmailPressed(): void {
    this.window.open(
      'https://truenas.com/oauth/gmail?origin=' + encodeURIComponent(this.window.location.toString()),
      '_blank',
      'width=640,height=480',
    );

    const authenticationListener = (message: OauthMessage<GmailOauthConfig>): void => {
      if (message.data.oauth_portal) {
        if (message.data.error) {
          this.dialogService.error({
            title: this.translate.instant('Error'),
            message: message.data.error,
          });
        } else {
          this.oauthCredentials = message.data.result;
          this.cdr.markForCheck();
        }
      }
      this.window.removeEventListener('message', authenticationListener);
    };
    this.window.addEventListener('message', authenticationListener, false);
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
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.formErrorHandler.handleWsFormError(error, this.form);
        },
      });
  }

  private loadEmailConfig(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.ws.call('mail.config')
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (config) => {
          this.isLoading = false;
          this.form.patchValue(config);
          if (config.oauth?.client_id) {
            this.sendMethodControl.setValue(SendMethod.Gmail);
            this.oauthCredentials = config.oauth;
          }
          this.cdr.markForCheck();
        },
        error: (error: WebsocketError) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.dialogService.error(this.errorHandler.parseWsError(error));
        },
      });
  }

  private sendTestEmail(): void {
    const productType = this.systemGeneralService.getProductType();
    const email = {
      subject: 'Test Message',
      text: `This is a test message from TrueNAS ${productType}.`,
    };
    const config = this.prepareConfigUpdate();

    const dialogRef = this.matDialog.open(EntityJobComponent, {
      data: {
        title: this.translate.instant('Email'),
      },
      disableClose: true,
    });
    dialogRef.componentInstance.setCall('mail.send', [email, config]);
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.close(false);
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
