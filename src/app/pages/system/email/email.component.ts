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
  customSubmit = this.saveConfigSubmit;
  public custActions: Array < any > = [{
    id: 'send_mail',
    name: T('Send Test Mail'),
    function: () => {
      if (this.rootEmail){
        const value = _.cloneDeep(this.entityEdit.formGroup.value);
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
    id: 'do_oauth',
    name: 'Log in to provider',
    function: () => {
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
            for (const prop in message.data.result) {
              controls[prop].setValue(message.data.result[prop]);
            }
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
      width: '49%',
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
          placeholder: 'Authentication',
          options: [
            {label: 'SMTP',
             name: 'smtp',
             tooltip: 'whatevs',
             value: true},
            {label: 'GMail',
             name: 'gmail',
             tooltip: 'Gmail whatevs',
             value: false},
          ],
          value: true
        },
      ]
    },
    { name: 'spacer', label: false, width: '2%' },
    {
      name: helptext_system_email.fieldsets.access,
      label: true,
      width: '49%',
      config: [
        // {
        //   type : 'checkbox',
        //   name : 'smtp',
        //   placeholder : helptext_system_email.smtp.placeholder,
        //   tooltip : helptext_system_email.smtp.tooltip,
        // },
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
            {label : 'Plain (No Encryption)', value : 'PLAIN'},
            {label : 'SSL (Implicit TLS)', value : 'SSL'},
            {label : 'TLS (STARTTLS)', value : 'TLS'},
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
          type : 'input',
          name : 'user',
          placeholder : helptext_system_email.user.placeholder,
          tooltip : helptext_system_email.user.tooltip,
          relation : [
            {
              action : 'HIDE',
              when : [ {
                name : 'smtp',
                value : false,
              } ]
            },
          ],
          required: true,
          validation : helptext_system_email.user.validation
        },
        {
          type : 'input',
          name : 'pass',
          placeholder : helptext_system_email.pass.placeholder,
          tooltip : helptext_system_email.pass.tooltip,
          inputType : 'password',
          relation : [
            {
              action : 'HIDE',
              when : [ {
                name : 'smtp',
                value : false,
              } ]
            },
          ],
          togglePw : true, 
          validation: helptext_system_email.pass.validation,
        },
        {
          type: 'input',
          name: 'client_id',
          placeholder: 'Client ID',
          relation : [
            {
              action : 'HIDE',
              when : [ {
                name : 'smtp',
                value : true,
              } ]
            },
          ],
        },
        {
          type: 'input',
          name: 'client_secret',
          placeholder: 'Client Secret',
          relation : [
            {
              action : 'HIDE',
              when : [ {
                name : 'smtp',
                value : true,
              } ]
            },
          ],
        },
        {
          type: 'input',
          name: 'refresh_token',
          placeholder: 'Refresh Token',
          relation : [
            {
              action : 'HIDE',
              when : [ {
                name : 'smtp',
                value : true,
              } ]
            },
          ],
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
    for (let i in data.oauth) {
      data[i] = data.oauth[i];
    }
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

    this.smtp_subscription = this.smtp.valueChanges.subscribe((value) => {
      this.pass.hideButton = !value;
    });
  }

  ngOnDestroy() {
    this.smtp_subscription.unsubscribe();
  }

  saveConfigSubmit(emailConfig): void {
    this.loader.open();
    if (emailConfig.pass && typeof emailConfig.pass === 'string' && emailConfig.pass.trim() === '') {
      delete emailConfig.pass;
    }
    if (emailConfig.client_id) {
      let oauth = {
        client_id: emailConfig.client_id,
        client_secret: emailConfig.client_secret,
        refresh_token: emailConfig.refresh_token,
        access_token: '',
        token_uri: ''
      };
      emailConfig.oauth = oauth;
    }
    delete emailConfig.client_id;
    delete emailConfig.client_secret;
    delete emailConfig.refresh_token;

    console.log(emailConfig)
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
