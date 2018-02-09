import {ApplicationRef, Component, Injector, OnInit} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  Validators
} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import * as _ from 'lodash';

import {RestService, UserService, WebSocketService} from '../../../services/';
import {  DialogService } from '../../../services/';
import {
  FieldConfig
} from '../../common/entity/entity-form/models/field-config.interface';
import {
  matchOtherValidator
} from '../../common/entity/entity-form/validators/password-validation';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import { MatDialog } from '@angular/material';

@Component({
  selector : 'app-email',
  template : `
  <mat-card>
  <button mat-button class="btn btn-primary" (click)="sendMail()" >Send Test Email</button>
  </mat-card>
  <entity-form [conf]="this"></entity-form>
  `
})
export class EmailComponent {

  protected resource_name: string = 'system/email';
  public entityEdit: any;
  public rootEmail: string;
  private em_outgoingserver: any;
  private em_port: any;
  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'em_fromemail',
      placeholder : 'From E-mail',
      tooltip : 'The envelope <b>From</b> address shown in the email.\
 This can be set to assist with filtering mail on the receiving system.',
    },
    {
      type : 'input',
      name : 'em_outgoingserver',
      placeholder : 'Outgoing Mail Server',
      tooltip : 'Hostname or IP address of SMTP server to use for\
 sending this email.',
    },
    {
      type : 'input',
      name : 'em_port',
      placeholder : 'Mail Server Port',
      tooltip : 'SMTP port number. Typically <i>25,465</i>\
 (secure SMTP), or <i>587</i> (submission).',
    },
    {
      type : 'select',
      name : 'em_security',
      placeholder : 'Security',
      tooltip : 'Encryption type. Choices are <i>Plain, SSL</i>, or\
 <i>TLS</i>.',
      options : [
        {label : 'Plain', value : 'plain'},
        {label : 'SSL', value : 'ssl'},
        {label : 'TLS', value : 'tls'},
      ],
    },
    {
      type : 'checkbox',
      name : 'em_smtp',
      placeholder : 'SMTP Authentication',
      tooltip : 'Enable/disable\
 <a href="https://en.wikipedia.org/wiki/SMTP_Authentication"\
 target="_blank">SMTP AUTH</a> using PLAIN SASL. If checked, enter the\
 required <b>Username</b> and <b>Password</b>.',
    },
    {
      type : 'input',
      name : 'em_user',
      placeholder : 'Username',
      tooltip : 'Enter the username if the SMTP server requires\
 authentication.',
      relation : [
        {
          action : 'DISABLE',
          when : [ {
            name : 'em_smtp',
            value : false,
          } ]
        },
      ],
    },
    {
      type : 'input',
      name : 'em_pass1',
      placeholder : 'Password',
      tooltip : 'Enter the password if the SMTP server requires\
 authentication.',
      inputType : 'password',
      relation : [
        {
          action : 'DISABLE',
          when : [ {
            name : 'em_smtp',
            value : false,
          } ]
        },
      ],
      validation : [ matchOtherValidator('em_pass2'), Validators.required ]
    },
    {
      type : 'input',
      name : 'em_pass2',
      placeholder : 'Confirm Password',
      tooltip : 'Confirm previous password.',
      inputType : 'password',
      relation : [
        {
          action : 'DISABLE',
          when : [ {
            name : 'em_smtp',
            value : false,
          } ]
        },
      ],
      validation : [ Validators.required ]
    },
  ];
  protected dialogRef: any;

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService, protected _injector: Injector,
              protected _appRef: ApplicationRef,private dialogservice: DialogService,
              protected dialog: MatDialog
            ) {}

afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
    const payload = [];
    payload.push("username");
    payload.push("=");
    payload.push("root");
    this.ws.call('user.query', [[payload]]).subscribe((res)=>{
      this.rootEmail = res[0].email;
    })
   
  }
  sendMail(): void {
    if (this.rootEmail){
      const value = _.cloneDeep(this.entityEdit.formGroup.value);
      const mailObj = {
        "subject" : "Test message from FreeNAS",
        "text" : "This is a test message from FreeNAS",
      };
      const security_table = {
        'plain':'PLAIN',
        'ssl': 'SSL',
        'tls': 'TLS'
      };
      this.ws.call('system.info').subscribe((res) => {
        const mail_form_payload = {}
        mail_form_payload['fromemail'] = value.em_fromemail
        mail_form_payload['outgoingserver']= value.em_outgoingserver
        mail_form_payload['port']= value.em_port
        mail_form_payload['security']= security_table[value.em_security]
        mail_form_payload['smtp']= value.em_smtp
        mail_form_payload['user']= value.em_user
        mail_form_payload['pass']= value.em_pass1
        mailObj['subject'] += " hostname: " + res['hostname'];
        this.dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": "EMAIL" }, disableClose: true });
        this.dialogRef.componentInstance.setCall('mail.send', [mailObj, mail_form_payload]);
        this.dialogRef.componentInstance.submit();
        this.dialogRef.componentInstance.success.subscribe((s_res)=>{
          this.dialogRef.close(false);
          this.dialogservice.Info("email", "Test email sent successfully!")
        });
        this.dialogRef.componentInstance.failure.subscribe((e_res) => {
          this.dialogRef.componentInstance.setDescription(e_res.error);
        });
      });
    }
    else{
      this.dialogservice.Info("email", "please setup root user email address");
    }
  }}
