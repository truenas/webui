import { Component } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import {Validators} from '@angular/forms';
import { T } from '../../../../translate-marker';
import strings from '../strings';

import { RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import {  DialogService } from '../../../../services/';
import {
  regexValidator
} from '../../../common/entity/entity-form/validators/regex-validation';

@Component({
  selector: 'app-group-form',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class GroupFormComponent {

  protected route_success: string[] = ['account', 'groups'];
  protected resource_name: string = 'account/groups/';
  protected isEntity: boolean = true;

  protected fieldConfig: FieldConfig[] = [{
      type: 'input',
      name: 'bsdgrp_gid',
      placeholder: T('GID'),
      tooltip: strings.bsdgrp_gid_tooltip,
      validation : [ Validators.required, regexValidator(/^\d+$/) ],
      required: true,
    },
    {
      type: 'input',
      name: 'bsdgrp_group',
      placeholder: T('Name'),
      tooltip: strings.bsdgrp_group_tooltip,
      validation : [ Validators.required, regexValidator(/^\w+$/) ],
      required: true
    },
    {
      type: 'checkbox',
      name: 'bsdgrp_sudo',
      placeholder: T('Permit Sudo'),
      tooltip: strings.bsdgrp_sudo_tooltip,
    },
    {
      type: 'checkbox',
      name: 'allow',
      placeholder: T('Allow repeated GIDs'),
      tooltip: strings.allow_tooltip,
      disabled: false
    },
  ];
  public users: any[];
  private bsdgrp_gid: any;
  private allow: any;

  constructor(protected router: Router, protected rest: RestService,
    protected ws: WebSocketService, private dialog:DialogService) {}
  preInit(entityForm: any) {
  }
  afterInit(entityForm: any) {
    this.rest.get('account/users/', { limit: 0 }).subscribe((res) => {
      this.users = res.data;
    });

    this.rest.get(this.resource_name, { limit: 0 }).subscribe((res) => {
      let gid = 999;
      this.bsdgrp_gid = _.find(this.fieldConfig, { name: "bsdgrp_gid" });
      res.data.forEach((item, i) => {
        if (item.bsdgrp_gid > gid)
          gid = item.bsdgrp_gid;
      });
      if (!entityForm.isNew) {
        entityForm.setDisabled('bsdgrp_gid', true);
        entityForm.setDisabled('allow', true);
      } else {
        this.ws.call('group.get_next_gid').subscribe((res)=>{
          entityForm.formGroup.controls['bsdgrp_gid'].setValue(res);
        })
      }
    });
  }
}
