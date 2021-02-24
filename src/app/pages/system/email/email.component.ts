import { ApplicationRef, Component, Injector, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { helptext_system_email } from 'app/helptext/system/email';
import * as _ from 'lodash';
import { DialogService, RestService, WebSocketService, AppLoaderService } from '../../../services/';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { T } from 'app/translate-marker';
import { FieldSets } from 'app/pages/common/entity/entity-form/classes/field-sets';
import { BehaviorSubject, Subscription } from 'rxjs';
import { FormControl } from '@angular/forms';

interface OAuthData {
  client_id?: string
  client_secret?: string
  refresh_token?: string
}

@Component({
  selector : 'app-email',
  template : `
  <entity-form [conf]="this"></entity-form>
  `
})
export class EmailComponent implements OnDestroy {
  queryCall = 'mail.config';
  updateCall = 'mail.update';
  public entityEdit: any;
  public rootEmail: string;
  private oauthCreds: BehaviorSubject<OAuthData> = new BehaviorSubject({});
  customSubmit = this.saveConfigSubmit;
  public custActions: Array < any > = [{
    id: 'send_mail',
    name: T('Send Test Mail'),
    function: () => {
      if (this.rootEmail){
        const value = _.cloneDeep(this.entityEdit.formGroup.value);
        if(!value.send_mail_method) {
          delete value.pass;
          value.smtp = false;
          value.oauth = this.oauthCreds.getValue();
        } else {
          delete value.oauth;
        }
        delete value.send_mail_method;
        delete value.oauth_applied;

        const product_type = window.localStorage.getItem('product_type');
        const mailObj = {
          "subject" : "TrueNAS Test Message",
          "text" : `This is a test message from TrueNAS ${product_type}.`,
        }
        this.ws.call('system.info').subscribe(sysInfo => {
          value.pass = value.pass || this.entityEdit.data.pass

          mailObj['subject'] += " hostname: " + sysInfo['hostname'];
          this.dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": "EMAIL" }, disableClose: true });
          this.dialogRef.componentInstance.setCall('mail.send', [mailObj, value]);
          this.dialogRef.componentInstance.submit();
          this.dialogRef.componentInstance.success.subscribe((s_res)=>{
            this.dialogRef.close(false);
            this.dialogservice.Info(T("Email"), T("Test email sent!"))
          });
          this.dialogRef.componentInstance.failure.subscribe((e_res) => {
            this.dialogRef.componentInstance.setDescription(e_res.error);
          });
        });
      }
      else{
        this.dialogservice.Info(T("email"), T("Configure the root user email address."));
      }
    }
  }
];

  public fieldSets = new FieldSets([
    {
      name: helptext_system_email.fieldsets.general,
      label: true,
      config: [
        {
          type : 'input',
          name : 'fromemail',
          placeholder : helptext_system_email.fromemail.placeholder,
          tooltip : helptext_system_email.fromemail.tooltip,
          validation: helptext_system_email.fromemail.validation,
          required: true
        },
        {
          type : 'input',
          name : 'fromname',
          placeholder : helptext_system_email.fromname.placeholder,
          tooltip : helptext_system_email.fromname.tooltip,
        },
        {
          type: 'radio',
          name: 'send_mail_method',
          onChange: data => {
            this.sendMailMethod.setValue(data.event.value);
          },
          placeholder: helptext_system_email.send_mail_method.placeholder,
          options: [
            {label: helptext_system_email.send_mail_method.smtp.placeholder,
             name: 'smtp',
             tooltip: helptext_system_email.send_mail_method.smtp.tooltip,
             value: true},
            {label: helptext_system_email.send_mail_method.gmail.placeholder,
             name: 'gmail',
             tooltip: helptext_system_email.send_mail_method.gmail.tooltip,
             value: false},
          ],
          value: true
        },
        {
          type : 'input',
          name : 'outgoingserver',
          placeholder : helptext_system_email.outgoingserver.placeholder,
          tooltip : helptext_system_email.outgoingserver.tooltip,
        },
        {
          type : 'input',
          name : 'port',
          inputType: 'number',
          validation: helptext_system_email.port.validation,
          required: true,
          placeholder : helptext_system_email.port.placeholder,
          tooltip : helptext_system_email.port.tooltip,
        },
        {
          type : 'select',
          name : 'security',
          placeholder : helptext_system_email.security.placeholder,
          tooltip : helptext_system_email.security.tooltip,
          options : [
            {label : T('Plain (No Encryption)'), value : 'PLAIN'},
            {label : T('SSL (Implicit TLS)'), value : 'SSL'},
            {label : T('TLS (STARTTLS)'), value : 'TLS'},
          ]
        },
        {
          type: 'checkbox',
          name: 'smtp',
          onChange: (data: any) => {
            this.smtp.setValue(data.event.checked);
          },
          placeholder: helptext_system_email.auth.smtp.placeholder,
          tooltip: helptext_system_email.auth.smtp.tooltip,
          value: false,
        },
        {
          type: 'input',
          name: 'user',
          placeholder: helptext_system_email.user.placeholder,
          tooltip: helptext_system_email.user.tooltip,
          required: true,
          validation: helptext_system_email.user.validation,
        },
        {
          type: 'input',
          name: 'pass',
          placeholder: helptext_system_email.pass.placeholder,
          tooltip: helptext_system_email.pass.tooltip,
          inputType: 'password',
          togglePw: true,
          validation: helptext_system_email.pass.validation,
        },
        {
          type: 'paragraph',
          name: 'oauth_applied',
          paraText: 'Oauth credentials have been applied.',
          isLargeText: true,
          paragraphIcon: 'check_circle',
          paragraphIconSize: '24px',
          isHidden: true
        },
        {
          type: 'paragraph',
          name: 'oauth_not_applied',
          paraText: 'Log in to Gmail to set up Oauth credentials.',
          paragraphIcon: 'info',
          paragraphIconSize: '24px',
          isLargeText: true,
          validation: helptext_system_email.user.validation,
          isHidden: true
        },
        {
          type: 'button',
          name: 'login-gmail',
          customEventActionLabel: helptext_system_email.auth.login_button,
          customEventMethod: () => {
            const self = this;
            const dialogService = this.dialogservice;

            window.open("https://freenas.org/oauth/gmail?origin=" +
              encodeURIComponent(window.location.toString()), "_blank", "width=640,height=480");
            window.addEventListener("message", doAuth, false);

            function doAuth(message) {
              if (message.data.oauth_portal) {
                if (message.data.error) {
                  dialogService.errorReport(T('Error'), message.data.error);
                } else {
                  self.oauthCreds.next(message.data.result);
                  self.checkForOauthCreds();
                }
              }
              window.removeEventListener("message", doAuth);
            }
          }
        }
      ]
    },
    { name: 'divider', divider: true }
  ]);

  protected dialogRef: any;

  private sendMailMethod: FormControl;
  private sendMailMethodSubscription: Subscription;
  private smtpSubscription: Subscription;
  private smtp: FormControl;
  private pass: FieldConfig;

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService, protected _injector: Injector,
              protected _appRef: ApplicationRef,private dialogservice: DialogService,
              protected dialog: MatDialog, protected loader: AppLoaderService
            ) {}

  resourceTransformIncomingRestData(data): void {
    if(_.isEmpty(data.oauth)) {
      this.sendMailMethod.setValue(true);
    } else {
      this.sendMailMethod.setValue(false);
    }
    this.oauthCreds.next(data.oauth);
    delete data.pass;
    return data;
  }

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
    const payload = [];
    payload.push("username");
    payload.push("=");
    payload.push("root");
    this.ws.call('user.query', [[payload]]).subscribe((res)=>{
      this.rootEmail = res[0].email;
    });
    this.pass = this.fieldSets.config('pass');
    this.smtp = entityEdit.formGroup.controls['smtp'];
    this.sendMailMethod = entityEdit.formGroup.controls['send_mail_method'];
    
    this.oauthCreds.subscribe(value => {
      this.sendMailMethod.setValue(!value.client_id);
    });


    this.sendMailMethodSubscription = this.sendMailMethod.valueChanges.subscribe((value) => {
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
    this.smtpSubscription = this.smtp.valueChanges.subscribe((value) => {
      this.toggleSmtpAuthControls();
    })
  }

  checkForOauthCreds() {
    if (this.oauthCreds.getValue().client_id) {
      this.entityEdit.setDisabled('oauth_applied', false, false);
      this.entityEdit.setDisabled('oauth_not_applied', true, true);
    } else {
      this.entityEdit.setDisabled('oauth_applied', true, true);
      this.entityEdit.setDisabled('oauth_not_applied', false, false);
    }
  }

  toggleSmtpAuthControls() {
    this.entityEdit.setDisabled('user', !this.sendMailMethod.value || !this.smtp.value, !this.sendMailMethod.value || !this.smtp.value);
    this.entityEdit.setDisabled('pass', !this.sendMailMethod.value || !this.smtp.value, !this.sendMailMethod.value || !this.smtp.value);
  }
  toggleSmtpControls() {
    this.entityEdit.setDisabled('outgoingserver', !this.sendMailMethod.value, !this.sendMailMethod.value);
    this.entityEdit.setDisabled('port', !this.sendMailMethod.value, !this.sendMailMethod.value);
    this.entityEdit.setDisabled('security', !this.sendMailMethod.value, !this.sendMailMethod.value);
    this.entityEdit.setDisabled('smtp', false, !this.sendMailMethod.value);
    this.entityEdit.setDisabled('login-gmail', this.sendMailMethod.value, this.sendMailMethod.value);
  }

  ngOnDestroy() {
    this.sendMailMethodSubscription.unsubscribe();
    this.smtpSubscription.unsubscribe();
  }

  saveConfigSubmit(emailConfig): void {
    this.loader.open();
    const is_smtp_method = this.sendMailMethod.value;

    if (emailConfig.pass && typeof emailConfig.pass === 'string' && emailConfig.pass.trim() === '') {
      delete emailConfig.pass;
    }
    if (this.oauthCreds.getValue().client_id) {
      let oauth = {
        client_id: this.oauthCreds.getValue().client_id,
        client_secret: this.oauthCreds.getValue().client_secret,
        refresh_token: this.oauthCreds.getValue().refresh_token,
      };
      emailConfig.oauth = oauth;

      if (!is_smtp_method) {
        // switches from SMTP to Gmail Oauth method and disable smtp
        emailConfig.smtp = false;
        this.smtp.setValue(false);
      }
    } else {
      emailConfig.oauth = null;
    }

    if (is_smtp_method) {
      // switches from Gmail Oauth to SMTP method and remove oauth data
      emailConfig.oauth = null;
      this.oauthCreds.next({});
    }


    if (emailConfig.oauth_applied) {
      delete emailConfig.oauth_applied
    }

    if (emailConfig.oauth_not_applied) {
      delete emailConfig.oauth_not_applied
    }

    if (emailConfig.hasOwnProperty('send_mail_method')) {
      delete emailConfig.send_mail_method;
    }

    this.ws
      .call(this.updateCall, [emailConfig])
      .subscribe(
        () => {
          this.entityEdit.success = true;
          this.entityEdit.formGroup.markAsPristine();
        },
        error => {
          this.loader.close();
          new EntityUtils().handleWSError(this, error, this.dialogservice)
        },
        () => this.loader.close()
      );
  }
}
