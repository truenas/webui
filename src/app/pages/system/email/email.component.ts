import { ApplicationRef, Component, Injector, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import { helptext_system_email } from 'app/helptext/system/email';
import * as _ from 'lodash';
import { DialogService, RestService, WebSocketService, AppLoaderService } from '../../../services/';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { T } from 'app/translate-marker';

@Component({
  selector : 'app-email',
  template : `
  <entity-form [conf]="this"></entity-form>
  `
})
export class EmailComponent implements OnDestroy {

  // protected resource_name = 'system/email';
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
        const mailObj = {
          "subject" : "FreeNAS Test Message",
          "text" : "This is a test message from FreeNAS.",
        };
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
  public fieldConfig: FieldConfig[] = [
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
      tooltip : helptext_system_email.port.tooltip
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
    },
    {
      type : 'checkbox',
      name : 'smtp',
      placeholder : helptext_system_email.smtp.placeholder,
      tooltip : helptext_system_email.smtp.tooltip,
    },
    {
      type : 'input',
      name : 'user',
      placeholder : helptext_system_email.user.placeholder,
      tooltip : helptext_system_email.user.tooltip,
      relation : [
        {
          action : 'DISABLE',
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
          action : 'DISABLE',
          when : [ {
            name : 'smtp',
            value : false,
          } ]
        },
      ],
      togglePw : true
    }
  ];
  protected dialogRef: any;

  private smtp;
  private smtp_subscription;
  private pass;

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService, protected _injector: Injector,
              protected _appRef: ApplicationRef,private dialogservice: DialogService,
              protected dialog: MatDialog, protected loader: AppLoaderService
            ) {}

  resourceTransformIncomingRestData(data): void {
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
    this.pass = _.find(this.fieldConfig, {'name': 'pass'});
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
    this.ws
      .call(this.updateCall, [emailConfig])
      .subscribe(
        () => {},
        error => {
          this.loader.close();
          new EntityUtils().handleWSError(this, error, this.dialogservice)
        },
        () => this.loader.close()
      );
  }
}
