import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog/dialog-ref';
import { MatRadioChange } from '@angular/material/radio/radio';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { MailSecurity } from 'app/enums/mail-security.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { helptextSystemEmail } from 'app/helptext/system/email';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { MailConfig } from 'app/interfaces/mail-config.interface';
import { OauthMessage } from 'app/interfaces/oauth-message.interface';
import { FieldSets } from 'app/modules/entity/entity-form/classes/field-sets';
import { EntityFormComponent } from 'app/modules/entity/entity-form/entity-form.component';
import { FormInputConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/modules/entity/utils';
import {
  DialogService, WebSocketService, AppLoaderService,
} from 'app/services';

interface OAuthData {
  client_id?: string;
  client_secret?: string;
  refresh_token?: string;
}

@UntilDestroy()
@Component({
  selector: 'app-email',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class EmailComponent implements FormConfiguration {
  queryCall = 'mail.config' as const;
  updateCall = 'mail.update' as const;
  entityEdit: EntityFormComponent;
  rootEmail: string;
  private oauthCreds$: BehaviorSubject<OAuthData> = new BehaviorSubject({});
  customSubmit = this.saveConfigSubmit;
  custActions = [{
    id: 'send_mail',
    name: this.translate.instant('Send Test Mail'),
    function: () => {
      if (this.rootEmail) {
        const value = _.cloneDeep(this.entityEdit.formGroup.value);
        if (!value.send_mail_method) {
          delete value.pass;
          value.smtp = false;
          value.oauth = this.oauthCreds$.getValue();
        } else {
          delete value.oauth;
        }
        delete value.send_mail_method;
        delete value.oauth_applied;

        const productType = window.localStorage.getItem('product_type') as ProductType;
        const mailObj = {
          subject: 'TrueNAS Test Message',
          text: `This is a test message from TrueNAS ${productType}.`,
        };
        this.ws.call('system.info').pipe(untilDestroyed(this)).subscribe((systemInfo) => {
          value.pass = value.pass || this.entityEdit.data.pass;

          mailObj['subject'] += ' hostname: ' + systemInfo.hostname;
          this.dialogRef = this.dialog.open(EntityJobComponent, { data: { title: this.translate.instant('EMAIL') }, disableClose: true });
          this.dialogRef.componentInstance.setCall('mail.send', [mailObj, value]);
          this.dialogRef.componentInstance.submit();
          this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
            this.dialogRef.close(false);
            this.dialogservice.info(this.translate.instant('Email'), this.translate.instant('Test email sent!'), '500px', 'info');
          });
          this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((job) => {
            this.dialogRef.componentInstance.setDescription(job.error);
          });
        });
      } else {
        this.dialogservice.info(this.translate.instant('email'), this.translate.instant('Configure the root user email address.'));
      }
    },
  },
  ];

  fieldSets = new FieldSets([
    {
      name: helptextSystemEmail.fieldsets.general,
      label: true,
      config: [
        {
          type: 'radio',
          name: 'send_mail_method',
          onChange: (data: { event: MatRadioChange }) => {
            this.sendMailMethod.setValue(data.event.value);
          },
          placeholder: helptextSystemEmail.send_mail_method.placeholder,
          options: [
            {
              label: helptextSystemEmail.send_mail_method.smtp.placeholder,
              tooltip: helptextSystemEmail.send_mail_method.smtp.tooltip,
              value: true,
            },
            {
              label: helptextSystemEmail.send_mail_method.gmail.placeholder,
              tooltip: helptextSystemEmail.send_mail_method.gmail.tooltip,
              value: false,
            },
          ],
          value: true,
        },
        {
          type: 'input',
          name: 'fromemail',
          placeholder: helptextSystemEmail.fromemail.placeholder,
          tooltip: helptextSystemEmail.fromemail.tooltip,
          validation: helptextSystemEmail.fromemail.validation,
          required: true,
        },
        {
          type: 'input',
          name: 'fromname',
          placeholder: helptextSystemEmail.fromname.placeholder,
          tooltip: helptextSystemEmail.fromname.tooltip,
        },
        {
          type: 'input',
          name: 'outgoingserver',
          placeholder: helptextSystemEmail.outgoingserver.placeholder,
          tooltip: helptextSystemEmail.outgoingserver.tooltip,
        },
        {
          type: 'input',
          name: 'port',
          inputType: 'number',
          validation: helptextSystemEmail.port.validation,
          required: true,
          placeholder: helptextSystemEmail.port.placeholder,
          tooltip: helptextSystemEmail.port.tooltip,
        },
        {
          type: 'select',
          name: 'security',
          placeholder: helptextSystemEmail.security.placeholder,
          tooltip: helptextSystemEmail.security.tooltip,
          options: [
            { label: this.translate.instant('Plain (No Encryption)'), value: MailSecurity.Plain },
            { label: this.translate.instant('SSL (Implicit TLS)'), value: MailSecurity.Ssl },
            { label: this.translate.instant('TLS (STARTTLS)'), value: MailSecurity.Tls },
          ],
        },
        {
          type: 'checkbox',
          name: 'smtp',
          onChange: (data: { event: MatCheckboxChange }) => {
            this.smtp.setValue(data.event.checked);
          },
          placeholder: helptextSystemEmail.auth.smtp.placeholder,
          tooltip: helptextSystemEmail.auth.smtp.tooltip,
          value: false,
        },
        {
          type: 'input',
          name: 'user',
          placeholder: helptextSystemEmail.user.placeholder,
          tooltip: helptextSystemEmail.user.tooltip,
          required: true,
          validation: helptextSystemEmail.user.validation,
        },
        {
          type: 'input',
          name: 'pass',
          placeholder: helptextSystemEmail.pass.placeholder,
          tooltip: helptextSystemEmail.pass.tooltip,
          inputType: 'password',
          togglePw: true,
          validation: helptextSystemEmail.pass.validation,
        },
        {
          type: 'paragraph',
          name: 'oauth_applied',
          paraText: 'Gmail credentials have been applied.',
          isLargeText: true,
          paragraphIcon: 'check_circle',
          paragraphIconSize: '24px',
          isHidden: true,
        },
        {
          type: 'paragraph',
          name: 'oauth_not_applied',
          paraText: 'Log in to Gmail to set up Oauth credentials.',
          paragraphIcon: 'info',
          paragraphIconSize: '24px',
          isLargeText: true,
          validation: helptextSystemEmail.user.validation,
          isHidden: true,
        },
        {
          type: 'button',
          name: 'login-gmail',
          customEventActionLabel: helptextSystemEmail.auth.login_button,
          customEventMethod: () => {
            const dialogService = this.dialogservice;

            window.open('https://freenas.org/oauth/gmail?origin='
              + encodeURIComponent(window.location.toString()), '_blank', 'width=640,height=480');

            const doAuth = (message: OauthMessage<OAuthData>): void => {
              if (message.data.oauth_portal) {
                if (message.data.error) {
                  dialogService.errorReport(this.translate.instant('Error'), message.data.error);
                } else {
                  this.oauthCreds$.next(message.data.result);
                  this.checkForOauthCreds();
                }
              }
              window.removeEventListener('message', doAuth);
            };
            window.addEventListener('message', doAuth, false);
          },
        },
      ],
    },
    { name: 'divider', divider: true },
  ]);

  protected dialogRef: MatDialogRef<EntityJobComponent>;

  private sendMailMethod: FormControl;
  private smtp: FormControl;
  private pass: FormInputConfig;

  constructor(
    private ws: WebSocketService,
    private dialogservice: DialogService,
    private dialog: MatDialog,
    private loader: AppLoaderService,
    private translate: TranslateService,
  ) {}

  resourceTransformIncomingRestData(data: MailConfig): MailConfig {
    if (_.isEmpty(data.oauth)) {
      this.sendMailMethod.setValue(true);
    } else {
      this.sendMailMethod.setValue(false);
    }
    this.oauthCreds$.next(data.oauth);
    delete data.pass;
    return data;
  }

  afterInit(entityEdit: EntityFormComponent): void {
    this.entityEdit = entityEdit;
    this.ws.call('user.query', [[['username', '=', 'root']]]).pipe(untilDestroyed(this)).subscribe((res) => {
      this.rootEmail = res[0].email;
    });
    this.pass = this.fieldSets.config('pass') as FormInputConfig;
    this.smtp = entityEdit.formGroup.controls['smtp'] as FormControl;
    this.sendMailMethod = entityEdit.formGroup.controls['send_mail_method'] as FormControl;

    this.oauthCreds$.pipe(untilDestroyed(this)).subscribe((value) => {
      this.sendMailMethod.setValue(!value.client_id);
    });

    this.sendMailMethod.valueChanges.pipe(untilDestroyed(this)).subscribe((value) => {
      this.toggleSmtpControls();
      this.toggleSmtpAuthControls();
      this.pass.hideButton = !value;

      if (!value) {
        this.checkForOauthCreds();
      } else {
        entityEdit.setDisabled('oauth_applied', true, true);
        entityEdit.setDisabled('oauth_not_applied', true, true);
      }
    });
    this.smtp.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.toggleSmtpAuthControls();
    });
  }

  checkForOauthCreds(): void {
    if (this.oauthCreds$.getValue().client_id) {
      this.entityEdit.setDisabled('oauth_applied', false, false);
      this.entityEdit.setDisabled('oauth_not_applied', true, true);
    } else {
      this.entityEdit.setDisabled('oauth_applied', true, true);
      this.entityEdit.setDisabled('oauth_not_applied', false, false);
    }
  }

  toggleSmtpAuthControls(): void {
    this.entityEdit.setDisabled('user', !this.sendMailMethod.value || !this.smtp.value, !this.sendMailMethod.value || !this.smtp.value);
    this.entityEdit.setDisabled('pass', !this.sendMailMethod.value || !this.smtp.value, !this.sendMailMethod.value || !this.smtp.value);
  }

  toggleSmtpControls(): void {
    this.entityEdit.setDisabled('fromemail', !this.sendMailMethod.value, !this.sendMailMethod.value);
    this.entityEdit.setDisabled('fromname', !this.sendMailMethod.value, !this.sendMailMethod.value);
    this.entityEdit.setDisabled('outgoingserver', !this.sendMailMethod.value, !this.sendMailMethod.value);
    this.entityEdit.setDisabled('port', !this.sendMailMethod.value, !this.sendMailMethod.value);
    this.entityEdit.setDisabled('security', !this.sendMailMethod.value, !this.sendMailMethod.value);
    this.entityEdit.setDisabled('smtp', false, !this.sendMailMethod.value);
    this.entityEdit.setDisabled('login-gmail', this.sendMailMethod.value, this.sendMailMethod.value);
  }

  saveConfigSubmit(emailConfig: any): void {
    this.loader.open();
    const isSmtpMethod = this.sendMailMethod.value;

    if (emailConfig.pass && typeof emailConfig.pass === 'string' && emailConfig.pass.trim() === '') {
      delete emailConfig.pass;
    }
    if (this.oauthCreds$.getValue().client_id) {
      const oauth = {
        client_id: this.oauthCreds$.getValue().client_id,
        client_secret: this.oauthCreds$.getValue().client_secret,
        refresh_token: this.oauthCreds$.getValue().refresh_token,
      };
      emailConfig.oauth = oauth;

      if (!isSmtpMethod) {
        // switches from SMTP to Gmail Oauth method and disable smtp
        emailConfig.smtp = false;
        emailConfig.fromemail = '';
        emailConfig.fromname = '';
        this.smtp.setValue(false);
      }
    } else {
      emailConfig.oauth = null;
    }

    if (isSmtpMethod) {
      // switches from Gmail Oauth to SMTP method and remove oauth data
      emailConfig.oauth = null;
      this.oauthCreds$.next({});
    }

    if (emailConfig.oauth_applied) {
      delete emailConfig.oauth_applied;
    }

    if (emailConfig.oauth_not_applied) {
      delete emailConfig.oauth_not_applied;
    }

    if (emailConfig.hasOwnProperty('send_mail_method')) {
      delete emailConfig.send_mail_method;
    }

    this.ws
      .call(this.updateCall, [emailConfig])
      .pipe(untilDestroyed(this)).subscribe(
        () => {
          this.entityEdit.success = true;
          this.entityEdit.formGroup.markAsPristine();
        },
        (error) => {
          this.loader.close();
          new EntityUtils().handleWsError(this, error, this.dialogservice);
        },
        () => this.loader.close(),
      );
  }
}
