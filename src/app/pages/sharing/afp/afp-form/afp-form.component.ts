import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { helptext_sharing_afp, shared } from 'app/helptext/sharing';
import { FieldSets } from 'app/pages/common/entity/entity-form/classes/field-sets';
import { T } from "app/translate-marker";
import * as _ from 'lodash';
import { DialogService, WebSocketService } from '../../../../services/';

@Component({
  selector : 'app-afp-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class AFPFormComponent implements OnDestroy {
  protected route_success = ['sharing', 'afp'];
  protected queryCall = 'sharing.afp.query';
  protected editCall = 'sharing.afp.update';
  protected addCall = 'sharing.afp.create';
  protected pk: number;
  protected queryKey = 'id';
  protected isEntity = true;
  protected isBasicMode = true;
  public afp_timemachine: any;
  public afp_timemachine_quota: any;
  public afp_timemachine_subscription: any;

  private fieldSets = new FieldSets([
    {
      name: helptext_sharing_afp.fieldset_general,
      class: 'general',
      label: true,
      config: [
        {
          type : 'explorer',
          initial: '/mnt',
          explorerType: 'directory',
          name: 'path',
          placeholder: helptext_sharing_afp.placeholder_path,
          tooltip: helptext_sharing_afp.tooltip_path,
          required: true,
          validation : helptext_sharing_afp.validators_path
        },
        {
          type: 'input',
          name: 'name',
          placeholder: helptext_sharing_afp.placeholder_name,
          tooltip: helptext_sharing_afp.tooltip_name
        },
        {
          type: 'checkbox',
          name: 'timemachine',
          placeholder: helptext_sharing_afp.placeholder_timemachine,
          tooltip: helptext_sharing_afp.tooltip_timemachine,
        },
        {
          type: 'checkbox',
          name: 'home',
          placeholder: helptext_sharing_afp.placeholder_home,
          tooltip: helptext_sharing_afp.tooltip_home
        }
      ]
    },
    { name: 'divider_access', divider: false },
    {
      name: helptext_sharing_afp.fieldset_permissions,
      label: false,
      class: 'perms',
      config: [
        {
          type: 'input',
          name: 'umask',
          placeholder: helptext_sharing_afp.placeholder_umask,
          tooltip: helptext_sharing_afp.tooltip_umask
        },
        {
          type: 'permissions',
          name: 'fperm',
          placeholder: helptext_sharing_afp.placeholder_fperm,
          tooltip: helptext_sharing_afp.tooltip_fperm,
          width: '50%'
        },
        {
          type: 'permissions',
          name: 'dperm',
          placeholder: helptext_sharing_afp.placeholder_dperm,
          tooltip: helptext_sharing_afp.tooltip_dperm,
          width: '50%'
        },
        {
          type: 'checkbox',
          name: 'upriv',
          placeholder: helptext_sharing_afp.placeholder_upriv,
          tooltip: helptext_sharing_afp.tooltip_upriv
        }
      ]
    },
    {
      name: helptext_sharing_afp.fieldset_allow,
      label: false,
      class: 'allow',
      width: '49%',
      config: [{
        type: 'list',
        name: 'allow',
        templateListField: [{
          name: 'name',
          placeholder: helptext_sharing_afp.placeholder_user_or_group,
          tooltip: helptext_sharing_afp.tooltip_allow,
          type: 'input',
        }],
        listFields: []
      }]
    },
    { name: 'spacer', label: false, width: '2%' },
    {
      name: helptext_sharing_afp.fieldset_deny,
      label: false,
      class: 'deny',
      width: '49%',
      config: [{
        type: 'list',
        name: 'deny',
        templateListField: [{
          name: 'name',
          placeholder: helptext_sharing_afp.placeholder_user_or_group,
          tooltip: helptext_sharing_afp.tooltip_deny,
          type: 'input'
        }],
        listFields: []
      }]
    },
    {
      name: helptext_sharing_afp.fieldset_ro,
      label: false,
      class: 'ro',
      width: '49%',
      config: [{
        type: 'list',
        name: 'ro',
        templateListField: [{
              name: 'name',
              placeholder: helptext_sharing_afp.placeholder_user_or_group,
              tooltip: helptext_sharing_afp.tooltip_allow,
              type: 'input',
        }],
        listFields: []
      }]
    },
    { name: 'spacer', label: false, width: '2%' },
    {
      name: helptext_sharing_afp.fieldset_rw,
      label: false,
      class: 'rw',
      width: '49%',
      config: [{
        type: 'list',
        name: 'rw',
        templateListField: [{
          name: 'name',
          placeholder: helptext_sharing_afp.placeholder_user_or_group,
          tooltip: helptext_sharing_afp.tooltip_deny,
          type: 'input'
        }],
        listFields: []
      }]
    },
    {
      name: helptext_sharing_afp.fieldset_hostsallow,
      label: false,
      class: 'hallow',
      width: '49%',
      config: [{
        type: 'list',
        name: 'hostsallow',
        templateListField: [{
          name: 'address',
          placeholder: helptext_sharing_afp.placeholder_host_or_ip,
          tooltip: helptext_sharing_afp.tooltip_hostsallow,
          type: 'input'
        }],
        listFields: []
      }]
    },
    { name: 'spacer', label: false, width: '2%' },
    {
      name: helptext_sharing_afp.fieldset_hostsdeny,
      label: false,
      class: 'hdeny',
      width: '49%',
      config: [{
        type: 'list',
        name: 'hostsdeny',
        templateListField: [{
          name: 'address',
          placeholder: helptext_sharing_afp.placeholder_host_or_ip,
          tooltip: helptext_sharing_afp.tooltip_hostsdeny,
          type: 'input'
        }],
        listFields: []
      }]
    },
    { name: 'divider_other', divider: false },
    {
      name: helptext_sharing_afp.fieldset_other,
      label: false,
      class: 'other',
      config: [
        {
          type: 'input',
          name: 'comment',
          placeholder: helptext_sharing_afp.placeholder_comment,
          tooltip: helptext_sharing_afp.tooltip_comment
        },   
        {
          type: 'input',
          name: 'timemachine_quota',
          placeholder: helptext_sharing_afp.placeholder_timemachine_quota,
          inputType: 'number',
          tooltip: helptext_sharing_afp.tooltip_timemachine_quota
        },
        {
          type: 'checkbox',
          name: 'nodev',
          placeholder: helptext_sharing_afp.placeholder_nodev,
          tooltip: helptext_sharing_afp.tooltip_nodev
        },
        {
          type: 'checkbox',
          name: 'nostat',
          placeholder: helptext_sharing_afp.placeholder_nostat,
          tooltip: helptext_sharing_afp.tooltip_nostat
        },
        {
          type: 'textarea',
          name: 'auxparams',
          placeholder: 'Auxiliary Parameters',
          tooltip: helptext_sharing_afp.tooltip_auxparams
        }
      ]
    },
    { name: 'divider_last', divider: true },
  ]);

  protected advanced_field: Array<any> = [
    'comment',
    'upriv',
    'auxparams',
    'hostsallow',
    'hostsdeny',
    'umask',
    'dperm',
    'fperm',
    'nostat',
    'nodev',
    'ro',
    'rw',
    'allow',
    'deny',
    'timemachine_quota'
  ];
  advanced_sets = [
    'perms',
    'other',
    'allow',
    'deny',
    'ro',
    'rw',
    'hallow',
    'hdeny'
  ];
  advanced_dividers = ['divider_access', 'divider_other'];
  public custActions: Array<any> = [
    {
      id : 'basic_mode',
      name : helptext_sharing_afp.actions_basic_mode,
      function : () => {
        this.isBasicMode = !this.isBasicMode;
        this.fieldSets
          .toggleSets(this.advanced_sets)
          .toggleDividers(this.advanced_dividers);
      }
    },
    {
      'id' : 'advanced_mode',
      name : helptext_sharing_afp.actions_advanced_mode,
      function : () => {
        this.isBasicMode = !this.isBasicMode;
        this.fieldSets
          .toggleSets(this.advanced_sets)
          .toggleDividers(this.advanced_dividers);
      }
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

  preInit(){
    const paramMap: any = (<any>this.aroute.params).getValue();
    if (paramMap['pk'] === undefined) {
      this.fieldSets.config('umask').value = '000';
      this.fieldSets.config('fperm').value = '644';
      this.fieldSets.config('dperm').value = '755';
    }

    this.pk = parseInt(paramMap['pk'], 10) || undefined;
  }

  afterInit(entityForm: any) {
    if (entityForm.isNew) {
      entityForm.formGroup.controls['upriv'].setValue(true);
      this.fieldSets.config('allow').initialCount =
      this.fieldSets.config('deny').initialCount =
      this.fieldSets.config('ro').initialCount =
      this.fieldSets.config('rw').initialCount =
      this.fieldSets.config('hostsallow').initialCount =
      this.fieldSets.config('hostsdeny').initialCount = 1;
    }
    this.afp_timemachine_quota = this.fieldSets.config('timemachine_quota');
    this.afp_timemachine = entityForm.formGroup.controls['timemachine'];
    this.afp_timemachine_quota['isHidden'] = !this.afp_timemachine.value;
    this.afp_timemachine_subscription = this.afp_timemachine.valueChanges.subscribe((value) => {
      this.afp_timemachine_quota['isHidden'] = !value;
    });
  }

  ngOnDestroy() {
    this.afp_timemachine_subscription.unsubscribe();
  }
  
  resourceTransformIncomingRestData(share) {
    share.allow = share.allow.map(name => ({ name }));
    share.deny = share.deny.map(name => ({ name }));
    share.ro = share.ro.map(name => ({ name }));
    share.rw = share.rw.map(name => ({ name }));
    share.hostsallow = share.hostsallow.map(address => ({ address }));
    share.hostsdeny = share.hostsdeny.map(address => ({ address }));

    return share;
  }

  clean(share) {
    share.allow = share.allow.filter(n => !!n.name).map(name => name.name);
    share.deny = share.deny.filter(n => !!n.name).map(name => name.name);
    share.ro = share.ro.filter(n => !!n.name).map(name => name.name);
    share.rw = share.rw.filter(n => !!n.name).map(name => name.name);
    share.hostsallow = share.hostsallow.filter(a => !!a.address).map(address => address.address);
    share.hostsdeny = share.hostsdeny.filter(a => !!a.address).map(address => address.address);

    return share;
  }

  afterSave(entityForm) {
    this.ws.call('service.query', []).subscribe((res) => {
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
