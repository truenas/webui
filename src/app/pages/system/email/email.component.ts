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
  private credentialsOauth = false;
  private oauthCreds: any;
  customSubmit = this.saveConfigSubmit;
  public custActions: Array < any > = [{
    id: 'send_mail',
    name: T('Send Test Mail'),
    function: () => {
      if (this.rootEmail){
        const value = _.cloneDeep(this.entityEdit.formGroup.value);
        if (value.client_id) {
          delete value.client_id;
          delete value.client_secret;
          delete value.refresh_token;
          value.smtp = false;

        }

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
  },
  {
    id: 'authenticate',
    name: helptext_system_email.auth.login_button,
    function: () => {
      const self = this;
      const dialogService = this.dialogservice;
      const controls = this.entityEdit.formGroup.controls;

      window.open("https://freenas.org/oauth/gmail?origin=" +
        encodeURIComponent(window.location.toString()), "_blank", "width=640,height=480");
      window.addEventListener("message", doAuth, false);

      function doAuth(message) {
        if (message.data.oauth_portal) {
          if (message.data.error) {
            dialogService.errorReport(T('Error'), message.data.error);
          } else {
            self.oauthCreds = message.data.result;
            self.checkForOauthCreds();
          }
        }
        window.removeEventListener("message", doAuth);
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
          name: 'smtp',
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
          relation : [
            {
              action : 'HIDE',
              when : [ {
                name : 'smtp',
                value : false,
              } ]
            },
          ],
        },
        {
          type : 'input',
          name : 'port',
          inputType: 'number',
          validation: helptext_system_email.port.validation,
          required: true,
          placeholder : helptext_system_email.port.placeholder,
          tooltip : helptext_system_email.port.tooltip,
          relation : [
            {
              action : 'HIDE',
              when : [ {
                name : 'smtp',
                value : false,
              } ]
            },
          ],
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
          ],
          relation : [
            {
              action : 'HIDE',
              when : [ {
                name : 'smtp',
                value : false,
              } ]
            },
          ],
        },
        {
          type: 'checkbox',
          name: 'auth_smtp',
          placeholder: helptext_system_email.auth.smtp.placeholder,
          tooltip: helptext_system_email.auth.smtp.tooltip,
          relation: [
            {
              action: 'HIDE',
              when: [
                {
                  name: 'smtp',
                  value: false,
                },
              ],
            },
          ],
          value: false,
        },
        {
          type: 'input',
          name: 'user',
          placeholder: helptext_system_email.user.placeholder,
          tooltip: helptext_system_email.user.tooltip,
          relation: [
            {
              action: 'HIDE',
              connective: 'OR',
              when: [{
                name: 'smtp',
                value: false,
              },{
                name: 'auth_smtp',
                value: false,
              }],
            },
            {
              action: 'DISABLE',
              when: [{
                name: 'auth_smtp',
                value: false,
              }]
            }
          ],
          required: true,
          validation: helptext_system_email.user.validation,
        },
        {
          type: 'input',
          name: 'pass',
          placeholder: helptext_system_email.pass.placeholder,
          tooltip: helptext_system_email.pass.tooltip,
          inputType: 'password',
          relation: [
            {
              action: 'HIDE',
              connective: 'OR',
              when: [{
                name: 'smtp',
                value: false,
              },{
                name: 'auth_smtp',
                value: false,
              }],
            },
            {
              action: 'DISABLE',
              when: [{
                name: 'auth_smtp',
                value: false,
              }]
            }
          ],
          togglePw: true,
          validation: helptext_system_email.pass.validation,
        },
        {
          type: 'paragraph',
          name: 'oauth_applied',
          paraText: 'Oauth credentials have been applied.',
          isHidden: true
        },
        {
          type: 'paragraph',
          name: 'oauth_not_applied',
          paraText: 'Log in to Gmail to set up Oauth credentials.',
          isHidden: true
        },
      ]
    },
    { name: 'divider', divider: true }
  ]);

  protected dialogRef: any;

  private smtp;
  private smtp_subscription;
  private pass: FieldConfig;

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService, protected _injector: Injector,
              protected _appRef: ApplicationRef,private dialogservice: DialogService,
              protected dialog: MatDialog, protected loader: AppLoaderService
            ) {}

  resourceTransformIncomingRestData(data): void {
    this.oauthCreds = data.oauth;
    delete data.pass;
    return data;
  }

  isCustActionVisible(actionname: string) {
    if (actionname === 'authenticate' && this.credentialsOauth === false) {
      return false;
    }
    return true;
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

    this.smtp_subscription = this.smtp.valueChanges.subscribe((value) => {
      this.pass.hideButton = !value;
      this.credentialsOauth = !value;
      if (!value) {
        this.checkForOauthCreds();
      } else {
        entityEdit.setDisabled('oauth_applied', true, true);
        entityEdit.setDisabled('oauth_not_applied', true, true);
      }
    });
  }

  checkForOauthCreds() {
    if (this.oauthCreds.client_id) {
      this.entityEdit.setDisabled('oauth_applied', false, false);
      this.entityEdit.setDisabled('oauth_not_applied', true, true);
    } else {
      this.entityEdit.setDisabled('oauth_applied', true, true);
      this.entityEdit.setDisabled('oauth_not_applied', false, false);
    }
  }

  ngOnDestroy() {
    this.smtp_subscription.unsubscribe();
  }

  saveConfigSubmit(emailConfig): void {
    this.loader.open();
    if (emailConfig.pass && typeof emailConfig.pass === 'string' && emailConfig.pass.trim() === '') {
      delete emailConfig.pass;
    }
    if (this.oauthCreds.client_id) {
      let oauth = {
        client_id: this.oauthCreds.client_id,
        client_secret: this.oauthCreds.client_secret,
        refresh_token: this.oauthCreds.refresh_token,
      };
      emailConfig.oauth = oauth;
    } else {
      emailConfig.oauth = null;
    }

    if (emailConfig.oauth_applied) {
      delete emailConfig.oauth_applied
    }

    if (emailConfig.oauth_not_applied) {
      delete emailConfig.oauth_not_applied
    }

    if (emailConfig.hasOwnProperty('auth_smtp')) {
      delete emailConfig.auth_smtp;
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
