import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Validators } from '@angular/forms';

import * as _ from 'lodash';
import { T } from '../../../../translate-marker';
import helptext from '../../../../helptext/account/groups';

import { WebSocketService, UserService, DialogService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../../common/entity/entity-form/models/fieldset.interface';
import { forbiddenValues } from '../../../common/entity/entity-form/validators/forbidden-values-validation';

@Component({
  selector: 'app-group-form',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class GroupFormComponent {

  protected route_success: string[] = ['account', 'groups'];
  protected isEntity: boolean = true;
  protected namesInUse = [];
  protected queryCall = 'group.query';
  protected addCall = 'group.create';
  protected editCall = 'group.update';
  protected queryKey = 'id';

  protected fieldConfig: FieldConfig[] = [];

  public fieldSetDisplay  = 'default';
  protected fieldSets: FieldSet[] = [
    {
      name: helptext.fieldset_name,
      class: 'group-configuration-form',
      label:true,
      config: [
        {
          type: 'input',
          name: 'gid',
          placeholder: helptext.bsdgrp_gid_placeholder,
          tooltip: helptext.bsdgrp_gid_tooltip,
          validation : helptext.bsdgrp_gid_validation,
          required: true,
        },
        {
          type: 'input',
          name: 'name',
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
          name: 'sudo',
          placeholder: helptext.bsdgrp_sudo_placeholder,
          tooltip: helptext.bsdgrp_sudo_tooltip,
        },
        {
          type: 'checkbox',
          name: 'smb',
          placeholder: helptext.smb_placeholder,
          tooltip: helptext.smb_tooltip,
          value: true
        },
        {
          type: 'checkbox',
          name: 'allow_duplicate_gid',
          placeholder: helptext.allow_placeholder,
          tooltip: helptext.allow_tooltip,
          disabled: false
        },
      ]
    }
  ]


  public users: any[];
  private bsdgrp_gid: any;
  private allow: any;

  constructor(protected router: Router, 
    protected ws: WebSocketService, 
    private dialog:DialogService,
    protected aroute: ActivatedRoute) {
  }

  preInit(entityForm: any) {
    this.aroute.params.subscribe(params => {
      let opt = params.pk ? [{'gid':params.pk}] : [];
      

      this.ws.call('group.query').subscribe(
        (res)=>{
          _.remove(res, function(group) {
            return group['id'] == params['pk'];
          });
          this.namesInUse.push(...res.map(group => group.group));
      });

    });
  }

  resourceTransformIncomingRestData(data) {
    data['name'] = data['group'];
    return data;
  }

  afterInit(entityForm: any) {
    this.ws.call('user.query',[]).subscribe((res) => {
      this.users = res.map((u) =>{
        let user = Object.assign({}, u);
        user.gid = user.group.bsdgrp_gid;
        return user;
      });
  
      let gid = 999;
      this.bsdgrp_gid = _.find(this.fieldSets[0].config, { name: "gid" });
      this.users.forEach((item, i) => {
        if (item.gid > gid) {
          gid = item.gid;
        }
      });

      if (!entityForm.isNew) {
        entityForm.setDisabled('gid', true);

        entityForm.formGroup.controls['allow_duplicate_gid'].setValue(true);
        _.find(this.fieldSets[0].config, { name: 'allow_duplicate_gid' }).isHidden = true;
      } else {
        this.ws.call('group.get_next_gid').subscribe((res)=>{
          entityForm.formGroup.controls['gid'].setValue(res);
        })
      }

    });
  }
}
