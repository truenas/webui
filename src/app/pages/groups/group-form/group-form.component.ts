import {Component} from '@angular/core';
import {Router} from '@angular/router';
import * as _ from 'lodash';

import {GlobalState} from '../../../global.state';
import {RestService, WebSocketService} from '../../../services/';
import {
  FieldConfig
} from '../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'app-group-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class GroupFormComponent {

  protected route_success: string[] = [ 'groups' ];
  protected resource_name: string = 'account/groups/';
  protected isEntity: boolean = true;

  protected fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'bsdgrp_gid',
      placeholder : 'GID',
    },
    {
      type : 'input',
      name : 'bsdgrp_group',
      placeholder : 'Name',
    },
    {type : 'checkbox', name : 'bsdusr_sudo', placeholder : 'Permit Sudo'},
    {type : 'checkbox', name : 'allow', placeholder : 'Allow repeated GIDs'},
  ];
  public users: any[];
  private bsdgrp_gid: any;
  private allow: any;

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService, protected _state: GlobalState) {}
  preInit(entityForm: any) {
    if (!entityForm.isNew) {
      this.allow = _.find(this.fieldConfig, {name : "allow"});
      this.allow.isHidden = true;
    }
  }
  afterInit(entityForm: any) {
    this.rest.get('account/users/', {limit : 0}).subscribe((res) => {
      this.users = res.data;
    });

    this.rest.get(this.resource_name, {limit : 0}).subscribe((res) => {
      let gid = 999;
      this.bsdgrp_gid = _.find(this.fieldConfig, {name : "bsdgrp_gid"});
      res.data.forEach((item, i) => {
        if (item.bsdgrp_gid > gid)
          gid = item.bsdgrp_gid;
      });
      if (!entityForm.isNew) {
        entityForm.setDisabled('bsdgrp_gid', true);
        entityForm.formGroup.controls['bsdusr_uid'].setValue(gid);
      } else {
        gid += 1;
        entityForm.formGroup.controls['bsdgrp_gid'].setValue(gid);
      }
    });
  }
}
