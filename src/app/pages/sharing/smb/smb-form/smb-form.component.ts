import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';

import { RestService, WebSocketService, DialogService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { helptext_sharing_smb } from 'app/helptext/sharing';
import { FormControl } from '@angular/forms';

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
  public identifier: any;

  protected fieldConfig: FieldConfig[] = [
    {
      type : 'explorer',
      initial: '/mnt',
      explorerType: 'directory',
      name: 'cifs_path',
      placeholder: helptext_sharing_smb.placeholder_path,
      tooltip: helptext_sharing_smb.tooltip_path,
      required: true,
      validation : helptext_sharing_smb.validators_path
    },
    {
      type: 'input',
      name: 'cifs_name',
      placeholder: helptext_sharing_smb.placeholder_name,
      tooltip: helptext_sharing_smb.tooltip_name,
      validation: this.forbiddenNameValidator.bind(this),
      hasErrors: false,
      errors: 'Dang'
    },
    {
      type: 'checkbox',
      name: 'cifs_home',
      placeholder: helptext_sharing_smb.placeholder_home,
      tooltip: helptext_sharing_smb.tooltip_home,
    },
    {
      type: 'checkbox',
      name: 'cifs_timemachine',
      placeholder: helptext_sharing_smb.placeholder_timemachine,
      tooltip: helptext_sharing_smb.tooltip_timemachine,
    },
    {
      type: 'checkbox',
      name: 'cifs_default_permissions',
      placeholder: helptext_sharing_smb.placeholder_default_permissions,
      tooltip: helptext_sharing_smb.tooltip_default_permissions,
      value: false
    },
    {
      type: 'checkbox',
      name: 'cifs_ro',
      placeholder: helptext_sharing_smb.placeholder_ro,
      tooltip: helptext_sharing_smb.tooltip_ro
    },
    {
      type: 'checkbox',
      name: 'cifs_browsable',
      placeholder: helptext_sharing_smb.placeholder_browsable,
      tooltip: helptext_sharing_smb.tooltip_browsable,
    },
    {
      type: 'checkbox',
      name: 'cifs_recyclebin',
      placeholder: helptext_sharing_smb.placeholder_recyclebin,
      tooltip: helptext_sharing_smb.tooltip_recyclebin
    },
    {
      type: 'checkbox',
      name: 'cifs_showhiddenfiles',
      placeholder: helptext_sharing_smb.placeholder_showhiddenfiles,
      tooltip: helptext_sharing_smb.tooltip_showhiddenfiles
    },
    {
      type: 'checkbox',
      name: 'cifs_guestok',
      placeholder: helptext_sharing_smb.placeholder_guestok,
      tooltip: helptext_sharing_smb.tooltip_guestok
    },
    {
      type: 'checkbox',
      name: 'cifs_guestonly',
      placeholder: helptext_sharing_smb.placeholer_guestonly,
      tooltip: helptext_sharing_smb.tooltip_guestonly
    },
    {
      type: 'checkbox',
      name: 'cifs_abe',
      placeholder: helptext_sharing_smb.placeholder_abe,
      tooltip: helptext_sharing_smb.tooltip_abe
    },
    {
      type: 'textarea',
      name: 'cifs_hostsallow',
      placeholder: helptext_sharing_smb.placeholder_hostsallow,
      tooltip: helptext_sharing_smb.tooltip_hostsallow
    },
    {
      type: 'textarea',
      name: 'cifs_hostsdeny',
      placeholder: helptext_sharing_smb.placeholder_hostsdeny,
      tooltip: helptext_sharing_smb.tooltip_hostsdeny
    },
    {
      type: 'select',
      name: 'cifs_vfsobjects',
      placeholder: helptext_sharing_smb.placeholder_vfsobjects,
      tooltip: helptext_sharing_smb.tooltip_vfsobjects,
      options: [],
      multiple: true,
    },
    {
      type: 'select',
      name: 'cifs_storage_task',
      placeholder: 'Periodic Snapshot Task',
      tooltip: helptext_sharing_smb.tooltip_storage_task,
      options: []
    },
    {
      type: 'textarea',
      name: 'cifs_auxsmbconf',
      placeholder: helptext_sharing_smb.placeholder_auxsmbconf,
      tooltip: helptext_sharing_smb.tooltip_auxsmbconf,
    },
  ];

  private cifs_vfsobjects: any;

  protected advanced_field: Array<any> = [
    'cifs_auxsmbconf',
    'cifs_vfsobjects',
    'cifs_hostsdeny',
    'cifs_hostsallow',
    'cifs_guestonly',
    'cifs_abe',
    'cifs_showhiddenfiles',
    'cifs_recyclebin',
    'cifs_browsable',
    'cifs_default_permissions',
    'cifs_ro',
  ];

  public custActions: Array<any> = [
    {
      id : 'basic_mode',
      name : helptext_sharing_smb.actions_basic_mode,
      function : () => { this.isBasicMode = !this.isBasicMode; }
    },
    {
      'id' : 'advanced_mode',
      name : helptext_sharing_smb.actions_advanced_mode,
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
      if (service.enable) {
        this.router.navigate(new Array('/').concat(
          this.route_success));
      } else {
          this.dialog.confirm(helptext_sharing_smb.dialog_enable_service_title,
          helptext_sharing_smb.dialog_enable_service_message,
          true, helptext_sharing_smb.dialog_enable_service_button).subscribe((dialogRes) => {
            if (dialogRes) {
              entityForm.loader.open();
              this.ws.call('service.update', [service.id, { enable: true }]).subscribe((updateRes) => {
                this.ws.call('service.start', [service.service]).subscribe((startRes) => {
                  entityForm.loader.close();
                  entityForm.snackBar.open(helptext_sharing_smb.snackbar_service_started, helptext_sharing_smb.snackbar_close);
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
        this.dialog.confirm(helptext_sharing_smb.dialog_warning, helptext_sharing_smb.dialog_warning_message)
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
          const options = [];
          res.forEach((item) => {
            options.push({label : item, value : item});
          });
          this.cifs_vfsobjects.options = _.sortBy(options, ['label']);
        });
    if (entityForm.isNew) {
      entityForm.formGroup.controls['cifs_vfsobjects'].setValue(['zfs_space','zfsacl','streams_xattr']);
      entityForm.formGroup.controls['cifs_browsable'].setValue(true);
    }

    entityForm.formGroup.controls['cifs_name'].statusChanges.subscribe((res) => {
      let target = _.find(this.fieldConfig, {'name' : 'cifs_name'});
      res === 'INVALID' ? target.hasErrors = true : target.hasErrors = false;
    })
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

  forbiddenNameValidator(control: FormControl): {[key: string]: boolean} {
    if (control.value === 'global') {
      
      _.find(this.fieldConfig).hasErrors = true;
      return {'nameIsForbidden': true}
    }
    return null;
  }

  ngOnDestroy() {
    this.cifs_default_permissions_subscription.unsubscribe();
  }
}
