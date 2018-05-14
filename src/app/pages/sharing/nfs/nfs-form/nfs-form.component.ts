import { Component, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, Validators } from '@angular/forms';
import * as _ from 'lodash';

import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { UserService } from '../../../../services/user.service';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import { RestService } from '../../../../services/rest.service';
import { T } from '../../../../translate-marker';

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
        placeholder: T('Path'),
        tooltip: T('Browse to the pool or dataset to be shared. Click\
                    <b>Add extra path</b> to select multiple paths.'),
        type: 'explorer',
        explorerType: 'directory',
        initial: '/mnt',
        required: true,
        validation : [ Validators.required ]
      },
      {
        type: 'checkbox',
        name: 'delete',
        placeholder: T('Delete'),
      }]
    },
    {
      type: 'input',
      name: 'nfs_comment',
      placeholder: T('Comment'),
      tooltip: T('Set the share name. If left empty, share name is the\
                  list of selected <b>Path</b> entries.')
    },
    {
      type: 'checkbox',
      name: 'nfs_alldirs',
      placeholder: T('All dirs'),
      tooltip: T('Set to allow the client to mount any\
                  subdirectory within the <b>Path</b>.')
    },
    {
      type: 'checkbox',
      name: 'nfs_ro',
      placeholder: T('Read Only'),
      tooltip: T('Set to prohibit writing to the share.'),
    },
    {
      type: 'checkbox',
      name: 'nfs_quiet',
      placeholder: T('Quiet'),
      tooltip: T('Set to inhibit some syslog diagnostics\
                  to avoid error messages. See\
                  <a href="https://www.freebsd.org/cgi/man.cgi?query=exports"\
                  target="_blank">exports(5)</a> for examples.'),
    },
    {
      type: 'textarea',
      name: 'nfs_network',
      placeholder: T('Authorized Networks'),
      tooltip: T('Space-delimited list of allowed networks in\
                  network/mask CIDR notation.\
                  Example: <i>1.2.3.0/24</i>. Leave empty\
                  to allow all.'),
    },
       {
      type: 'textarea',
      name: 'nfs_hosts',
      placeholder: T('Authorized Hosts and IP addresses'),
      tooltip: T('Space-delimited list of allowed IP addresses or\
                  hostnames. Leave empty to allow all.'),
    },
    {
      type: 'select',
      name: 'nfs_maproot_user',
      placeholder: T('Maproot User'),
      tooltip: T('When a user is selected, the <i>root</i> user is\
                  limited to the permissions of that user.'),
      options: []
    },
    {
      type: 'select',
      name: 'nfs_maproot_group',
      placeholder: T('Maproot Group'),
      tooltip: T('When a group is selected, the <i>root</i> user is also\
                  limited to the permissions of that group.'),
      options: []
    },
    {
      type: 'select',
      name: 'nfs_mapall_user',
      placeholder: T('Mapall User'),
      tooltip: T('The specified permissions of that user are used\
                  by all clients.'),
      options: []
    },
    {
      type: 'select',
      name: 'nfs_mapall_group',
      placeholder: T('Mapall Group'),
      tooltip: T('The specified permissions of that group are used\
                  by all clients.'),
      options: []
    },
    {
      type: 'select',
      multiple: true,
      name: 'nfs_security',
      placeholder: T('Security'),
      options: [
        {
          label: 'sys',
          value: 'sys',
        },
        {
          label: 'krb5',
          value: 'krb5',
        },
        {
          label: 'krb5i',
          value: 'krb5i',
        },
        {
          label: 'krb5p',
          value: 'krb5p',
        }
      ],
      isHidden: false,
    }
  ];

  protected arrayControl: any;
  protected initialCount: number = 1;
  protected initialCount_default: number = 1;

  public custActions: Array<any> = [
    {
      id : 'add_path',
      name : T('Add Additional Path'),
      function : () => {
        this.initialCount += 1;
        this.entityFormService.insertFormArrayGroup(
            this.initialCount, this.formArray, this.arrayControl.formarray);
      }
    },
    {
      id : 'remove_path',
      name : T('Remove Additional Path'),
      function : () => {
        this.initialCount -= 1;
        this.entityFormService.removeFormArrayGroup(this.initialCount,
                                                    this.formArray);
      }
    },
    {
      id : 'basic_mode',
      name : T('Basic Mode'),
      function : () => { this.isBasicMode = !this.isBasicMode; }
    },
    {
      'id' : 'advanced_mode',
      name : T('Advanced Mode'),
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
    'nfs_mapall_group',
    'nfs_security',
  ];

  constructor(protected router: Router,
              protected entityFormService: EntityFormService,
              protected route: ActivatedRoute,
              protected userService: UserService,
              protected rest: RestService ) {}

  preInit(EntityForm: any) {
    this.arrayControl =
      _.find(this.fieldConfig, {'name' : 'nfs_paths'});
    this.route.params.subscribe(params => {
      if(params['pk']) {
         this.arrayControl.initialCount = this.initialCount = this.initialCount_default = 0;
      }
    });

    this.rest.get('services/nfs', {}).subscribe((res) => {
      if (res.data['nfs_srv_v4']) {
        _.find(this.fieldConfig, {'name' : 'nfs_security'}).isHidden = false;
      } else {
        _.find(this.fieldConfig, {'name' : 'nfs_security'}).isHidden = true;
      }
    });

  }

  afterInit(EntityForm: any) {
    this.formArray = EntityForm.formGroup.controls['nfs_paths'];

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
      if(!data.nfs_paths[i]['delete']) {
        paths.push(data.nfs_paths[i]['path']);
      }
    }
    data.nfs_paths = paths;
    return data;
  }
}
