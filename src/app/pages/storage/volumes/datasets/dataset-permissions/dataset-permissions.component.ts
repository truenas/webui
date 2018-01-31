import {
  ApplicationRef,
  Component,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import {
  FormGroup,
} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import filesize from 'filesize';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';

import { UserService } from '../../../../../services/user.service';
import {RestService, WebSocketService, StorageService} from '../../../../../services/';
import {EntityUtils} from '../../../../common/entity/utils';
import {
  FieldConfig
} from '../../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'app-dataset-permissions',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class DatasetPermissionsComponent {

  protected path: string;
  protected mp_path: any;
  protected mp_user: any;
  protected mp_group: any;
  public sub: Subscription;
  public formGroup: FormGroup;
  public data: Object = {};
  public error: string;
  public busy: Subscription;
  protected fs: any = filesize;
  protected route_success: string[] = [ 'storage', 'volumes' ];
  protected resource_name = 'storage/permission';

  public fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name : 'mp_path',
      placeholder : 'Path',
      readonly: true
    },
    {
      type: 'select',
      name: 'mp_acl',
      placeholder: 'ACL Type',
      tooltip: 'Choices are <b>Unix</b>, <b>Mac</b> or <b>Windows</b>. Select the\
 type that matches the type of client accessing the volume/dataset.',
 options: [{label:'unix', value: 'unix'},
                {label:'windows', value: 'windows'}],
      value: 'unix'
    },
    {
      type: 'permissions',
      name: 'mp_mode',
      placeholder: 'Mode',
      tooltip: 'Only applies to Unix or Mac permission types.\
 Note that the mode cannot be changed when Windows is selected.',
    },
    {
      type: 'select',
      name: 'mp_user',
      placeholder: 'User',
      tooltip: 'Select the user to control the volume/dataset.\
 Note that users manually created or imported from a directory service will\
 appear in the drop-down menu.',
      options: [],
    },
    {
      type: 'select',
      name: 'mp_group',
      placeholder: 'Group',
      tooltip: 'Select the group to control the volume/dataset.\
 Note that groups manually created or imported from a directory service will\
 appear in the drop-down menu.',
      options: [],
    },
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected aroute: ActivatedRoute, protected rest: RestService,
              protected ws: WebSocketService, protected userService: UserService,
              protected storageService: StorageService) {}

  preInit(entityEdit: any) {
    entityEdit.isNew = true; // remove me when we find a way to get the permissions
    this.sub = this.aroute.params.subscribe(params => {
      this.path = '/mnt/' + params['path'];
      this.mp_path = _.find(this.fieldConfig, {name:'mp_path'});
      this.mp_path.value = this.path;
    });



    this.userService.listUsers().subscribe(res => {
      let users = [];
      for (let user of res.data) {
        users.push({label: user['bsdusr_username'], value: user['bsdusr_uid']});
      }
      this.mp_user = _.find(this.fieldConfig, {'name' : 'mp_user'});
      this.mp_user.options = users;
    });

    this.userService.listGroups().subscribe(res => {
      let groups = [];
      for (let group of res.data) {
        groups.push({label: group['bsdgrp_group'], value: group['bsdgrp_gid']});
      }
      this.mp_group = _.find(this.fieldConfig, {'name' : 'mp_group'});
        this.mp_group.options = groups;
    }); 
  }

  afterInit(entityEdit: any) {
    this.storageService.filesystemStat(this.path).subscribe(res => {
      entityEdit.formGroup.controls['mp_mode'].setValue(res.mode.toString(8).substring(2,5));
      entityEdit.formGroup.controls['mp_user'].setValue(res.uid);
      entityEdit.formGroup.controls['mp_group'].setValue(res.gid);
    });
  }
}
