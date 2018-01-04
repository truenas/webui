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

@Component({
  selector : 'app-email',
  template : `
  <md-card>
  <button md-button class="btn btn-primary" (click)="sendMail()" >Send Test Email</button>
  </md-card>
  <entity-form [conf]="this"></entity-form>
  `
})
export class EmailComponent {

  protected resource_name: string = 'system/email';
  public entityEdit: any;
  public rootEmail = '';
  private em_outgoingserver: any;
  private em_port: any;
  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'em_fromemail',
      placeholder : 'From E-mail',
    },
    {
      type : 'input',
      name : 'em_outgoingserver',
      placeholder : 'Outgoing Mail Server',
    },
    {
      type : 'input',
      name : 'em_port',
      placeholder : 'Mail Server Port',
    },
    {
      type : 'select',
      name : 'em_security',
      placeholder : 'Security',
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
    },
    {
      type : 'input',
      name : 'em_user',
      placeholder : 'Username',
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

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService, protected _injector: Injector,
              protected _appRef: ApplicationRef,
              private dialog:DialogService
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
    if(!this.entityEdit.data.em_outgoingserver || !this.entityEdit.data.em_port){
      this.dialog.Info("email", 
      "Your test email could not be sent: [EFAULT] you must provide an outgoing mailserver and mail server port when sending mail");
    }
    else{
    if (this.rootEmail){
      let value = _.cloneDeep(this.entityEdit.formGroup.value);
      let mailObj = {
        "subject" : "Test message from FreeNAS",
        "text" : "This is a test message from FreeNAS",
      };
      // TODO fix callback Hell!!
      this.ws.call('system.info').subscribe((res) => {
        mailObj['subject'] += " hostname: " + res['hostname'];
        this.ws.call('mail.send', [ mailObj ]).subscribe((res) => {
          if (res[0]) {
            this.entityEdit.error = res[1];
          } else {
            this.entityEdit.error = "";
            this.dialog.Info("email", "Test email sent successfully!")
          }
        });
      });
    }
    else{
      this.dialog.Info("email", "please setup root user email address");
    }
  }}
}
