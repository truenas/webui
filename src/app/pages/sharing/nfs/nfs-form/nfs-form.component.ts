import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { helptext_sharing_nfs, shared } from 'app/helptext/sharing';
import { FieldSets } from 'app/pages/common/entity/entity-form/classes/field-sets';
import { T } from "app/translate-marker";
import * as _ from 'lodash';
import { DialogService, NetworkService, RestService, WebSocketService } from '../../../../services/';
import { UserService } from '../../../../services/user.service';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';

@Component({
  selector : 'app-nfs-form',
  template : `<entity-form [conf]="this"></entity-form>`,
  providers: [NetworkService]
})
export class NFSFormComponent {

  protected route_success: string[] = [ 'sharing', 'nfs' ];
  protected queryCall = 'sharing.nfs.query';
  protected editCall = 'sharing.nfs.update';
  protected addCall = 'sharing.nfs.create';
  protected pk: number;
  protected queryKey = 'id';
  protected isEntity = true;
  protected isBasicMode = true;
  public entityForm: any;
  public save_button_enabled = true;

  public fieldSets = new FieldSets([
    {
      name: helptext_sharing_nfs.fieldset_general,
      class: 'general',
      label: true,
      config: [
        {
          type: 'list',
          name : 'paths',
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
          name: 'comment',
          placeholder: helptext_sharing_nfs.placeholder_comment,
          tooltip: helptext_sharing_nfs.tooltip_comment
        },
        {
          type: 'checkbox',
          name: 'alldirs',
          placeholder: helptext_sharing_nfs.placeholder_alldirs,
          tooltip: helptext_sharing_nfs.tooltip_alldirs
        },
        {
          type: 'checkbox',
          name: 'ro',
          placeholder: helptext_sharing_nfs.placeholder_ro,
          tooltip: helptext_sharing_nfs.tooltip_ro,
        },
        {
          type: 'checkbox',
          name: 'quiet',
          placeholder: helptext_sharing_nfs.placeholder_quiet,
          tooltip: helptext_sharing_nfs.tooltip_quiet,
        },
        {
          type: 'list',
          name: 'networks',
          templateListField: [{
            type: 'input',
            name: 'network',
            placeholder: helptext_sharing_nfs.placeholder_network,
            tooltip: helptext_sharing_nfs.tooltip_network,
            blurStatus : true,
            blurEvent: this.nfs_network_event,
            parent: this,
            value: ''
          }],
          listFields: []
        },
        {
          type: 'combobox',
          name: 'maproot_user',
          placeholder: helptext_sharing_nfs.placeholder_maproot_user,
          tooltip: helptext_sharing_nfs.tooltip_maproot_user,
          options: [],
          value: '',
          searchOptions: [],
          parent: this,
          updater: this.updateMapRootUserSearchOptions,
        },
        {
          type: 'list',
          name: 'hosts',
          templateListField: [{
            type: 'input',
            name: 'host',
            placeholder: helptext_sharing_nfs.placeholder_hosts,
            tooltip: helptext_sharing_nfs.tooltip_hosts,
            blurStatus : true,
            blurEvent: this.nfs_hosts_event,
            parent: this,
            value: ''
          }],
          listFields: []
        },
        {
          type: 'combobox',
          name: 'maproot_group',
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
          name: 'mapall_user',
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
          name: 'mapall_group',
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
          name: 'security',
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
      ]
    }
  ]);

  protected arrayControl: any;

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
    'quiet',
    'networks',
    'hosts',
    'maproot_user',
    'maproot_group',
    'mapall_user',
    'mapall_group',
    'security',
  ];

  constructor(protected router: Router,
              protected entityFormService: EntityFormService,
              protected route: ActivatedRoute,
              protected userService: UserService,
              protected rest: RestService,
              protected ws: WebSocketService, private dialog:DialogService,
              public networkService: NetworkService) {}

  preInit(EntityForm: any) {
    this.arrayControl = this.fieldSets.config('paths');
    this.route.params.subscribe(params => {
      if(params['pk']) {
        this.pk = parseInt(params['pk'], 10);
      }
    });

    this.ws.call("nfs.config", []).subscribe(nfsConfig => {
      this.fieldSets.config("security").isHidden = !nfsConfig.v4;
    });
  }

  afterInit(EntityForm: any) {
    this.entityForm = EntityForm;

    this.userService.userQueryDSCache().subscribe(items => {
      const users = [{
        label: '---------',
        value: '',
      }];
      for (let i = 0; i < items.length; i++) {
        users.push({label: items[i].username, value: items[i].username});
      }
      this.nfs_mapall_user = this.fieldSets.config('mapall_user');
      this.nfs_mapall_user.options = users;
      this.nfs_maproot_user = this.fieldSets.config('maproot_user');
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
      this.nfs_mapall_group = this.fieldSets.config('mapall_group');
      this.nfs_mapall_group.options = groups;
      this.nfs_maproot_group = this.fieldSets.config('maproot_group');
      this.nfs_maproot_group.options = groups;
    });
  }
  nfs_hosts_event(parent: any){
      parent.fieldSets.config('hosts').warnings = null;

      if(parent.entityForm) {
        if(parent.entityForm.formGroup.controls['host'].value !=='') {
        const network_string = parent.entityForm.formGroup.controls['host'].value.split(/[\s,]+/);
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
          parent.entityForm.fieldSets.config('hosts').warnings = `Following IP Address/hostname appears to be wrong ${error_msg}`
          parent.save_button_enabled = false;
  
        } else {
          parent.entityForm.fieldSets.config('hosts').warnings = null;
          parent.save_button_enabled = true;
        };
      };
    };
  };
  nfs_network_event(parent){
    parent.fieldSets.config('network').warnings = false;
    if(parent.entityForm) {
      if(parent.entityForm.formGroup.controls['network'].value !=='') {
        const network_string = parent.entityForm.formGroup.controls['network'].value.split(/[\s,]+/);
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
          parent.entityForm.fieldSets.config('network').warnings = `Following Network appears to be wrong ${error_msg}`;
          parent.save_button_enabled = false;
        } else { 
          parent.entityForm.fieldSets.config('network').warnings = null;
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
    return true;
  }

  // preHandler(data: any[]): any[] {
  //   const paths = [];
  //   for (let i = 0; i < data.length; i++) {
  //     paths.push({path:data[i]});
  //   }
  //   return paths;
  // }

  resourceTransformIncomingRestData(data) {
    const paths = [];
    for (let i = 0; i < data['paths'].length; i++) {
      paths.push({'path':data['paths'][i]});
    }
    data['paths'] = paths;

    const networks = [];
    for (let i = 0; i < data['networks'].length; i++) {
      paths.push({'network':data['networks'][i]});
    }
    data['networks'] = networks;

    const hosts = [];
    for (let i = 0; i < data['hosts'].length; i++) {
      paths.push({'host':data['hosts'][i]});
    }
    data['hosts'] = hosts;

    console.log({ in: data });
    return data;
  }

  beforeSubmit(data) {
    const d = {
      ...data,
      paths: data.paths.filter(p => !!p.path).map(p => p.path),
      networks: data.networks.filter(n => !!n.network).map(n => n.network),
      hosts: data.hosts.filter(h => !!h.host).map(h => h.host)
    };
    console.log({ in: d });
    return d;
  }

  afterSave(entityForm) {
    this.ws.call('service.query', [[]]).subscribe((res) => {
      const service = _.find(res, {"service": "nfs"});
      if (service['enable']) {
        this.router.navigate(new Array('/').concat(
          this.route_success));
      } else {
          this.dialog.confirm(shared.dialog_title, shared.dialog_message,
          true, shared.dialog_button).subscribe((dialogRes) => {
            if (dialogRes) {
              entityForm.loader.open();
              this.ws.call('service.update', [service['id'], { enable: true }]).subscribe((updateRes) => {
                this.ws.call('service.start', [service.service]).subscribe((startRes) => {
                  entityForm.loader.close();
                  this.dialog.Info(T('NFS') + shared.dialog_started_title, 
                  T('The NFS') + shared.dialog_started_message, '250px').subscribe(() => {
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
    parent.updateGroupSearchOptions(value, parent, 'mapall_group');
  }

  updateMapRootGroupSearchOptions(value = "", parent) {
    parent.updateGroupSearchOptions(value, parent, 'maproot_group');
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
    parent.updateUserSearchOptions(value, parent, 'mapall_user');
  }

  updateMapRootUserSearchOptions(value = "", parent) {
    parent.updateUserSearchOptions(value, parent, 'maproot_user');
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
