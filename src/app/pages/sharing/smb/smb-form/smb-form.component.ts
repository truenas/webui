import { Component, ViewContainerRef, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import {Validators} from '@angular/forms';
import * as _ from 'lodash';

import { RestService, WebSocketService, DialogService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { T } from '../../../../translate-marker';

@Component({
  selector : 'app-smb-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class SMBFormComponent implements OnDestroy {

  protected resource_name: string = 'sharing/cifs/';
  protected route_success: string[] = [ 'sharing', 'smb' ];
  protected isEntity: boolean = true;
  protected isBasicMode: boolean = true;
  public cifs_default_permissions: any;
  public cifs_default_permissions_subscription: any;
  public cifs_storage_task: any;

  protected fieldConfig: FieldConfig[] = [
    {
      type : 'explorer',
      initial: '/mnt',
      explorerType: 'directory',
      name: 'cifs_path',
      placeholder: T('Path'),
      tooltip: T('Select pool, dataset, or directory to share.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type: 'input',
      name: 'cifs_name',
      placeholder: T('Name'),
      tooltip: T('Enter a name for the share.')
    },
    {
      type: 'checkbox',
      name: 'cifs_home',
      placeholder: T('Use as home share'),
      tooltip: T('Set to allow this share to hold user home\
                  directories. Only one share can be\
                  the home share.\
                  Note: Lower case names for user home\
                  directories are strongly recommended, as Samba\
                  maps usernames to all lower case. For example, the\
                  username John will be mapped to a home directory\
                  named john. If the <i>Path</i> to the home share\
                  includes an upper case username, delete the existing user\
                  and recreate it in <i>Accounts --> Users</i>\
                  with an all lower case <i>Username</i>. Return\
                  to <i>Sharing --> SMB</i> to create the home share,\
                  and select the </i>Path</i> that contains the new\
                  lower case username.'),
    },
    {
      type: 'checkbox',
      name: 'cifs_default_permissions',
      placeholder: T('Default Permissions'),
      tooltip: T('When enabled, the ACLs grant read and write access for\
                  owner or group and read-only for others.\
                  <b>Only</b> leave unset when creating a share on a\
                  system that already has custom\
                  ACLs configured.'),
      value: false
    },
    {
      type: 'checkbox',
      name: 'cifs_ro',
      placeholder: T('Export Read Only'),
      tooltip: T('Set to prohibit writes to this share')
    },
    {
      type: 'checkbox',
      name: 'cifs_browsable',
      placeholder: T('Browsable to Network Clients'),
      tooltip: T('When set, users see the contents of <i>/homes</i>,\
                  which includes the home directories of other users.\
                  When unset, users only see their own\
                  home directory.'),
    },
    {
      type: 'checkbox',
      name: 'cifs_recyclebin',
      placeholder: T('Export Recycle Bin'),
      tooltip: T('When set, deleted files are moved to a hidden\
                  <b>.recycle</b> in the root folder of the share.\
                  The <b>.recycle</b> directory can be\
                  deleted to reclaim space and is automatically\
                  recreated when a file is deleted.')
    },
    {
      type: 'checkbox',
      name: 'cifs_showhiddenfiles',
      placeholder: T('Show Hidden Files'),
      tooltip: T('Set to disable the Windows <i>hidden</i> attribute\
                  on a new Unix hidden file. Unix hidden filenames start\
                  with a dot: <b>.foo</b>.\
                  Existing files are not affected.')
    },
    {
      type: 'checkbox',
      name: 'cifs_guestok',
      placeholder: T('Allow Guest Access'),
      tooltip: T('Set to allow access to this share without a password.\
                  See the <a href="%%docurl%%/services.html%%webversion%%#smb"\
                  target="_blank">SMB</a> service documentation for more\
                  information about guest user permissions.')
    },
    {
      type: 'checkbox',
      name: 'cifs_guestonly',
      placeholder: T('Only Allow Guest Access'),
      tooltip: T('Requires <b>Allow guest access</b> to also be set.\
                  Forces guest access for all connections.')
    },
    {
      type: 'textarea',
      name: 'cifs_hostsallow',
      placeholder: T('Hosts Allow'),
      tooltip: T('Enter a list of allowed hostnames or IP addresses.\
                  Separate entries with a comma, space, or tab.')
    },
    {
      type: 'textarea',
      name: 'cifs_hostsdeny',
      placeholder: T('Hosts Deny'),
      tooltip: T('Enter a list of denied hostnames or IP addresses.\
                  Separate entries with a comma, space, or tab.\
                  Specify <i>ALL</i> and list any hosts from\
                  <b>Hosts Allow</b> to have those hosts take\
                  precedence.')
    },
    {
      type: 'select',
      name: 'cifs_vfsobjects',
      placeholder: T('VFS Objects'),
      tooltip: T('Adds <a\
                  href="%%docurl%%/sharing.html%%webversion%%#avail-vfs-modules-tab"\
                  target="blank">virtual file system modules</a> to\
                  enhance functionality.'),
      options: [],
      multiple: true,
    },
    {
      type: 'select',
      name: 'cifs_storage_task',
      placeholder: 'Periodic Snapshot Task',
      tooltip: T('Used to configure directory shadow copies on a\
                  per-share basis. Select the pre-configured periodic\
                  snapshot task to use for the shadow copies of this\
                  share. Periodic snapshots must be recursive.'),
      options: []
    },
    {
      type: 'textarea',
      name: 'cifs_auxsmbconf',
      placeholder: T('Auxiliary Parameters'),
      tooltip: T('Additional <b>smb5.conf</b> parameters not covered by\
                  other option fields.'),
    },
  ];

  private cifs_vfsobjects: any;

  protected advanced_field: Array<any> = [
    'cifs_auxsmbconf',
    'cifs_vfsobjects',
    'cifs_hostsdeny',
    'cifs_hostsallow',
    'cifs_guestonly',
    'cifs_showhiddenfiles',
    'cifs_recyclebin',
    'cifs_browsable',
    'cifs_default_permissions',
    'cifs_ro',
  ];

  public custActions: Array<any> = [
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

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService, private dialog:DialogService ) {}

  isCustActionVisible(actionId: string) {
    if (actionId == 'advanced_mode' && this.isBasicMode == false) {
      return false;
    } else if (actionId == 'basic_mode' && this.isBasicMode == true) {
      return false;
    }
    return true;
  }

  afterSave(entityForm) {
    this.ws.call('service.query', [[]]).subscribe((res) => {
      const service = _.find(res, {"service": "cifs"});
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

  afterInit(entityForm: any) {
    this.cifs_default_permissions = entityForm.formGroup.controls['cifs_default_permissions'];
    if (entityForm.isNew) {
      this.cifs_default_permissions.setValue(true);
    }
    this.cifs_default_permissions_subscription = this.cifs_default_permissions.valueChanges.subscribe((value) => {
      if (value === true) {
        this.dialog.confirm(T("Warning"), T("Setting default permissions will reset the permissions of this share and any others within its path."))
        .subscribe((res) => {
          if (!res) {
            this.cifs_default_permissions.setValue(false);
          }
        });
      }
    });
    entityForm.ws.call('sharing.smb.vfsobjects_choices', [])
        .subscribe((res) => {
          this.cifs_vfsobjects =
              _.find(this.fieldConfig, {'name': "cifs_vfsobjects"});
          res.forEach((item) => {
            this.cifs_vfsobjects.options.push({label : item, value : item});
          });
        });
    if (entityForm.isNew) {
      entityForm.formGroup.controls['cifs_vfsobjects'].setValue(['zfs_space','zfsacl','streams_xattr']);
      entityForm.formGroup.controls['cifs_browsable'].setValue(true);
    }
  }

  resourceTransformIncomingRestData(data) {
    this.cifs_storage_task = _.find(this.fieldConfig, {name:"cifs_storage_task"});

    let filters = [];
    filters.push(data.cifs_path);

    this.ws.call('sharing.smb.get_storage_tasks', filters).subscribe((res) => {
      if(res) {
        for (const key in res) {
          if (res.hasOwnProperty(key)) {
            this.cifs_storage_task.options.push({label: res[key], value: parseInt(key)});
          }
        }
      }
    });

    return data;
  }

  ngOnDestroy() {
    this.cifs_default_permissions_subscription.unsubscribe();
  }
}
