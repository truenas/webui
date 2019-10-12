import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Validators } from '@angular/forms';

import * as _ from 'lodash';
import { T } from '../../../../translate-marker';
import helptext from '../../../../helptext/account/groups';

import { RestService, WebSocketService, UserService, DialogService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { forbiddenValues } from '../../../common/entity/entity-form/validators/forbidden-values-validation';

@Component({
  selector: 'app-group-form',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class GroupFormComponent {

  protected route_success: string[] = ['account', 'groups'];
  protected resource_name: string = 'account/groups/';
  protected isEntity: boolean = true;
  protected namesInUse = [];

  protected fieldConfig: FieldConfig[] = [{
      type: 'input',
      name: 'bsdgrp_gid',
      placeholder: helptext.bsdgrp_gid_placeholder,
      tooltip: helptext.bsdgrp_gid_tooltip,
      validation : helptext.bsdgrp_gid_validation,
      required: true,
    },
    {
      type: 'input',
      name: 'bsdgrp_group',
      placeholder: helptext.bsdgrp_group_placeholder,
      tooltip: helptext.bsdgrp_group_tooltip,
      validation: [
        Validators.required,
        Validators.pattern(UserService.VALIDATOR_NAME),
        forbiddenValues(this.namesInUse)
      ],
      required: true
    },
    {
      type: 'checkbox',
      name: 'bsdgrp_sudo',
      placeholder: helptext.bsdgrp_sudo_placeholder,
      tooltip: helptext.bsdgrp_sudo_tooltip,
    },
    {
      type: 'checkbox',
      name: 'allow',
      placeholder: helptext.allow_placeholder,
      tooltip: helptext.allow_tooltip,
      disabled: false
    },
  ];
  public users: any[];
  private bsdgrp_gid: any;
  private allow: any;

  constructor(protected router: Router, protected rest: RestService,
    protected ws: WebSocketService, private dialog:DialogService,
    protected aroute: ActivatedRoute) {
  }

  preInit(entityForm: any) {
    this.aroute.params.subscribe(params => {
      this.ws.call('group.query').subscribe(
        (res)=>{
          _.remove(res, function(group) {
            return group['id'] == params['pk'];
          })
          this.namesInUse.push(...res.map(group => group.group));
        }
      );
    });
  }
  afterInit(entityForm: any) {
    this.rest.get('account/users/', { limit: 0 }).subscribe((res) => {
      this.users = res.data;
    });

    this.rest.get(this.resource_name, { limit: 0 }).subscribe((res) => {
      let gid = 999;
      this.bsdgrp_gid = _.find(this.fieldConfig, { name: "bsdgrp_gid" });
      res.data.forEach((item, i) => {
        if (item.bsdgrp_gid > gid) {
          gid = item.bsdgrp_gid;
        }
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

    entityForm.formGroup.controls['bsdgrp_group'].valueChanges.subscribe((value) => {
      const field = _.find(this.fieldConfig, {name: "bsdgrp_group"});
      field['hasErrors'] = false;
      field['errors'] = '';
      if (this.namesInUse.includes(value)) {
        field['hasErrors'] = true;
        field['errors'] = T(`The name <em>${value}</em> is already in use.`);
      }
    })

  }
}
