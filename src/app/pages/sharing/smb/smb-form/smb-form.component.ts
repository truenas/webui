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

  protected fieldSets: FieldSet[] = [
    {
      name: helptext_sharing_smb.fieldset_general,
      label: true,
      config: [
        {
          type : 'explorer',
          initial: '/mnt',
          explorerType: 'directory',
          name: 'path',
          placeholder: helptext_sharing_smb.placeholder_path,
          tooltip: helptext_sharing_smb.tooltip_path,
          required: true,
          validation : helptext_sharing_smb.validators_path
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
          type: 'checkbox',
          name: 'home',
          placeholder: helptext_sharing_smb.placeholder_home,
          tooltip: helptext_sharing_smb.tooltip_home,
        },
        {
          type: 'input',
          name: 'comment',
          placeholder: helptext_sharing_smb.placeholder_comment,
          tooltip: helptext_sharing_smb.tooltip_comment,
        },
        {
          type: 'checkbox',
          name: 'timemachine',
          placeholder: helptext_sharing_smb.placeholder_timemachine,
          tooltip: helptext_sharing_smb.tooltip_timemachine,
        },
        {
          type: 'checkbox',
          name: 'shadowcopy',
          placeholder: helptext_sharing_smb.placeholder_shadowcopy,
          tooltip: helptext_sharing_smb.tooltip_shadowcopy
        }
      ]
    },
    { name: 'divider', divider: false },
    {
      name: helptext_sharing_smb.fieldset_access,
      label: false,
      width: '49%',
      config: [
        {
          type: 'checkbox',
          name: 'ro',
          placeholder: helptext_sharing_smb.placeholder_ro,
          tooltip: helptext_sharing_smb.tooltip_ro
        },
        {
          type: 'checkbox',
          name: 'browsable',
          placeholder: helptext_sharing_smb.placeholder_browsable,
          tooltip: helptext_sharing_smb.tooltip_browsable,
        },
        {
          type: 'checkbox',
          name: 'guestok',
          placeholder: helptext_sharing_smb.placeholder_guestok,
          tooltip: helptext_sharing_smb.tooltip_guestok
        },
        {
          type: 'checkbox',
          name: 'guestonly',
          placeholder: helptext_sharing_smb.placeholer_guestonly,
          tooltip: helptext_sharing_smb.tooltip_guestonly
        },
        {
          type: 'checkbox',
          name: 'abe',
          placeholder: helptext_sharing_smb.placeholder_abe,
          tooltip: helptext_sharing_smb.tooltip_abe
        },
        {
          type: 'textarea',
          name: 'hostsallow',
          placeholder: helptext_sharing_smb.placeholder_hostsallow,
          tooltip: helptext_sharing_smb.tooltip_hostsallow
        },
        {
          type: 'textarea',
          name: 'hostsdeny',
          placeholder: helptext_sharing_smb.placeholder_hostsdeny,
          tooltip: helptext_sharing_smb.tooltip_hostsdeny
        }
      ]
    },
    { name: 'spacer', label: false, width: '2%' },
    {
      name: helptext_sharing_smb.fieldset_other,
      label: false,
      width: '49%',
      config: [
        {
          type: 'checkbox',
          name: 'recyclebin',
          placeholder: helptext_sharing_smb.placeholder_recyclebin,
          tooltip: helptext_sharing_smb.tooltip_recyclebin
        },
        {
          type: 'checkbox',
          name: 'showhiddenfiles',
          placeholder: helptext_sharing_smb.placeholder_showhiddenfiles,
          tooltip: helptext_sharing_smb.tooltip_showhiddenfiles
        },
        {
          type: 'select',
          name: 'vfsobjects',
          placeholder: helptext_sharing_smb.placeholder_vfsobjects,
          tooltip: helptext_sharing_smb.tooltip_vfsobjects,
          options: [],
          multiple: true,
        },
        {
          type: 'textarea',
          name: 'auxsmbconf',
          placeholder: helptext_sharing_smb.placeholder_auxsmbconf,
          tooltip: helptext_sharing_smb.tooltip_auxsmbconf,
        }
      ]
    },
    { name: 'divider', divider: true }    
  ]

  private cifs_vfsobjects: any;

  protected advanced_field: Array<any> = [
    'auxsmbconf',
    'vfsobjects',
    'hostsdeny',
    'hostsallow',
    'guestok',
    'guestonly',
    'abe',
    'showhiddenfiles',
    'recyclebin',
    'browsable',
    'ro',
  ];

  public custActions: Array<any> = [
    {
      id : 'basic_mode',
      name : helptext_sharing_smb.actions_basic_mode,
      function: () => {
        this.isBasicMode = !this.isBasicMode;
        this.toggleFieldsets(false);
      }
    },
    {
      id : 'advanced_mode',
      name : helptext_sharing_smb.actions_advanced_mode,
      function : () => {
        this.isBasicMode = !this.isBasicMode;
        this.toggleFieldsets(true);
      }
    }
  ];

  public entityForm: EntityFormComponent;

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

  isCustActionVisible(actionId: string) {
    if (actionId == 'advanced_mode' && this.isBasicMode == false) {
      return false;
    } else if (actionId == 'basic_mode' && this.isBasicMode == true) {
      return false;
    }
    return true;
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

  /* Show/hide advanced fieldsets */
  toggleFieldsets(isShow = false): void {
    this.fieldSets
      .filter(
        set =>
          set.name !== helptext_sharing_smb.fieldset_general &&
          set.name !== "divider" &&
          set.name !== "spacer"
      )
      .forEach(set => { set.label = isShow; });

    const divSets = this.fieldSets.filter(set => set.name === "divider");
    divSets.pop(); /* Always show last divider */
    divSets.forEach(set => { set.divider = isShow; });
  }

  afterSave(entityForm) {
    if (entityForm.formGroup.controls['timemachine'].value && !this.isTimeMachineOn) {
      this.dialog.confirm(helptext_sharing_smb.restart_smb_dialog.title, helptext_sharing_smb.restart_smb_dialog.message,
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
            this.checkACLactions(entityForm);
          }
        });
    } else {
      this.checkACLactions(entityForm);   
    }
  }

  checkACLactions(entityForm) {
    const sharePath: string = entityForm.formGroup.get('path').value;
    const datasetId = sharePath.replace('/mnt/', '');
    const poolName = datasetId.split('/')[0];
    /**
     * If share does have trivial ACL, check if user wants to edit dataset permissions. If not,
     * nav to SMB shares list view.
     */
    const promptUserACLEdit = () => 
      this.ws.call('filesystem.acl_is_trivial', [sharePath]).pipe(
        switchMap((isTrivialACL: boolean) =>
          /* If share does not have trivial ACL, move on. Otherwise, perform some async data-gathering operations */
          !isTrivialACL || !datasetId.includes('/')
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
                ['/'].concat(['storage', 'pools', 'id', poolName, 'dataset', 'acl', datasetId])
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

  afterInit(entityForm: EntityFormComponent) {
    this.entityForm = entityForm;
    this.ws.call('sharing.smb.vfsobjects_choices', [])
        .subscribe((res) => {
          this.cifs_vfsobjects = this.fieldSets
            .find(set => set.name === helptext_sharing_smb.fieldset_other)
            .config.find(config => config.name === "vfsobjects");
          const options = [];
          res.forEach((item) => {
            options.push({label : item, value : item});
          });
          this.cifs_vfsobjects.options = _.sortBy(options, ['label']);
        });
    if (entityForm.isNew) {
      entityForm.formGroup.controls['vfsobjects'].setValue(['ixnas', 'streams_xattr']);
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
