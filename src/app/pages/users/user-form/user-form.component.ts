import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { GlobalState } from '../../../global.state';
import { RestService, WebSocketService, NetworkService } from '../../../services/';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import * as _ from 'lodash';

@Component({
  selector: 'app-user-form',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class UserFormComponent {

  protected resource_name: string = 'account/users/';
  protected route_success: string[] = ['users'];
  protected isEntity: boolean = true;

  protected fieldConfig: FieldConfig[] = [
    {
        type: 'input',
        name: 'bsdusr_uid',
        placeholder: 'UID',
    },
    {   type: 'input',
        name: 'bsdusr_username',
        placeholder: 'Username',
    },
   {    type: 'input',
        name: 'bsdusr_full_name',
        placeholder: 'Full Name',
    },
   {    type: 'input',
        name: 'bsdusr_home',
        placeholder: 'Home Directory',
    },
   {    type: 'input',
        name: 'bsdusr_email',
        placeholder: 'Email',
    },
   {    type: 'input',
        name: 'bsdusr_password',
        placeholder: 'Password',
        inputType: 'password',
    },
    {   type: 'select',
        name: 'bsdusr_group',
        placeholder: 'Primary Group',
        options: [],
        relation: [
            {
                action: 'DISABLE',
                when: [
                    {
                        name: 'bsdusr_creategroup',
                        value: true,
                    }
                    ]
                },
                ],
    },
    {   type: 'checkbox',
        name: 'bsdusr_creategroup',
        placeholder: 'Create Primary Group',
    },
    {   type: 'select',
        name: 'bsdusr_shell',
        placeholder: 'Shell',
        options: [],
    },
  ];
  private shells: any;
  private bsdusr_shell: any;
  private bsdusr_group: any;

  constructor(protected router: Router, protected rest: RestService, protected ws: WebSocketService,
    protected _state: GlobalState) {

  }

  afterInit(entityAdd: any) {
      /* list groups */
    this.rest.get('account/groups/', {}).subscribe((res) => {
      this.bsdusr_group = _.find(this.fieldConfig, { name : "bsdusr_group" });
      res.data.forEach((item) => {
        this.bsdusr_group.options.push({label: item.bsdgrp_group, value: item.id});
      });
      this.bsdusr_group.valueUpdates.next();
    });
    /* list users */
    this.rest.get(this.resource_name, {}).subscribe((res) => {
      let uid = 999;
      res.data.forEach((item, i) => {
        if (item.bsdusr_uid > uid) uid = item.bsdusr_uid;
      });
      uid += 1;
      entityAdd.formGroup.controls['bsdusr_uid'].setValue(uid);
    });
    /* list shells */
    entityAdd.ws.call('notifier.choices', ['SHELL_CHOICES']).subscribe((res) => {
      this.bsdusr_shell = _.find(this.fieldConfig, { name : "bsdusr_shell" });
      this.shells = res;
      let bsduser_shell = this.bsdusr_shell
      res.forEach((item) => {
        this.bsdusr_shell.options.push({ label: item[1], value: item[0] });
      });
      entityAdd.formGroup.controls['bsdusr_shell'].setValue(this.shells[1][0]);
    });
  }

  clean_uid(value) {
    if (value['uid'] === null) {
      delete value['uid'];
    }
    return value;
  }

}
