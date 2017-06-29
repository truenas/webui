import {ApplicationRef, Component, Injector, OnInit} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  Validators
} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';

import {GlobalState} from '../../../global.state';
import {RestService, UserService, WebSocketService} from '../../../services/';
import {EntityConfigComponent} from '../../common/entity/entity-config/';
import {
  FieldConfig
} from '../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'app-email',
  template : `
  <entity-form [conf]="this"></entity-form>
  <button class="btn btn-primary" (click)="sendMail()" [ngBusy]="sendEmailBusy">Send Test Email</button>
  `
})
export class EmailComponent {

  protected resource_name: string = 'system/email';
  public entityEdit: EntityConfigComponent;
  public sendEmailBusy: Subscription;
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
    },
  ];

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService, protected _injector: Injector,
              protected _appRef: ApplicationRef,
              protected _state: GlobalState) {}

  afterInit(entityEdit: any) { this.entityEdit = entityEdit; }

  sendMail(): void {
    let value = _.cloneDeep(this.entityEdit.formGroup.value);
    let mailObj = {
      "subject" : "Test message from FreeNAS",
      "text" : "This is a test message from FreeNAS",
    };
    // TODO fix callback Hell!!
    this.sendEmailBusy = this.ws.call('system.info').subscribe((res) => {
      mailObj['subject'] += " hostname: " + res['hostname'];
      this.ws.call('mail.send', [ mailObj ]).subscribe((res) => {
        if (res[0]) {
          this.entityEdit.error = res[1];
        } else {
          this.entityEdit.error = "";
          alert("Test email sent successfully!");
        }
      });
    });
  }
}
