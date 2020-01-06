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

      if(params.pk){

        this.ws.call('group.get_group_obj', opt).subscribe(
          (res)=>{
            entityForm.formGroup.controls['bsdgrp_gid'].setValue(res.gr_gid);
            entityForm.formGroup.controls['bsdgrp_group'].setValue(res.gr_name);
        });

      }
    });
  }

  afterInit(entityForm: any) {
    this.ws.call('user.query',[]).subscribe((res) => {
      this.users = res.map((u) =>{
        let user = Object.assign({}, u);
        user.gid = user.group.bsdgrp_gid;
        return user;
      });
  
      let gid = 999;
      this.bsdgrp_gid = _.find(this.fieldSets[0].config, { name: "bsdgrp_gid" });
      this.users.forEach((item, i) => {
        if (item.gid > gid) {
          gid = item.gid;
        }
      });

      let call = (name: string, form: any) => {

        let args = {
          gid: form.bsdgrp_gid,
          name: form.bsdgrp_group,
          sudo: form.bsdgrp_sudo,
          allow_duplicate_gid: form.bsdgrp_allow ? form.bsdgrp_allow : false,
          users:[]
        }
        const sub = this.ws.call(name,[args]);

        return sub;
      }

      if (!entityForm.isNew) {
        entityForm.submitFunction = submission => call('group.update', submission);

        entityForm.setDisabled('bsdgrp_gid', true);

        entityForm.formGroup.controls['allow'].setValue(true);
        _.find(this.fieldSets[0].config, { name: 'allow' }).isHidden = true;
      } else {
        entityForm.submitFunction = submission => call('group.create', submission);
        this.ws.call('group.get_next_gid').subscribe((res)=>{
          entityForm.formGroup.controls['bsdgrp_gid'].setValue(res);
        })
      }

    });
  }
}
