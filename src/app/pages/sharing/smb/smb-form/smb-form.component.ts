import { Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { combineLatest, Observable, of } from 'rxjs';
import {
  catchError, debounceTime, map, switchMap, take, tap,
} from 'rxjs/operators';
import { ExplorerType } from 'app/enums/explorer-type.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import globalHelptext from 'app/helptext/global-helptext';
import { helptextSharingSmb, shared } from 'app/helptext/sharing';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { SmbPresets, SmbShare } from 'app/interfaces/smb-share.interface';
import { EntityFormComponent } from 'app/modules/entity/entity-form/entity-form.component';
import { FormSelectConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/modules/entity/entity-form/models/fieldset.interface';
import { forbiddenValues } from 'app/modules/entity/entity-form/validators/forbidden-values-validation';
import { EntityUtils } from 'app/modules/entity/utils';
import {
  AppLoaderService, DialogService, SystemGeneralService, WebSocketService,
} from 'app/services';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'app-smb-form',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class SmbFormComponent implements FormConfiguration {
  queryCall = 'sharing.smb.query' as const;
  addCall = 'sharing.smb.create' as const;
  editCall = 'sharing.smb.update' as const;
  pk: number;
  queryKey = 'id';
  isEntity = true;
  isBasicMode = true;
  isTimeMachineOn = false;
  title: string;
  namesInUse: string[] = [];
  productType = window.localStorage.getItem('product_type') as ProductType;
  isOneColumnForm = true;
  private hostsAllowOnLoad: string[] = [];
  private hostsDenyOnLoad: string[] = [];
  private stripACLWarningSent = false;
  private mangleWarningSent = false;
  private mangle: boolean;

  fieldSets: FieldSet[] = [
    {
      name: helptextSharingSmb.fieldset_basic,
      class: 'basic',
      label: true,
      width: '100%',
      config: [
        {
          type: 'explorer',
          initial: '/mnt',
          explorerType: ExplorerType.Directory,
          name: 'path',
          placeholder: helptextSharingSmb.placeholder_path,
          tooltip: helptextSharingSmb.tooltip_path,
          required: true,
          validation: helptextSharingSmb.validators_path,
        },
        {
          type: 'input',
          name: 'name',
          placeholder: helptextSharingSmb.placeholder_name,
          tooltip: helptextSharingSmb.tooltip_name,
          validation: [forbiddenValues(this.namesInUse), Validators.required],
          hasErrors: false,
          errors: helptextSharingSmb.errormsg_name,
          blurStatus: true,
          blurEvent: () => this.blurEventName(),
          parent: this,
        },
        {
          type: 'select',
          name: 'purpose',
          placeholder: helptextSharingSmb.placeholder_purpose,
          tooltip: helptextSharingSmb.tooltip_purpose,
          options: [],
          width: '100%',
        },
        {
          type: 'input',
          name: 'comment',
          placeholder: helptextSharingSmb.placeholder_comment,
          tooltip: helptextSharingSmb.tooltip_comment,
          width: '100%',
        },
        {
          type: 'checkbox',
          name: 'enabled',
          placeholder: helptextSharingSmb.placeholder_enabled,
          tooltip: helptextSharingSmb.tooltip_enabled,
          value: true,
        },
      ],
    },
    {
      name: helptextSharingSmb.fieldset_access,
      class: 'access',
      label: true,
      width: '100%',
      config: [
        {
          type: 'checkbox',
          name: 'acl',
          placeholder: helptextSharingSmb.placeholder_acl,
          tooltip: helptextSharingSmb.tooltip_acl,
          isHidden: true,
        },
        {
          type: 'checkbox',
          name: 'ro',
          placeholder: helptextSharingSmb.placeholder_ro,
          tooltip: helptextSharingSmb.tooltip_ro,
          isHidden: true,
        },
        {
          type: 'checkbox',
          name: 'browsable',
          placeholder: helptextSharingSmb.placeholder_browsable,
          tooltip: helptextSharingSmb.tooltip_browsable,
          isHidden: true,
        },
        {
          type: 'checkbox',
          name: 'guestok',
          placeholder: helptextSharingSmb.placeholder_guestok,
          tooltip: helptextSharingSmb.tooltip_guestok,
          isHidden: true,
        },
        {
          type: 'checkbox',
          name: 'abe',
          placeholder: helptextSharingSmb.placeholder_abe,
          tooltip: helptextSharingSmb.tooltip_abe,
          isHidden: true,
        },
        {
          type: 'chip',
          name: 'hostsallow',
          placeholder: helptextSharingSmb.placeholder_hostsallow,
          tooltip: helptextSharingSmb.tooltip_hostsallow,
          isHidden: true,
        },
        {
          type: 'chip',
          name: 'hostsdeny',
          placeholder: helptextSharingSmb.placeholder_hostsdeny,
          tooltip: helptextSharingSmb.tooltip_hostsdeny,
          isHidden: true,
        },
      ],
    },
    {
      name: helptextSharingSmb.fieldset_other,
      class: 'other',
      label: true,
      width: '100%',
      config: [
        {
          type: 'checkbox',
          name: 'home',
          placeholder: helptextSharingSmb.placeholder_home,
          tooltip: helptextSharingSmb.tooltip_home,
          isHidden: true,
        },
        {
          type: 'checkbox',
          name: 'timemachine',
          placeholder: helptextSharingSmb.placeholder_timemachine,
          tooltip: helptextSharingSmb.tooltip_timemachine,
          isHidden: true,
        },
        {
          type: 'checkbox',
          name: 'afp',
          placeholder: helptextSharingSmb.placeholder_afp,
          tooltip: helptextSharingSmb.tooltip_afp,
          isHidden: true,
          customEventMethod: () => this.afpConfirm(),
        },
        {
          type: 'checkbox',
          name: 'shadowcopy',
          placeholder: helptextSharingSmb.placeholder_shadowcopy,
          tooltip: helptextSharingSmb.tooltip_shadowcopy,
          isHidden: true,
        },
        {
          type: 'checkbox',
          name: 'recyclebin',
          placeholder: helptextSharingSmb.placeholder_recyclebin,
          tooltip: helptextSharingSmb.tooltip_recyclebin,
          isHidden: true,
        },
        {
          type: 'checkbox',
          name: 'aapl_name_mangling',
          placeholder: helptextSharingSmb.placeholder_aapl_name_mangling,
          tooltip: helptextSharingSmb.tooltip_aapl_name_mangling,
          isHidden: true,
        },
        {
          type: 'checkbox',
          name: 'streams',
          placeholder: helptextSharingSmb.placeholder_streams,
          tooltip: helptextSharingSmb.tooltip_streams,
          isHidden: true,
        },
        {
          type: 'checkbox',
          name: 'durablehandle',
          placeholder: helptextSharingSmb.placeholder_durablehandle,
          tooltip: helptextSharingSmb.tooltip_durablehandle,
          isHidden: true,
        },
        {
          type: 'checkbox',
          name: 'fsrvp',
          placeholder: helptextSharingSmb.placeholder_fsrvp,
          tooltip: helptextSharingSmb.tooltip_fsrvp,
          isHidden: true,
        },
        {
          type: 'input',
          name: 'path_suffix',
          placeholder: helptextSharingSmb.placeholder_path_suffix,
          tooltip: helptextSharingSmb.tooltip_path_suffix,
          isHidden: true,
        },
        {
          type: 'textarea',
          name: 'auxsmbconf',
          placeholder: helptextSharingSmb.placeholder_auxsmbconf,
          tooltip: helptextSharingSmb.tooltip_auxsmbconf,
          isHidden: true,
        },
      ],
    },
    { name: 'divider', divider: true },
  ];

  advancedFields = [
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
    'auxsmbconf',
  ];

  protected accessFieldsets = _.find(this.fieldSets, { class: 'access' });
  protected otherFieldsets = _.find(this.fieldSets, { class: 'other' });

  custActions = [
    {
      id: 'basic_mode',
      name: globalHelptext.basic_options,
      function: () => {
        this.isBasicMode = !this.isBasicMode;
        this.updateForm();
      },
    },
    {
      id: 'advanced_mode',
      name: globalHelptext.advanced_options,
      function: () => {
        this.isBasicMode = !this.isBasicMode;
        this.updateForm();
      },
    },
  ];

  entityForm: EntityFormComponent;
  presets: SmbPresets;
  protected presetFields: (keyof SmbShare)[] = [];

  constructor(
    protected router: Router,
    protected ws: WebSocketService,
    private dialog: DialogService,
    protected loader: AppLoaderService,
    private sysGeneralService: SystemGeneralService,
    private modalService: ModalService,
    private translate: TranslateService,
  ) {
    combineLatest([this.ws.call('sharing.smb.query', []), this.modalService.getRow$])
      .pipe(map(([shares, pk]) => shares.filter((share) => share.id !== pk).map((share) => share.name)))
      .pipe(untilDestroyed(this)).subscribe((shareNames) => {
        ['global', ...shareNames].forEach((name) => this.namesInUse.push(name));
      });
  }

  resourceTransformIncomingRestData(data: SmbShare): SmbShare {
    this.mangle = data.aapl_name_mangling;
    this.hostsAllowOnLoad = data.hostsallow ? [...data.hostsallow] : [];
    this.hostsDenyOnLoad = data.hostsdeny ? [...data.hostsdeny] : [];
    return data;
  }

  isCustActionVisible(actionId: string): boolean {
    if (actionId === 'advanced_mode' && !this.isBasicMode) {
      return false;
    }
    if (actionId === 'basic_mode' && this.isBasicMode) {
      return false;
    }
    return true;
  }

  updateForm(): void {
    for (const field of this.accessFieldsets.config) {
      field['isHidden'] = !!this.isBasicMode;
    }
    for (const field of this.otherFieldsets.config) {
      field['isHidden'] = !!this.isBasicMode;
    }
  }

  preInit(entityForm: EntityFormComponent): void {
    this.modalService.getRow$.pipe(take(1)).pipe(untilDestroyed(this)).subscribe((pk: number) => {
      if (pk) {
        this.pk = pk;
        entityForm.pk = pk;
      }
    });
  }

  afterSave(entityForm: EntityFormComponent): void {
    if (entityForm.formGroup.controls['timemachine'].value && !this.isTimeMachineOn) {
      this.restartService(entityForm, 'timemachine');
    } else {
      this.checkAllowDeny(entityForm);
    }
    this.modalService.closeSlideIn();
    this.modalService.refreshTable();
  }

  checkAllowDeny(entityForm: EntityFormComponent): void {
    if (
      !_.isEqual(this.hostsAllowOnLoad, entityForm.formGroup.controls['hostsallow'].value)
      || !_.isEqual(this.hostsDenyOnLoad, entityForm.formGroup.controls['hostsdeny'].value)
    ) {
      this.restartService(entityForm, 'allowdeny');
    } else {
      this.checkAclActions(entityForm);
    }
  }

  restartService(entityForm: EntityFormComponent, source: string): void {
    const confirmOptions = {
      title: helptextSharingSmb.restart_smb_dialog.title,
      message:
        source === 'timemachine'
          ? helptextSharingSmb.restart_smb_dialog.message_time_machine
          : helptextSharingSmb.restart_smb_dialog.message_allow_deny,
      hideCheckBox: true,
      buttonMsg: helptextSharingSmb.restart_smb_dialog.title,
      cancelMsg: helptextSharingSmb.restart_smb_dialog.cancel_btn,
    };
    this.dialog.confirm(confirmOptions).pipe(untilDestroyed(this)).subscribe((res: boolean) => {
      if (res) {
        this.loader.open();
        this.ws.call('service.restart', [ServiceName.Cifs]).pipe(untilDestroyed(this)).subscribe(
          () => {
            this.loader.close();
            this.dialog
              .info(
                helptextSharingSmb.restarted_smb_dialog.title,
                helptextSharingSmb.restarted_smb_dialog.message,
                '250px',
              )
              .pipe(untilDestroyed(this)).subscribe(() => {
                this.checkAclActions(entityForm);
              });
          },
          (err) => {
            this.loader.close();
            this.dialog.errorReport('Error', err.err, err.backtrace);
          },
        );
      } else if (source === 'timemachine') {
        this.checkAllowDeny(entityForm);
      } else {
        this.checkAclActions(entityForm);
      }
    });
  }

  checkAclActions(entityForm: EntityFormComponent): void {
    const sharePath: string = entityForm.formGroup.get('path').value;
    const datasetId = sharePath.replace('/mnt/', '');
    const poolName = datasetId.split('/')[0];
    const homeShare = entityForm.formGroup.get('home').value;
    const aclRoute = ['storage', 'id', poolName, 'dataset', 'acl', datasetId];

    if (homeShare && entityForm.isNew) {
      this.router.navigate(['/'].concat(aclRoute), { queryParams: { homeShare: true } });
      return;
    }
    // If this call returns true OR an [ENOENT] err comes back, just return to table
    // because the pool or ds is encrypted. Otherwise, do the next checks
    this.ws.call('pool.dataset.path_in_locked_datasets', [sharePath]).pipe(untilDestroyed(this)).subscribe(
      (res) => {
        if (res) {
          this.dialog.closeAllDialogs();
        } else {
          /**
           * If share does have trivial ACL, check if user wants to edit dataset permissions. If not,
           * nav to SMB shares list view.
           */
          const promptUserAclEdit = (): Observable<[boolean, Record<string, unknown>] | [boolean]> => {
            return this.ws.call('filesystem.acl_is_trivial', [sharePath]).pipe(
              switchMap((isTrivialAcl) => {
                let nextStep;
                // If share does not have trivial ACL, move on. Otherwise, perform some async data-gathering operations
                if (!isTrivialAcl || !datasetId.includes('/') || this.productType.includes(ProductType.Scale)) {
                  nextStep = combineLatest([of(false), of({})]);
                } else {
                  nextStep = combineLatest([
                    /* Check if user wants to edit the share's ACL */
                    this.dialog.confirm({
                      title: helptextSharingSmb.dialog_edit_acl_title,
                      message: helptextSharingSmb.dialog_edit_acl_message,
                      hideCheckBox: true,
                      buttonMsg: helptextSharingSmb.dialog_edit_acl_button,
                    }),
                  ]);
                }

                return nextStep;
              }),
              tap(([doConfigureAcl]) => {
                if (doConfigureAcl) {
                  this.router.navigate(['/'].concat(aclRoute));
                } else {
                  this.dialog.closeAllDialogs();
                }
              }),
            );
          };

          this.ws
            .call('service.query', [])
            .pipe(
              map((response) => _.find(response, { service: ServiceName.Cifs })),
              switchMap((cifsService) => {
                if (cifsService.enable) {
                  return promptUserAclEdit();
                }

                /**
                 * Allow user to enable cifs service, then ask about editing
                 * dataset ACL.
                 */
                return this.dialog
                  .confirm({
                    title: shared.dialog_title,
                    message: shared.dialog_message,
                    hideCheckBox: true,
                    buttonMsg: shared.dialog_button,
                  })
                  .pipe(
                    switchMap((doEnableService) => {
                      if (doEnableService) {
                        return this.ws.call('service.update', [cifsService.id, { enable: true }]).pipe(
                          switchMap(() => this.ws.call('service.start', [cifsService.service])),
                          switchMap(() => {
                            return this.dialog.info(
                              this.translate.instant('{service} Service', { service: 'SMB' }),
                              this.translate.instant('The {service} service has been enabled.', { service: 'SMB' }),
                              '250px',
                              'info',
                            );
                          }),
                          catchError((error) => {
                            return this.dialog.errorReport(error.error, error.reason, error.trace.formatted);
                          }),
                        );
                      }
                      return of(true);
                    }),
                    switchMap(promptUserAclEdit),
                  );
              }),
              untilDestroyed(this),
            )
            .subscribe(
              () => {},
              (error) => new EntityUtils().handleWsError(this, error, this.dialog),
            );
        }
      },
      (err) => {
        if (err.reason.includes('[ENOENT]')) {
          this.dialog.closeAllDialogs();
        } else {
          // If some other err comes back from filesystem.path_is_encrypted
          this.dialog.errorReport(helptextSharingSmb.action_edit_acl_dialog.title, err.reason, err.trace.formatted);
        }
      },
    );
  }

  afterInit(entityForm: EntityFormComponent): void {
    const generalFieldsets = _.find(this.fieldSets, { class: 'basic' });
    const purposeField = _.find(generalFieldsets.config, { name: 'purpose' }) as FormSelectConfig;
    this.ws.call('sharing.smb.presets').pipe(untilDestroyed(this)).subscribe(
      (presets) => {
        this.presets = presets;
        for (const item in presets) {
          purposeField.options.push({ label: presets[item]['verbose_name'], value: item });
        }
        if (entityForm.isNew) {
          entityForm.formGroup.controls['purpose'].setValue('DEFAULT_SHARE');
        }
      },
      (err) => {
        new EntityUtils().handleWsError(this, err, this.dialog);
      },
    );

    this.entityForm = entityForm;
    this.title = entityForm.isNew ? helptextSharingSmb.formTitleAdd : helptextSharingSmb.formTitleEdit;
    if (entityForm.isNew) {
      entityForm.formGroup.controls['browsable'].setValue(true);
    } else {
      setTimeout(() => {
        entityForm.formGroup.controls['aapl_name_mangling'].valueChanges.pipe(untilDestroyed(this)).subscribe((value) => {
          if (value !== this.mangle && !this.mangleWarningSent) {
            this.mangleWarningSent = true;
            this.dialog.confirm({
              title: helptextSharingSmb.manglingDialog.title,
              message: helptextSharingSmb.manglingDialog.message,
              hideCheckBox: true,
              buttonMsg: helptextSharingSmb.manglingDialog.action,
              hideCancel: true,
            });
          }
        });
      }, 1000);
    }

    /*  If name is empty, auto-populate after path selection */
    entityForm.formGroup.controls['path'].valueChanges.pipe(untilDestroyed(this)).subscribe((path) => {
      const nameControl = entityForm.formGroup.controls['name'];
      if (path && !nameControl.value) {
        const v = path.split('/').pop();
        nameControl.setValue(v);
      }

      if (!this.stripACLWarningSent) {
        this.ws.call('filesystem.acl_is_trivial', [path]).pipe(untilDestroyed(this)).subscribe((res) => {
          if (!res && !entityForm.formGroup.controls['acl'].value) {
            this.stripACLWarningSent = true;
            this.showStripAclWarning();
          }
        });
      }
    });

    const pathControl = entityForm.formGroup.controls['path'];
    entityForm.formGroup.controls['acl'].valueChanges.pipe(debounceTime(100)).pipe(untilDestroyed(this)).subscribe((res) => {
      if (!res && pathControl.value && !this.stripACLWarningSent) {
        this.ws.call('filesystem.acl_is_trivial', [pathControl.value]).pipe(untilDestroyed(this)).subscribe((res) => {
          if (!res) {
            this.stripACLWarningSent = true;
            this.showStripAclWarning();
          }
        });
      }
    });

    setTimeout(() => {
      if (entityForm.formGroup.controls['timemachine'].value) {
        this.isTimeMachineOn = true;
      }
    }, 700);

    this.sysGeneralService.getAdvancedConfig$.pipe(untilDestroyed(this)).subscribe((config) => {
      this.isBasicMode = !config.advancedmode;
      this.updateForm();
    });

    entityForm.formGroup.controls['purpose'].valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
      this.clearPresets();
      for (const item in this.presets[res].params) {
        this.presetFields.push(item as keyof SmbShare);
        const ctrl = entityForm.formGroup.controls[item];
        if (ctrl && item !== 'auxsmbconf') {
          ctrl.setValue(this.presets[res].params[item as keyof SmbShare]);
          ctrl.disable();
        }
      }
    });
  }

  afpConfirm(): void {
    const afpControl = this.entityForm.formGroup.controls['afp'];

    this.dialog.confirm({
      title: helptextSharingSmb.afpDialog_title,
      message: helptextSharingSmb.afpDialog_message,
      hideCheckBox: false,
      buttonMsg: helptextSharingSmb.afpDialog_button,
      hideCancel: false,
    }).pipe(untilDestroyed(this)).subscribe((dialogResult: boolean) => {
      if (dialogResult) {
        afpControl.setValue(!afpControl.value);
      }
    });
  }

  showStripAclWarning(): void {
    this.dialog.confirm({
      title: helptextSharingSmb.stripACLDialog.title,
      message: helptextSharingSmb.stripACLDialog.message,
      hideCheckBox: true,
      buttonMsg: helptextSharingSmb.stripACLDialog.button,
      hideCancel: true,
    });
  }

  clearPresets(): void {
    for (const item of this.presetFields) {
      this.entityForm.formGroup.controls[item].enable();
    }
    this.presetFields = [];
  }

  /* If user blurs name field with empty value, try to auto-populate based on path */
  blurEventName(): void {
    const pathControl = this.entityForm.formGroup.controls['path'];
    const nameControl = this.entityForm.formGroup.controls['name'];
    if (pathControl.value && !nameControl.value) {
      nameControl.setValue(pathControl.value.split('/').pop());
    }
  }
}
