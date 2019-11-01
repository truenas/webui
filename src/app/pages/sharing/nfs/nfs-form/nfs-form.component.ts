import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray } from '@angular/forms';
import * as _ from 'lodash';

import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { UserService } from '../../../../services/user.service';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import { RestService, WebSocketService, DialogService, NetworkService } from '../../../../services/';
import { helptext_sharing_nfs } from 'app/helptext/sharing';
import { helptext_sharing_afp } from 'app/helptext/sharing';
import { T } from "app/translate-marker";

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
      type: 'list',
      name : 'nfs_paths',
      initialCount: 1,
      templateListField: [{
        name: 'path',
        placeholder: helptext_sharing_nfs.placeholder_path,
        tooltip: helptext_sharing_nfs.tooltip_path,
        type: 'explorer',
        explorerType: 'directory',
        initial: '/mnt',
        required: true,
        validation : helptext_sharing_nfs.validators_path
      }],
      listFields: []
    },
    {
      type: 'input',
      name: 'nfs_comment',
      placeholder: helptext_sharing_nfs.placeholder_comment,
      tooltip: helptext_sharing_nfs.tooltip_comment
    },
    {
      type: 'checkbox',
      name: 'nfs_alldirs',
      placeholder: helptext_sharing_nfs.placeholder_alldirs,
      tooltip: helptext_sharing_nfs.tooltip_alldirs
    },
    {
      type: 'checkbox',
      name: 'nfs_ro',
      placeholder: helptext_sharing_nfs.placeholder_ro,
      tooltip: helptext_sharing_nfs.tooltip_ro,
    },
    {
      type: 'checkbox',
      name: 'nfs_quiet',
      placeholder: helptext_sharing_nfs.placeholder_quiet,
      tooltip: helptext_sharing_nfs.tooltip_quiet,
    },
    {
      type: 'textarea',
      name: 'nfs_network',
      placeholder: helptext_sharing_nfs.placeholder_network,
      tooltip: helptext_sharing_nfs.tooltip_network,
      blurStatus : true,
      blurEvent: this.nfs_network_event,
      parent: this,
      value: ''
    },
    
       {
      type: 'textarea',
      name: 'nfs_hosts',
      placeholder: helptext_sharing_nfs.placeholder_hosts,
      tooltip: helptext_sharing_nfs.tooltip_hosts,
      blurStatus : true,
      blurEvent: this.nfs_hosts_event,
      parent: this,
      value: ''
    },
    {
      type: 'combobox',
      name: 'nfs_maproot_user',
      placeholder: helptext_sharing_nfs.placeholder_maproot_user,
      tooltip: helptext_sharing_nfs.tooltip_maproot_user,
      options: [],
      value: '',
      searchOptions: [],
      parent: this,
      updater: this.updateMapRootUserSearchOptions,
    },
    {
      type: 'combobox',
      name: 'nfs_maproot_group',
      placeholder: helptext_sharing_nfs.placeholder_maproot_group,
      tooltip: helptext_sharing_nfs.tooltip_maproot_group,
      options: [],
      value: '',
      searchOptions: [],
      parent: this,
      updater: this.updateMapRootGroupSearchOptions,
    },
    {
      type: 'combobox',
      name: 'nfs_mapall_user',
      placeholder: helptext_sharing_nfs.placeholder_mapall_user,
      tooltip: helptext_sharing_nfs.tooltip_mapall_user,
      options: [],
      value: '',
      searchOptions: [],
      parent: this,
      updater: this.updateMapAllUserSearchOptions,
    },
    {
      type: 'combobox',
      name: 'nfs_mapall_group',
      placeholder: helptext_sharing_nfs.placeholder_mapall_group,
      tooltip: helptext_sharing_nfs.tooltip_mapall_group,
      options: [],
      value: '',
      searchOptions: [],
      parent: this,
      updater: this.updateMapAllGroupSearchOptions,
    },
    {
      type: 'select',
      multiple: true,
      name: 'nfs_security',
      placeholder: helptext_sharing_nfs.placeholder_security,
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
      id : 'basic_mode',
      name : helptext_sharing_nfs.actions_basic_mode,
      function : () => { this.isBasicMode = !this.isBasicMode; }
    },
    {
      'id' : 'advanced_mode',
      name : helptext_sharing_nfs.actions_advanced_mode,
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

    this.userService.userQueryDSCache().subscribe(items => {
      const users = [{
        label: '---------',
        value: '',
      }];
      for (let i = 0; i < items.length; i++) {
        users.push({label: items[i].username, value: items[i].username});
      }
      this.nfs_mapall_user = _.find(this.fieldConfig, {'name' : 'nfs_mapall_user'});
      this.nfs_mapall_user.options = users;
      this.nfs_maproot_user = _.find(this.fieldConfig, {'name' : 'nfs_maproot_user'});
      this.nfs_maproot_user.options = users;
    });

    this.userService.groupQueryDSCache().subscribe(items => {
      const groups = [{
        label: '---------',
        value: '',
      }];
      for (let i = 0; i < items.length; i++) {
        groups.push({label: items[i].group, value: items[i].group});
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
          this.dialog.confirm(helptext_sharing_nfs.dialog_enable_service_title,
          helptext_sharing_nfs.dialog_enable_service_message,
          true, helptext_sharing_nfs.dialog_enable_service_button).subscribe((dialogRes) => {
            if (dialogRes) {
              entityForm.loader.open();
              this.ws.call('service.update', [service['id'], { enable: true }]).subscribe((updateRes) => {
                this.ws.call('service.start', [service.service]).subscribe((startRes) => {
                  entityForm.loader.close();
                  this.dialog.Info(T('NFS') + helptext_sharing_afp.shared.dialog_started_title, 
                  T('The NFS') + helptext_sharing_afp.shared.dialog_started_message, '250px').subscribe(() => {
                    this.router.navigate(new Array('/').concat(
                      this.route_success));
                })
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

  updateMapAllGroupSearchOptions(value = "", parent) {
    parent.updateGroupSearchOptions(value, parent, 'nfs_mapall_group');
  }

  updateMapRootGroupSearchOptions(value = "", parent) {
    parent.updateGroupSearchOptions(value, parent, 'nfs_maproot_group');
  }

  updateGroupSearchOptions(value = "", parent, field) {
    parent.userService.groupQueryDSCache(value).subscribe(items => {
      const groups = [];
      for (let i = 0; i < items.length; i++) {
        groups.push({label: items[i].group, value: items[i].group});
      }
      parent[field].searchOptions = groups;
    });
  }

  updateMapAllUserSearchOptions(value = "", parent) {
    parent.updateUserSearchOptions(value, parent, 'nfs_mapall_user');
  }

  updateMapRootUserSearchOptions(value = "", parent) {
    parent.updateUserSearchOptions(value, parent, 'nfs_maproot_user');
  }

  updateUserSearchOptions(value = "", parent, field) {
    parent.userService.userQueryDSCache(value).subscribe(items => {
      const users = [];
      for (let i = 0; i < items.length; i++) {
        users.push({label: items[i].username, value: items[i].username});
      }
      parent[field].searchOptions = users;
    });
  }
}
