import {Component, ViewContainerRef} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {FormArray} from '@angular/forms';

import {GlobalState} from '../../../../global.state';
import {RestService, WebSocketService} from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

import {UserService} from '../../../../services/user.service';
import {EntityFormService} from '../../../common/entity/entity-form/services/entity-form.service';
import * as _ from 'lodash';

@Component({
  selector : 'app-nfs-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class NFSFormComponent {

  protected route_success: string[] = [ 'sharing', 'nfs' ];
  protected resource_name: string = 'sharing/nfs/';
  protected isEntity: boolean = true;
  protected formArray: FormArray;
  protected isBasicMode: boolean = true;

  protected fieldConfig: FieldConfig[] = [
    {
      type: 'array',
      name : 'nfs_paths',
      initialCount: 1,
      formarray: [{
        name: 'path',
        placeholder: 'Path',
        type: 'explorer',
        initial: '/mnt',
      }]
    },
    {
      type: 'input',
      name: 'nfs_comment',
      placeholder: 'Comment',
    },
    {
      type: 'textarea',
      name : 'nfs_network',
      placeholder : 'Network',
    },
    {
      type: 'textarea',
      name: 'nfs_hosts',
      placeholder: 'Hosts',
    },
    {
      type: 'checkbox',
      name: 'nfs_alldirs',
      placeholder: 'All dirs',
    },
    {
      type: 'checkbox',
      name: 'nfs_ro',
      placeholder: 'Read Only',
    },
    {
      type: 'checkbox',
      name: 'nfs_quiet',
      placeholder: 'Quiet',
    },
    {
      type: 'textarea',
      name: 'nfs_network',
      placeholder: 'Authorized Networks'
    },
       {
      type: 'textarea',
      name: 'nfs_hosts',
      placeholder: 'Authorized Hosts and IP addresses'
    },
    {
      type: 'select',
      name: 'nfs_maproot_user',
      placeholder: 'Maproot User',
      options: []
    },
    {
      type: 'select',
      name: 'nfs_maproot_group',
      placeholder: 'Maproot Group',
      options: []
    },
    {
      type: 'select',
      name: 'nfs_mapall_user',
      placeholder: 'Mapall User',
      options: []
    },
    {
      type: 'select',
      name: 'nfs_mapall_group',
      placeholder: 'Mapall Group',
      options: []
    }, 
  ];

  protected path_count: number;
  protected arrayControl: any;
  protected initialCount: number;
  protected initialCount_default: number = 1;

  public custActions: Array<any> = [
    {
      id : 'add_path',
      name : 'Add Additional Path',
      function : () => {
        this.path_count += 1;
        this.entityFormService.insertFormArrayGroup(
            this.path_count, this.formArray, this.arrayControl.formarray);
      }
    },
    {
      id : 'remove_path',
      name : 'Remove Additional Path',
      function : () => {
        this.path_count -= 1;
        this.entityFormService.removeFormArrayGroup(this.path_count,
                                                    this.formArray);
      }
    },
    {
      id : 'basic_mode',
      name : 'Basic Mode',
      function : () => { this.isBasicMode = !this.isBasicMode; }
    },
    {
      'id' : 'advanced_mode',
      name : 'Advanced Mode',
      function : () => { this.isBasicMode = !this.isBasicMode; }
    }
  ];

  private nfs_maproot_user: any;
  private nfs_maproot_group: any;
  private nfs_mapall_user: any;
  private nfs_mapall_group: any;

  protected advanced_field: Array<any> = [
    'nfs_quiet',
    'nfs_network',
    'nfs_hosts',
    'nfs_maproot_user',
    'nfs_maproot_group',
    'nfs_mapall_user',
    'nfs_mapall_group'
  ];

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService,
              protected _state: GlobalState,
              protected entityFormService: EntityFormService,
              protected route: ActivatedRoute,
              protected userService: UserService ) {}

  preInit(EntityForm: any) {
    this.arrayControl =
      _.find(this.fieldConfig, {'name' : 'nfs_paths'});
    this.route.params.subscribe(params => {
      if(params['pk']) {
        this.arrayControl.initialCount = 0;
      }
    });
  }
  
  afterInit(EntityForm: any) {
    this.arrayControl =
      _.find(this.fieldConfig, {'name' : 'nfs_paths'});
    if (EntityForm.isNew) {
      this.initialCount = this.path_count = 1;
    } else {
      this.initialCount = this.path_count = this.arrayControl.initialCount;
    }

    this.userService.listUsers().subscribe(res => {
      let users = [];
      for (let user of res.data) {
        users.push({label: user['bsdusr_username'], value: user['bsdusr_username']});
      }
      this.nfs_mapall_user = _.find(this.fieldConfig, {'name' : 'nfs_mapall_user'});
      this.nfs_mapall_user.options = users;
      this.nfs_maproot_user = _.find(this.fieldConfig, {'name' : 'nfs_maproot_user'});
      this.nfs_maproot_user.options = users;
    });

    this.userService.listGroups().subscribe(res => {
      let groups = [];
      for (let group of res.data) {
        groups.push({label: group['bsdgrp_group'], value: group['bsdgrp_group']});
      }
      this.nfs_mapall_group = _.find(this.fieldConfig, {'name' : 'nfs_mapall_group'});
      this.nfs_mapall_group.options = groups;
      this.nfs_maproot_group = _.find(this.fieldConfig, {'name' : 'nfs_maproot_group'});
      this.nfs_maproot_group.options = groups;
    });

    this.formArray = EntityForm.formGroup.controls['nfs_paths'];
  }

  isCustActionVisible(actionId: string) {
    if (actionId == 'advanced_mode' && this.isBasicMode == false) {
      return false;
    } else if (actionId == 'basic_mode' && this.isBasicMode == true) {
      return false;
    }
    if (actionId == 'remove_path' && this.initialCount <= this.initialCount_default) {
      return false;
    }
    return true;
  }

  preHandler(data: any[]): any[] {
    let paths = [];
    for (let i = 0; i < data.length; i++) {
      paths.push({path:data[i]});
    }
    return paths;
  }

  clean(data) {
    let paths = [];
    for (let i = 0; i < data.nfs_paths.length; i++) {
      paths.push(data.nfs_paths[i]['path']);
    }
    data.nfs_paths = paths;
    return data;
  }
}
