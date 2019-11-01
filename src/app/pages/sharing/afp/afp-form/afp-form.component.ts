import { Component, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { WebSocketService, DialogService } from '../../../../services/';
import * as _ from 'lodash';

import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { shared, helptext_sharing_afp } from 'app/helptext/sharing';
import { T } from "app/translate-marker";

@Component({
  selector : 'app-afp-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class AFPFormComponent implements OnDestroy {

  protected route_success: string[] = [ 'sharing', 'afp' ];
  protected resource_name  = 'sharing/afp/';
  protected isEntity = true;
  protected isBasicMode = true;
  public afp_timemachine: any;
  public afp_timemachine_quota: any;
  public afp_timemachine_subscription: any;

  public fieldConfig: FieldConfig[] = [
    {
      type : 'explorer',
      initial: '/mnt',
      explorerType: 'directory',
      name: 'afp_path',
      placeholder: helptext_sharing_afp.placeholder_path,
      tooltip: helptext_sharing_afp.tooltip_path,
      required: true,
      validation : helptext_sharing_afp.validators_path
    },
    {
      type: 'input',
      name: 'afp_name',
      placeholder: helptext_sharing_afp.placeholder_name,
      tooltip: helptext_sharing_afp.tooltip_name
    },
    {
      type: 'input',
      name: 'afp_comment',
      placeholder: helptext_sharing_afp.placeholder_comment,
      tooltip: helptext_sharing_afp.tooltip_comment
    },
    {
      type: 'input',
      name: 'afp_allow',
      placeholder: helptext_sharing_afp.placeholder_allow,
      tooltip: helptext_sharing_afp.tooltip_allow
    },
    {
      type: 'input',
      name: 'afp_deny',
      placeholder: helptext_sharing_afp.placeholder_deny,
      tooltip: helptext_sharing_afp.tooltip_deny
    },
    {
      type: 'input',
      name: 'afp_ro',
      placeholder: helptext_sharing_afp.placeholder_ro,
      tooltip: helptext_sharing_afp.tooltip_ro
    },
    {
      type: 'input',
      name: 'afp_rw',
      placeholder: helptext_sharing_afp.placeholder_rw,
      tooltip: helptext_sharing_afp.tooltip_rw
    },
    {
      type: 'checkbox',
      name: 'afp_timemachine',
      placeholder: helptext_sharing_afp.placeholder_timemachine,
      tooltip: helptext_sharing_afp.tooltip_timemachine,
    },
    {
      type: 'input',
      name: 'afp_timemachine_quota',
      placeholder: helptext_sharing_afp.placeholder_timemachine_quota,
      inputType: 'number',
      tooltip: helptext_sharing_afp.tooltip_timemachine_quota
    },
    {
      type: 'checkbox',
      name: 'afp_home',
      placeholder: helptext_sharing_afp.placeholder_home,
      tooltip: helptext_sharing_afp.tooltip_home
    },
    {
      type: 'checkbox',
      name: 'afp_nodev',
      placeholder: helptext_sharing_afp.placeholder_nodev,
      tooltip: helptext_sharing_afp.tooltip_nodev
    },
    {
      type: 'checkbox',
      name: 'afp_nostat',
      placeholder: helptext_sharing_afp.placeholder_nostat,
      tooltip: helptext_sharing_afp.tooltip_nostat
    },
    {
      type: 'checkbox',
      name: 'afp_upriv',
      placeholder: helptext_sharing_afp.placeholder_upriv,
      tooltip: helptext_sharing_afp.tooltip_upriv
    },
    {
      type: 'permissions',
      name: 'afp_fperm',
      placeholder: helptext_sharing_afp.placeholder_fperm,
      tooltip: helptext_sharing_afp.tooltip_fperm
    },
    {
      type: 'permissions',
      name: 'afp_dperm',
      placeholder: helptext_sharing_afp.placeholder_dperm,
      tooltip: helptext_sharing_afp.tooltip_dperm
    },
    {
      type: 'input',
      name: 'afp_umask',
      placeholder: helptext_sharing_afp.placeholder_umask,
      tooltip: helptext_sharing_afp.tooltip_umask
    },
    {
      type: 'textarea',
      name: 'afp_hostsallow',
      placeholder: helptext_sharing_afp.placeholder_hostsallow,
      tooltip: helptext_sharing_afp.tooltip_hostsallow
    },
    {
      type: 'textarea',
      name: 'afp_hostsdeny',
      placeholder: 'Hosts Deny',
      tooltip: helptext_sharing_afp.tooltip_hostsdeny
    },
    {
      type: 'textarea',
      name: 'afp_auxparams',
      placeholder: 'Auxiliary Parameters',
      tooltip: helptext_sharing_afp.tooltip_auxparams
    },
  ];

  protected advanced_field: Array<any> = [
    'afp_comment',
    'afp_upriv',
    'afp_auxparams',
    'afp_hostsallow',
    'afp_hostsdeny',
    'afp_umask',
    'afp_dperm',
    'afp_fperm',
    'afp_nostat',
    'afp_nodev',
    'afp_ro',
    'afp_rw',
    'afp_allow',
    'afp_deny',
  ];

  public custActions: Array<any> = [
    {
      id : 'basic_mode',
      name : helptext_sharing_afp.actions_basic_mode,
      function : () => { this.isBasicMode = !this.isBasicMode; }
    },
    {
      'id' : 'advanced_mode',
      name : helptext_sharing_afp.actions_advanced_mode,
      function : () => { this.isBasicMode = !this.isBasicMode; }
    }
  ];

  constructor(protected router: Router, protected aroute: ActivatedRoute,
              protected ws: WebSocketService, private dialog:DialogService) {}

  isCustActionVisible(actionId: string) {
    if (actionId === 'advanced_mode' && this.isBasicMode === false) {
      return false;
    } else if (actionId === 'basic_mode' && this.isBasicMode === true) {
      return false;
    }
    return true;
  }

  preInit(entityForm: any){
    const paramMap: any = (<any>this.aroute.params).getValue();
    if (paramMap['pk'] === undefined) {
      _.find(this.fieldConfig, {name:'afp_umask'}).value = "000";
      _.find(this.fieldConfig, {name:'afp_fperm'}).value = "644";
      _.find(this.fieldConfig, {name:'afp_dperm'}).value = "755";
    }
  }

  afterInit(entityForm: any) {
    if (entityForm.isNew) {
      entityForm.formGroup.controls['afp_upriv'].setValue(true);
    }
    this.afp_timemachine_quota = _.find(this.fieldConfig, {'name': 'afp_timemachine_quota'});
    this.afp_timemachine = entityForm.formGroup.controls['afp_timemachine'];
    this.afp_timemachine_quota['isHidden'] = !this.afp_timemachine.value;
    this.afp_timemachine_subscription = this.afp_timemachine.valueChanges.subscribe((value) => {
      this.afp_timemachine_quota['isHidden'] = !value;
    });
  }

  ngOnDestroy() {
    this.afp_timemachine_subscription.unsubscribe();
  }

  afterSave(entityForm) {
    this.ws.call('service.query', [[]]).subscribe((res) => {
      const service = _.find(res, {"service": "afp"});
      if (service['enable']) {
        this.router.navigate(new Array('/').concat(
          this.route_success));
      } else {
          this.dialog.confirm(shared.dialog_title,
          shared.dialog_message, true, shared.dialog_button).subscribe((dialogRes) => {
            if (dialogRes) {
              entityForm.loader.open();
              this.ws.call('service.update', [service['id'], { enable: true }]).subscribe((updateRes) => {
                this.ws.call('service.start', [service.service]).subscribe((startRes) => {
                  entityForm.loader.close();
                  this.dialog.Info(T('AFP') + shared.dialog_started_title, 
                    T('The AFP') + shared.dialog_started_message, '250px').subscribe(() => {
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
}
