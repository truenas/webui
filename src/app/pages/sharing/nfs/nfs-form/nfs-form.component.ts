import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, Validators } from '@angular/forms';
import * as _ from 'lodash';

import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { UserService } from '../../../../services/user.service';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import { RestService, WebSocketService, DialogService, NetworkService } from '../../../../services/';
import { T } from '../../../../translate-marker';

@Component({
  selector : 'app-nfs-form',
  template : `<entity-form [conf]="this"></entity-form>`,
  providers: [NetworkService]
})
export class NFSFormComponent {

  protected route_success: string[] = [ 'sharing', 'nfs' ];
  protected resource_name = 'sharing/nfs/';
  protected isEntity = true;
  protected formArray: FormArray;
  protected isBasicMode = true;
  public entityForm: any;
  public save_button_enabled = true;

  protected fieldConfig: FieldConfig[] = [
    {
      type: 'array',
      name : 'nfs_paths',
      initialCount: 1,
      formarray: [{
        name: 'path',
        placeholder: T('Path'),
        tooltip: T('Full path to the pool or dataset to share. Mandatory.\
                    Click <b>ADD ADDITIONAL PATH</b> to configure\
                    multiple paths.'),
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
      blurStatus : true,
      blurEvent: this.nfs_network_event,
      parent: this,
      value: ''
    },
    
       {
      type: 'textarea',
      name: 'nfs_hosts',
      placeholder: T('Authorized Hosts and IP addresses'),
      tooltip: T('Space-delimited list of allowed IP addresses\
                  <i>(192.168.1.10)</i> or hostnames\
                  <i>(www.freenas.com)</i>. Leave empty to allow all.'),
      blurStatus : true,
      blurEvent: this.nfs_hosts_event,
      parent: this,
      value: ''
    },
    {
      type: 'select',
      name: 'nfs_maproot_user',
      placeholder: T('Maproot User'),
      tooltip: T('When a user is selected, the <i>root</i> user is\
                  limited to the permissions of that user.'),
      options: [],
      value: '',
    },
    {
      type: 'select',
      name: 'nfs_maproot_group',
      placeholder: T('Maproot Group'),
      tooltip: T('When a group is selected, the <i>root</i> user is also\
                  limited to the permissions of that group.'),
      options: [],
      value: '',
    },
    {
      type: 'select',
      name: 'nfs_mapall_user',
      placeholder: T('Mapall User'),
      tooltip: T('The specified permissions of that user are used\
                  by all clients.'),
      options: [],
      value: '',
    },
    {
      type: 'select',
      name: 'nfs_mapall_group',
      placeholder: T('Mapall Group'),
      tooltip: T('The specified permissions of that group are used\
                  by all clients.'),
      options: [],
      value: '',
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
      value: []
    }
  ];

  protected arrayControl: any;
  protected initialCount = 1;
  protected initialCount_default = 1;

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
              protected rest: RestService,
              protected ws: WebSocketService, private dialog:DialogService,
              public networkService: NetworkService) {}

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
        _.find(this.fieldConfig, {'name' : 'nfs_security'})['isHidden'] = false;
      } else {
        _.find(this.fieldConfig, {'name' : 'nfs_security'})['isHidden'] = true;
      }
    });

  }

  afterInit(EntityForm: any) {
    this.entityForm = EntityForm;
    this.formArray = EntityForm.formGroup.controls['nfs_paths'];

    this.userService.listUsers().subscribe(res => {
      const users = [{
        label: '---------',
        value: '',
      }];
      for (const user of res.data) {
        users.push({label: user['bsdusr_username'], value: user['bsdusr_username']});
      }
      this.nfs_mapall_user = _.find(this.fieldConfig, {'name' : 'nfs_mapall_user'});
      this.nfs_mapall_user.options = users;
      this.nfs_maproot_user = _.find(this.fieldConfig, {'name' : 'nfs_maproot_user'});
      this.nfs_maproot_user.options = users;
    });

    this.userService.listGroups().subscribe(res => {
      const groups = [{
        label: '---------',
        value: '',
      }];
      for (const group of res.data) {
        groups.push({label: group['bsdgrp_group'], value: group['bsdgrp_group']});
      }
      this.nfs_mapall_group = _.find(this.fieldConfig, {'name' : 'nfs_mapall_group'});
      this.nfs_mapall_group.options = groups;
      this.nfs_maproot_group = _.find(this.fieldConfig, {'name' : 'nfs_maproot_group'});
      this.nfs_maproot_group.options = groups;
    });
  }
  nfs_hosts_event(parent){
    _.find(parent.fieldConfig, {'name' : 'nfs_hosts'})['warnings'] = null;
  
      if(parent.entityForm) {
        if(parent.entityForm.formGroup.controls['nfs_hosts'].value !=='') {
        const network_string = parent.entityForm.formGroup.controls['nfs_hosts'].value.split(/[\s,]+/);
        let error_msg = ""
        let warning_flag = false
        for (const ip of network_string) {
          
          const ValidIpAddressRegex = parent.networkService.ipv4_regex;
          const ValidHostnameRegex = parent.networkService.hostname_regex;
          const ValidIPV6Address = parent.networkService.ipv6_regex;

          if (!ValidIpAddressRegex.test(ip)) {
            if (!ValidHostnameRegex.test(ip)) {
              if(!ValidIPV6Address.test(ip)){
                error_msg = error_msg +`${ip} `;
                warning_flag= true;
              }
            }
          }
        }
        if (warning_flag && error_msg !==" ") {
          _.find(parent.entityForm.fieldConfig, { 'name': 'nfs_hosts' })['warnings'] = `Following IP Address/hostname appears to be wrong ${error_msg}`
          parent.save_button_enabled = false;
  
        } else {
          _.find(parent.entityForm.fieldConfig, { 'name': 'nfs_hosts' })['warnings'] = null;
          parent.save_button_enabled = true;
        };
      };
    };
  };
  nfs_network_event(parent){
    _.find(parent.fieldConfig, {'name' : 'nfs_network'})['warnings'] = false;
    if(parent.entityForm) {
      if(parent.entityForm.formGroup.controls['nfs_network'].value !=='') {
        const network_string = parent.entityForm.formGroup.controls['nfs_network'].value.split(/[\s,]+/);
        let error_msg = ""
        let warning_flag = false
        for (const ip of network_string) {
          const ValidIpSubnetRegex = parent.networkService.ipv4_cidr_regex;
          const ValidIPV6SubnetRegEx = parent.networkService.ipv6_cidr_regex;
          if (!ValidIpSubnetRegex.test(ip)) {
              if(!ValidIPV6SubnetRegEx.test(ip)){
                error_msg = error_msg + ` ${ip}`;
                warning_flag= true;
              }
            
          }
        }
        if (warning_flag && error_msg !==" ") {
          _.find(parent.entityForm.fieldConfig, { 'name': 'nfs_network' })['warnings'] = `Following Network appears to be wrong ${error_msg}`;
          parent.save_button_enabled = false;
  
        } else { 
          _.find(parent.entityForm.fieldConfig, { 'name': 'nfs_network' })['warnings'] = null;
          parent.save_button_enabled = true;
        }

      }

 
    }
  }

  isCustActionVisible(actionId: string) {
    if (actionId === 'advanced_mode' && this.isBasicMode === false) {
      return false;
    } else if (actionId === 'basic_mode' && this.isBasicMode === true) {
      return false;
    }
    if (actionId === 'remove_path' && this.initialCount <= this.initialCount_default) {
      return false;
    }
    return true;
  }

  preHandler(data: any[]): any[] {
    const paths = [];
    for (let i = 0; i < data.length; i++) {
      paths.push({path:data[i]});
    }
    return paths;
  }

  clean(data) {
    const paths = [];
    for (let i = 0; i < data.nfs_paths.length; i++) {
      if(!data.nfs_paths[i]['delete']) {
        paths.push(data.nfs_paths[i]['path']);
      }
    }
    data.nfs_paths = paths;
    return data;
  }

  afterSave(entityForm) {
    this.ws.call('service.query', [[]]).subscribe((res) => {
      const service = _.find(res, {"service": "nfs"});
      if (service['enable']) {
        this.router.navigate(new Array('/').concat(
          this.route_success));
      } else {
          this.dialog.confirm(T("Enable service"),
          T("Enable this service?"),
          true, T("Enable Service")).subscribe((dialogRes) => {
            if (dialogRes) {
              entityForm.loader.open();
              this.ws.call('service.update', [service['id'], { enable: true }]).subscribe((updateRes) => {
                this.ws.call('service.start', [service.service]).subscribe((startRes) => {
                  entityForm.loader.close();
                  entityForm.snackBar.open(T("Service started"), T("close"));
                  this.router.navigate(new Array('/').concat(
                   this.route_success));
                }, (err) => {
                  entityForm.loader.close();
                  this.dialog.errorReport(err.error, err.reason, err.trace.formatted);
                  this.router.navigate(new Array('/').concat(
                    this.route_success));
                });
               }, (err) => {
                entityForm.loader.close();
                this.dialog.errorReport(err.error, err.reason, err.trace.formatted);
                this.router.navigate(new Array('/').concat(
                  this.route_success));
               });
           } else {
            this.router.navigate(new Array('/').concat(
              this.route_success));
            }
        });
      }

    });
  }
}
