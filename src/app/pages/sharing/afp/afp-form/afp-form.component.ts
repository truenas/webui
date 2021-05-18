import { Component, OnDestroy } from '@angular/core';
import { Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiceName } from 'app/enums/service-name.enum';
import globalHelptext from 'app/helptext/global-helptext';
import { helptext_sharing_afp, shared } from 'app/helptext/sharing';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { FieldSets } from 'app/pages/common/entity/entity-form/classes/field-sets';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { forbiddenValues } from 'app/pages/common/entity/entity-form/validators/forbidden-values-validation';
import { T } from 'app/translate-marker';
import * as _ from 'lodash';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { DialogService, WebSocketService } from '../../../../services';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';

@Component({
  selector: 'app-afp-form',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class AFPFormComponent implements FormConfiguration, OnDestroy {
  route_success = ['sharing', 'afp'];
  queryCall: 'sharing.afp.query' = 'sharing.afp.query';
  editCall: 'sharing.afp.update' = 'sharing.afp.update';
  addCall: 'sharing.afp.create' = 'sharing.afp.create';
  pk: number;
  queryKey = 'id';
  isEntity = true;
  isBasicMode = true;
  afp_timemachine: any;
  afp_timemachine_quota: any;
  afp_timemachine_subscription: any;
  title = helptext_sharing_afp.formTitle;
  private namesInUse: string[] = [];
  fieldSets = new FieldSets([
    {
      name: helptext_sharing_afp.fieldset_general,
      class: 'general',
      label: true,
      config: [
        {
          type: 'explorer',
          initial: '/mnt',
          explorerType: 'directory',
          name: 'path',
          placeholder: helptext_sharing_afp.placeholder_path,
          tooltip: helptext_sharing_afp.tooltip_path,
          required: true,
          validation: helptext_sharing_afp.validators_path,
        },
        {
          type: 'input',
          name: 'name',
          required: true,
          placeholder: helptext_sharing_afp.placeholder_name,
          validation: [forbiddenValues(this.namesInUse), Validators.required],
          tooltip: helptext_sharing_afp.tooltip_name,
          hasErrors: false,
          blurStatus: true,
          blurEvent: this.blurEventName,
          parent: this,
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
          tooltip: helptext_sharing_afp.tooltip_home,
        },
        {
          type: 'checkbox',
          name: 'enabled',
          placeholder: helptext_sharing_afp.placeholder_enabled,
          tooltip: helptext_sharing_afp.tooltip_enabled,
          value: true,
        },
      ],
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
          tooltip: helptext_sharing_afp.tooltip_umask,
        },
        {
          type: 'permissions',
          name: 'fperm',
          placeholder: helptext_sharing_afp.placeholder_fperm,
          tooltip: helptext_sharing_afp.tooltip_fperm,
          width: '50%',
        },
        {
          type: 'permissions',
          name: 'dperm',
          placeholder: helptext_sharing_afp.placeholder_dperm,
          tooltip: helptext_sharing_afp.tooltip_dperm,
          width: '50%',
        },
        {
          type: 'checkbox',
          name: 'upriv',
          placeholder: helptext_sharing_afp.placeholder_upriv,
          tooltip: helptext_sharing_afp.tooltip_upriv,
        },
      ],
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
        listFields: [],
      }],
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
          type: 'input',
        }],
        listFields: [],
      }],
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
        listFields: [],
      }],
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
          type: 'input',
        }],
        listFields: [],
      }],
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
          placeholder: globalHelptext.hostname,
          tooltip: helptext_sharing_afp.tooltip_hostsallow,
          type: 'input',
        }],
        listFields: [],
      }],
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
          placeholder: globalHelptext.hostname,
          tooltip: helptext_sharing_afp.tooltip_hostsdeny,
          type: 'input',
        }],
        listFields: [],
      }],
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
          tooltip: helptext_sharing_afp.tooltip_comment,
        },
        {
          type: 'input',
          name: 'timemachine_quota',
          placeholder: helptext_sharing_afp.placeholder_timemachine_quota,
          inputType: 'number',
          tooltip: helptext_sharing_afp.tooltip_timemachine_quota,
        },
        {
          type: 'checkbox',
          name: 'nodev',
          placeholder: helptext_sharing_afp.placeholder_nodev,
          tooltip: helptext_sharing_afp.tooltip_nodev,
        },
        {
          type: 'checkbox',
          name: 'nostat',
          placeholder: helptext_sharing_afp.placeholder_nostat,
          tooltip: helptext_sharing_afp.tooltip_nostat,
        },
        {
          type: 'textarea',
          name: 'auxparams',
          placeholder: 'Auxiliary Parameters',
          tooltip: helptext_sharing_afp.tooltip_auxparams,
        },
      ],
    },
    { name: 'divider_last', divider: true },
  ]);

  advanced_field: any[] = [
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
    'timemachine_quota',
  ];
  advanced_sets = [
    'perms',
    'other',
    'allow',
    'deny',
    'ro',
    'rw',
    'hallow',
    'hdeny',
  ];
  advanced_dividers = ['divider_access', 'divider_other'];
  custActions: any[] = [
    {
      id: 'basic_mode',
      name: globalHelptext.basic_options,
      function: () => {
        this.isBasicMode = !this.isBasicMode;
        this.fieldSets
          .toggleSets(this.advanced_sets)
          .toggleDividers(this.advanced_dividers);
      },
    },
    {
      id: 'advanced_mode',
      name: globalHelptext.advanced_options,
      function: () => {
        this.isBasicMode = !this.isBasicMode;
        this.fieldSets
          .toggleSets(this.advanced_sets)
          .toggleDividers(this.advanced_dividers);
      },
    },
  ];

  private entityForm: EntityFormComponent;

  constructor(
    protected router: Router,
    protected aroute: ActivatedRoute,
    protected ws: WebSocketService,
    private dialog: DialogService,
  ) {
    combineLatest(
      this.ws.call('sharing.afp.query', []),
      this.aroute.paramMap,
    )
      .pipe(
        map(([shares, pm]) => {
          const pk = parseInt(pm.get('pk'), 10);
          return (shares as any[])
            .filter((share) => isNaN(pk) || share.id !== pk)
            .map((share) => share.name);
        }),
      )
      .subscribe((shareNames) => {
        shareNames.forEach((n) => this.namesInUse.push(n));
      });
  }

  isCustActionVisible(actionId: string): boolean {
    if (actionId === 'advanced_mode' && this.isBasicMode === false) {
      return false;
    } if (actionId === 'basic_mode' && this.isBasicMode === true) {
      return false;
    }
    return true;
  }

  preInit(): void {
    const paramMap: any = (<any> this.aroute.params).getValue();
    if (paramMap['pk'] === undefined) {
      this.fieldSets.config('umask').value = '000';
      this.fieldSets.config('fperm').value = '644';
      this.fieldSets.config('dperm').value = '755';
    }

    this.pk = parseInt(paramMap['pk'], 10) || undefined;
  }

  afterInit(entityForm: any): void {
    if (!this.pk) {
      this.openInfoDialog();
    }
    this.entityForm = entityForm;
    if (entityForm.isNew) {
      entityForm.formGroup.controls['upriv'].setValue(true);
      this.fieldSets.config('allow').initialCount = this.fieldSets.config('deny').initialCount = this.fieldSets.config('ro').initialCount = this.fieldSets.config('rw').initialCount = this.fieldSets.config('hostsallow').initialCount = this.fieldSets.config('hostsdeny').initialCount = 1;
    }
    this.afp_timemachine_quota = this.fieldSets.config('timemachine_quota');
    this.afp_timemachine = entityForm.formGroup.controls['timemachine'];
    this.afp_timemachine_quota['isHidden'] = !this.afp_timemachine.value;
    this.afp_timemachine_subscription = this.afp_timemachine.valueChanges.subscribe((value: any) => {
      this.afp_timemachine_quota['isHidden'] = !value;
    });

    /*  If name is empty, auto-populate after path selection */
    entityForm.formGroup.controls['path'].valueChanges.subscribe((path: any) => {
      const nameControl = entityForm.formGroup.controls['name'];
      if (path && !nameControl.value) {
        nameControl.setValue(path.split('/').pop());
      }
    });
  }

  ngOnDestroy(): void {
    this.afp_timemachine_subscription.unsubscribe();
  }

  resourceTransformIncomingRestData(share: any): any {
    share.allow = share.allow.map((name: any) => ({ name }));
    share.deny = share.deny.map((name: any) => ({ name }));
    share.ro = share.ro.map((name: any) => ({ name }));
    share.rw = share.rw.map((name: any) => ({ name }));
    share.hostsallow = share.hostsallow.map((address: any) => ({ address }));
    share.hostsdeny = share.hostsdeny.map((address: any) => ({ address }));

    return share;
  }

  clean(share: any): any {
    share.allow = (share.allow as any[]).filter((n) => !!n.name).map((name) => name.name);
    share.deny = (share.deny as any[]).filter((n) => !!n.name).map((name) => name.name);
    share.ro = (share.ro as any[]).filter((n) => !!n.name).map((name) => name.name);
    share.rw = (share.rw as any[]).filter((n) => !!n.name).map((name) => name.name);
    share.hostsallow = (share.hostsallow as any[]).filter((a) => !!a.address).map((address) => address.address);
    share.hostsdeny = (share.hostsdeny as any[]).filter((a) => !!a.address).map((address) => address.address);

    return share;
  }

  afterSave(entityForm: any): void {
    this.ws.call('service.query', []).subscribe((res) => {
      const service = _.find(res, { service: ServiceName.Afp });
      if (service.enable) {
        this.router.navigate(new Array('/').concat(
          this.route_success,
        ));
      } else {
        this.dialog.confirm(shared.dialog_title,
          shared.dialog_message, true, shared.dialog_button).subscribe((dialogRes: boolean) => {
          if (dialogRes) {
            entityForm.loader.open();
            this.ws.call('service.update', [service.id, { enable: true }]).subscribe(() => {
              this.ws.call('service.start', [service.service]).subscribe(() => {
                entityForm.loader.close();
                this.dialog.Info(T('AFP') + shared.dialog_started_title,
                  T('The AFP') + shared.dialog_started_message, '250px').subscribe(() => {
                  this.router.navigate(new Array('/').concat(
                    this.route_success,
                  ));
                });
              }, (err) => {
                entityForm.loader.close();
                this.dialog.errorReport(err.error, err.reason, err.trace.formatted);
                this.router.navigate(new Array('/').concat(
                  this.route_success,
                ));
              });
            }, (err) => {
              entityForm.loader.close();
              this.dialog.errorReport(err.error, err.reason, err.trace.formatted);
              this.router.navigate(new Array('/').concat(
                this.route_success,
              ));
            });
          } else {
            this.router.navigate(new Array('/').concat(
              this.route_success,
            ));
          }
        });
      }
    });
  }

  /* If user blurs name field with empty value, try to auto-populate based on path */
  blurEventName(parent: { entityForm: EntityFormComponent }): void {
    const pathControl = parent.entityForm.formGroup.controls['path'];
    const nameControl = parent.entityForm.formGroup.controls['name'];
    if (pathControl.value && !nameControl.value) {
      nameControl.setValue(pathControl.value.split('/').pop());
    }
  }

  openInfoDialog(): void {
    const conf: DialogFormConfiguration = {
      title: helptext_sharing_afp.smb_dialog.title,
      message: helptext_sharing_afp.smb_dialog.message,
      fieldConfig: [],
      saveButtonText: helptext_sharing_afp.smb_dialog.custBtn,
      cancelButtonText: helptext_sharing_afp.smb_dialog.button,
      hideCancel: true,
      custActions: [
        {
          name: helptext_sharing_afp.smb_dialog.button,
          id: 'continue_with_afp',
          function: () => {
            this.dialog.closeAllDialogs();
          },
        },
      ],
      parent: this,
      customSubmit: (entityDialog: EntityDialogComponent) => {
        entityDialog.dialogRef.close();
        this.router.navigate(['sharing', 'smb', 'add']);
      },
    };
    this.dialog.dialogFormWide(conf);
  }
}
