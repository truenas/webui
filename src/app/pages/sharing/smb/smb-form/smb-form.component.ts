import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { helptext_sharing_smb, shared } from 'app/helptext/sharing';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { forbiddenValues } from 'app/pages/common/entity/entity-form/validators/forbidden-values-validation';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { T } from "app/translate-marker";
import * as _ from 'lodash';
import { combineLatest, of } from 'rxjs';
import { catchError, map, switchMap, take, tap, filter } from 'rxjs/operators';
import { AppLoaderService, DialogService, RestService, WebSocketService } from '../../../../services/';
import { Validators } from '@angular/forms';
import globalHelptext from 'app/helptext/global-helptext';

@Component({
  selector : 'app-smb-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class SMBFormComponent {
  protected queryCall = 'sharing.smb.query';
  protected addCall = 'sharing.smb.create';
  protected editCall = 'sharing.smb.update'
  protected pk: number;
  protected queryKey = 'id';
  protected route_success: string[] = [ 'sharing', 'smb' ];
  protected isEntity: boolean = true;
  protected isBasicMode: boolean = true;
  public isTimeMachineOn = false;
  public namesInUse: string[] = [];
  public productType = window.localStorage.getItem('product_type');
  private hostsAllowOnLoad = [];
  private hostsDenyOnLoad = [];

  protected fieldSets: FieldSet[] = [
    {
      name: helptext_sharing_smb.fieldset_basic,
      class: 'basic',
      label: true,
      width: '100%',
      config: [
        {
          type : 'explorer',
          initial: '/mnt',
          explorerType: 'directory',
          name: 'path',
          placeholder: helptext_sharing_smb.placeholder_path,
          tooltip: helptext_sharing_smb.tooltip_path,
          required: true,
          validation : helptext_sharing_smb.validators_path,

        },
        {
          type: "input",
          name: "name",
          placeholder: helptext_sharing_smb.placeholder_name,
          tooltip: helptext_sharing_smb.tooltip_name,
          validation: [forbiddenValues(this.namesInUse), Validators.required],
          hasErrors: false,
          errors: helptext_sharing_smb.errormsg_name,
          blurStatus: true,
          blurEvent: this.blurEventName,
          parent: this
        },
        {
          type: 'select',
          name: 'purpose',
          placeholder: helptext_sharing_smb.placeholder_purpose,
          tooltip: helptext_sharing_smb.tooltip_purpose,
          options: [],
          class: 'inline',
          width: '50%'
        },
        {
          type: 'input',
          name: 'comment',
          placeholder: helptext_sharing_smb.placeholder_comment,
          tooltip: helptext_sharing_smb.tooltip_comment,
          class: 'inline',
          width: '50%'
        },
        {
          type: 'checkbox',
          name: 'enabled',
          placeholder: helptext_sharing_smb.placeholder_enabled,
          tooltip: helptext_sharing_smb.tooltip_enabled,
          value: true,
        },
      ]
    },
    { name: 'divider', divider: false },
    {
      name: helptext_sharing_smb.fieldset_access,
      class: 'access',
      label: true,
      width: '49%',
      config: [
        {
          type: 'checkbox',
          name: 'acl',
          placeholder: helptext_sharing_smb.placeholder_acl,
          tooltip: helptext_sharing_smb.tooltip_acl,
          isHidden: true,
        },
        {
          type: 'checkbox',
          name: 'ro',
          placeholder: helptext_sharing_smb.placeholder_ro,
          tooltip: helptext_sharing_smb.tooltip_ro,
          isHidden: true,
        },
        {
          type: 'checkbox',
          name: 'browsable',
          placeholder: helptext_sharing_smb.placeholder_browsable,
          tooltip: helptext_sharing_smb.tooltip_browsable,
          isHidden: true,
        },
        {
          type: 'checkbox',
          name: 'guestok',
          placeholder: helptext_sharing_smb.placeholder_guestok,
          tooltip: helptext_sharing_smb.tooltip_guestok,
          isHidden: true,
        },
        {
          type: 'checkbox',
          name: 'abe',
          placeholder: helptext_sharing_smb.placeholder_abe,
          tooltip: helptext_sharing_smb.tooltip_abe,
          isHidden: true,
        },
        {
          type: 'chip',
          name: 'hostsallow',
          placeholder: helptext_sharing_smb.placeholder_hostsallow,
          tooltip: helptext_sharing_smb.tooltip_hostsallow,
          isHidden: true,
        },
        {
          type: 'chip',
          name: 'hostsdeny',
          placeholder: helptext_sharing_smb.placeholder_hostsdeny,
          tooltip: helptext_sharing_smb.tooltip_hostsdeny,
          isHidden: true,
        }
      ]
    },
    { name: 'spacer', label: false, width: '2%' },
    {
      name: helptext_sharing_smb.fieldset_other,
      class: 'other',
      label: true,
      width: '49%',
      config: [
        {
          type: 'checkbox',
          name: 'home',
          placeholder: helptext_sharing_smb.placeholder_home,
          tooltip: helptext_sharing_smb.tooltip_home,
          isHidden: true,
        },
        {
          type: 'checkbox',
          name: 'timemachine',
          placeholder: helptext_sharing_smb.placeholder_timemachine,
          tooltip: helptext_sharing_smb.tooltip_timemachine,
          isHidden: true,
        },
        {
          type: 'checkbox',
          name: 'shadowcopy',
          placeholder: helptext_sharing_smb.placeholder_shadowcopy,
          tooltip: helptext_sharing_smb.tooltip_shadowcopy,
          isHidden: true,
        },
        {
          type: 'checkbox',
          name: 'recyclebin',
          placeholder: helptext_sharing_smb.placeholder_recyclebin,
          tooltip: helptext_sharing_smb.tooltip_recyclebin,
          isHidden: true,
        },
        {
          type: 'checkbox',
          name: 'aapl_name_mangling',
          placeholder: helptext_sharing_smb.placeholder_aapl_name_mangling,
          tooltip: helptext_sharing_smb.tooltip_aapl_name_mangling,
          isHidden: true,
        },
        {
          type: 'checkbox',
          name: 'streams',
          placeholder: helptext_sharing_smb.placeholder_streams,
          tooltip: helptext_sharing_smb.tooltip_streams,
          isHidden: true,
        },
        {
          type: 'checkbox',
          name: 'durablehandle',
          placeholder: helptext_sharing_smb.placeholder_durablehandle,
          tooltip: helptext_sharing_smb.tooltip_durablehandle,
          isHidden: true,
        },
        {
          type: 'checkbox',
          name: 'fsrvp',
          placeholder: helptext_sharing_smb.placeholder_fsrvp,
          tooltip: helptext_sharing_smb.tooltip_fsrvp,
          isHidden: true,
        },
        {
          type: 'input',
          name: 'path_suffix',
          placeholder: helptext_sharing_smb.placeholder_path_suffix,
          tooltip: helptext_sharing_smb.tooltip_path_suffix,
          isHidden: true,
        },
        {
          type: 'textarea',
          name: 'auxsmbconf',
          placeholder: helptext_sharing_smb.placeholder_auxsmbconf,
          tooltip: helptext_sharing_smb.tooltip_auxsmbconf,
          isHidden: true,
        },
      
      ]
    },
    { name: 'divider', divider: true }    
  ]

  private cifs_vfsobjects: any;

  protected advanced_field: Array<any> = [
    'acl',
    'ro',
    'browsable',
    'guestok',
    'abe',
    'hostsallow',
    'hostsdeny',
    'home',
    'timemachine',
    'shadowcopy',
    'recyclebin',
    'aapl_name_mangling',
    'streams',
    'durablehandle',
    'fsrvp',
    'path_suffix',
    'auxsmbconf'
  ];

  protected accessFieldsets = _.find(this.fieldSets, {'class': 'access'});
  protected otherFieldsets = _.find(this.fieldSets, {'class': 'other'});

  public custActions: Array<any> = [
    {
      id : 'basic_mode',
      name : globalHelptext.basic_options,
      function: () => {
        this.isBasicMode = !this.isBasicMode;
        this.updateForm();
      }
    },
    {
      id : 'advanced_mode',
      name : globalHelptext.advanced_options,
      function : () => {
        this.isBasicMode = !this.isBasicMode;
        this.updateForm();
      }
    }
  ];

  public entityForm: EntityFormComponent;
  public presets: any;
  protected presetFields = [];

  constructor(
    protected router: Router,
    protected rest: RestService,
    protected ws: WebSocketService,
    private dialog: DialogService,
    protected loader: AppLoaderService,
    private activatedRoute: ActivatedRoute
  ) {
    combineLatest(
      this.ws.call("sharing.smb.query", []),
      this.activatedRoute.paramMap
    )
      .pipe(
        map(([shares, pm]) => {
          const pk = parseInt(pm.get("pk"), 10);
          return shares
            .filter(share => isNaN(pk) || share.id !== pk)
            .map(share => share.name);
        })
      )
      .subscribe(shareNames => {
        ["global", ...shareNames].forEach(n => this.namesInUse.push(n));
      });
  }

  resourceTransformIncomingRestData(data) {
    this.hostsAllowOnLoad = data.hostsallow ? [...data.hostsallow] : [];
    this.hostsDenyOnLoad = data.hostsdeny ? [...data.hostsdeny] : [];
    return data;
  }

  isCustActionVisible(actionId: string) {
    if (actionId == 'advanced_mode' && this.isBasicMode == false) {
      return false;
    } else if (actionId == 'basic_mode' && this.isBasicMode == true) {
      return false;
    }
    return true;
  }

  updateForm() {
    for (const field of this.accessFieldsets.config) {
      field['isHidden'] = this.isBasicMode ? true : false;
    }
    for (const field of this.otherFieldsets.config) {
      field['isHidden'] = this.isBasicMode ? true : false;
    }
  }

  preInit(entityForm: EntityFormComponent) {
    this.activatedRoute.paramMap
      .pipe(
        take(1),
        map(paramMap => paramMap.get("pk"))
      )
      .subscribe(res => {
        const pk = parseInt(res, 10);
        if (pk) {
          this.pk = entityForm.pk = pk;
          return;
        }
      });
  }

  afterSave(entityForm) {
    if (entityForm.formGroup.controls['timemachine'].value && !this.isTimeMachineOn) {
      this.restartService(entityForm, 'timemachine');
    } else {
      this.checkAllowDeny(entityForm);   
    }
  }

  checkAllowDeny(entityForm) {
    if (!_.isEqual(this.hostsAllowOnLoad, entityForm.formGroup.controls['hostsallow'].value) ||
      !_.isEqual(this.hostsDenyOnLoad, entityForm.formGroup.controls['hostsdeny'].value)) {
          this.restartService(entityForm, 'allowdeny');
    } else {
      this.checkACLactions(entityForm)
    }
  }

  restartService(entityForm, source: string) {
    let message = source === 'timemachine' ? helptext_sharing_smb.restart_smb_dialog.message_time_machine :
      helptext_sharing_smb.restart_smb_dialog.message_allow_deny;
    this.dialog.confirm(helptext_sharing_smb.restart_smb_dialog.title, message,
      true, helptext_sharing_smb.restart_smb_dialog.title, false, '','','','',false, 
      helptext_sharing_smb.restart_smb_dialog.cancel_btn).subscribe((res) => {
        if (res) {
          this.loader.open();
          this.ws.call('service.restart', ['cifs']).subscribe(() => {
            this.loader.close();
            this.dialog.Info(helptext_sharing_smb.restarted_smb_dialog.title, 
              helptext_sharing_smb.restarted_smb_dialog.message, '250px').subscribe(() => {
                this.checkACLactions(entityForm);
              })
          }, (err) => { 
            this.loader.close();
            this.dialog.errorReport('Error', err.err, err.backtrace);
          }
          )
        } else {
          source === 'timemachine' ? this.checkAllowDeny(entityForm) : this.checkACLactions(entityForm);
        }
      });
  }
 
  checkACLactions(entityForm) {
    const sharePath: string = entityForm.formGroup.get('path').value;
    const datasetId = sharePath.replace('/mnt/', '');
    const poolName = datasetId.split('/')[0];
    const homeShare = entityForm.formGroup.get('home').value;
    const ACLRoute = ['storage', 'pools', 'id', poolName, 'dataset', 'acl', datasetId]

    if (homeShare && entityForm.isNew) {
      return this.router.navigate(
        ['/'].concat(ACLRoute),{ queryParams: {homeShare: true}})
      
    }
    // If this call returns true OR an [ENOENT] err comes back, just return to table
    // because the pool or ds is encrypted. Otherwise, do the next checks
    this.ws.call('filesystem.path_is_encrypted', [sharePath]).subscribe(
      res => {
      if(res) {
        this.router.navigate(['/'].concat(this.route_success));
      } else {
    /**
     * If share does have trivial ACL, check if user wants to edit dataset permissions. If not,
     * nav to SMB shares list view.
     */
    const promptUserACLEdit = () => 
      this.ws.call('filesystem.acl_is_trivial', [sharePath]).pipe(
        switchMap((isTrivialACL: boolean) =>
          /* If share does not have trivial ACL, move on. Otherwise, perform some async data-gathering operations */
          !isTrivialACL || !datasetId.includes('/') || this.productType === 'SCALE'
            ? combineLatest(of(false), of({}))
            : combineLatest(
                /* Check if user wants to edit the share's ACL */
                this.dialog.confirm(
                  helptext_sharing_smb.dialog_edit_acl_title,
                  helptext_sharing_smb.dialog_edit_acl_message,
                  true,
                  helptext_sharing_smb.dialog_edit_acl_button
                ),
              )
        ),
        tap(([doConfigureACL, dataset]) =>
          doConfigureACL
            ? this.router.navigate(
                ['/'].concat(ACLRoute)
              )
            : this.router.navigate(['/'].concat(this.route_success))
        )
      );

    this.ws
      .call("service.query", [])
      .pipe(
        map(response => _.find(response, { service: "cifs" })),
        switchMap(cifsService => {
          if (cifsService.enable) {
            return promptUserACLEdit();
          }

          /**
           * Allow user to enable cifs service, then ask about editing
           * dataset ACL.
           */
          return this.dialog
            .confirm(
              shared.dialog_title,
              shared.dialog_message,
              true,
              shared.dialog_button
            )
            .pipe(
              switchMap(doEnableService => {
                if (doEnableService) {
                  entityForm.loader.open();
                  return this.ws.call("service.update", [cifsService.id, { enable: true }]).pipe(
                    switchMap(() => this.ws.call("service.start", [cifsService.service])),
                    tap(() => {
                      entityForm.loader.close();
                    }),
                    switchMap(() => {
                    return this.dialog.Info(T('SMB') + shared.dialog_started_title, 
                      T('The SMB') + shared.dialog_started_message, '250px')
                    }),
                    catchError(error => {
                      entityForm.loader.close();
                      return this.dialog.errorReport(error.error, error.reason, error.trace.formatted);
                    })
                  );
                }
                return of(true);
              }),
              switchMap(promptUserACLEdit)
            );
        })
      )
      .subscribe(() => {}, error => new EntityUtils().handleWSError(this, error, this.dialog));
      }
    },
    err => {
      if (err.reason.includes('[ENOENT]')) {
        this.router.navigate(['/'].concat(this.route_success));
      } else {
        // If some other err comes back from filesystem.path_is_encrypted
        this.dialog.errorReport(helptext_sharing_smb.action_edit_acl_dialog.title, 
          err.reason, err.trace.formatted);
      }
    })
  }

  afterInit(entityForm: EntityFormComponent) {
    const generalFieldsets = _.find(this.fieldSets, {class: 'basic'});
    const purposeField = _.find(generalFieldsets.config, {name: 'purpose'});
    this.ws.call('sharing.smb.presets').subscribe(
      (res) => {
        this.presets = res;
        for (const item in res) {
          purposeField.options.push({label: res[item]['verbose_name'], value: item});
        }
        if (entityForm.isNew) {
          entityForm.formGroup.controls['purpose'].setValue('DEFAULT_SHARE');
        }
      },
      (err) => {
        new EntityUtils().handleWSError(this, err, this.dialog);
      }
    )

    this.entityForm = entityForm;
    if (entityForm.isNew) {
      entityForm.formGroup.controls['browsable'].setValue(true);
    }

    /*  If name is empty, auto-populate after path selection */
    entityForm.formGroup.controls['path'].valueChanges.subscribe(path => {
      const nameControl = entityForm.formGroup.controls['name'];
      if (path && !nameControl.value) {
        const v = path.split('/').pop();
        nameControl.setValue(v);
      }
    });

    setTimeout(() => {
      if (entityForm.formGroup.controls['timemachine'].value) { this.isTimeMachineOn = true };
    }, 700)

    this.ws.call('system.advanced.config').subscribe(res => {
      this.isBasicMode = !res.advancedmode;
      this.updateForm();
    })

    entityForm.formGroup.controls['purpose'].valueChanges.subscribe((res) => {
      this.clearPresets();
      for (const item in this.presets[res].params) {
        this.presetFields.push(item);
        const ctrl = entityForm.formGroup.controls[item];
        if (ctrl && item !== 'auxsmbconf') {
          ctrl.setValue(this.presets[res].params[item]);
          ctrl.disable();
        }
      }
    });
  }

  clearPresets() {
    for (const item of this.presetFields) {
      this.entityForm.formGroup.controls[item].enable();
    }
    this.presetFields = [];
  }

  /* If user blurs name field with empty value, try to auto-populate based on path */
  blurEventName(parent: { entityForm: EntityFormComponent }) {
    const pathControl = parent.entityForm.formGroup.controls['path'];
    const nameControl = parent.entityForm.formGroup.controls['name'];
    if (pathControl.value && !nameControl.value) {
      nameControl.setValue(pathControl.value.split('/').pop());
    }
  }

}
