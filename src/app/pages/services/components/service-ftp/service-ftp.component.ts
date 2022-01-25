import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { ExplorerType } from 'app/enums/explorer-type.enum';
import globalHelptext from 'app/helptext/global-helptext';
import helptext from 'app/helptext/services/components/service-ftp';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { FtpConfig, FtpConfigUpdate } from 'app/interfaces/ftp-config.interface';
import { FieldSets } from 'app/modules/entity/entity-form/classes/field-sets';
import { EntityFormComponent } from 'app/modules/entity/entity-form/entity-form.component';
import { FieldConfig, FormSelectConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/modules/entity/entity-form/models/fieldset.interface';
import { RelationAction } from 'app/modules/entity/entity-form/models/relation-action.enum';
import {
  DialogService, SystemGeneralService, WebSocketService, StorageService,
} from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ftp-edit',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [SystemGeneralService],
})
export class ServiceFtpComponent implements FormConfiguration, OnInit {
  editCall = 'ftp.update' as const;
  queryCall = 'ftp.config' as const;
  routeSuccess: string[] = ['services'];

  isBasicMode = true;
  protected entityForm: EntityFormComponent;

  protected rootloginControl: FormControl;
  protected warned = false;
  protected rootlogin: boolean;
  fieldConfig: FieldConfig[];
  title = helptext.formTitle;

  protected bwFields = ['localuserbw', 'localuserdlbw', 'anonuserbw', 'anonuserdlbw'];

  fieldSets = new FieldSets([
    {
      name: helptext.fieldset_general,
      label: true,
      class: 'general',
      config: [
        {
          type: 'input',
          name: 'port',
          placeholder: helptext.port_placeholder,
          tooltip: helptext.port_tooltip,
          required: true,
          validation: helptext.port_validation,
        },
        {
          type: 'input',
          name: 'clients',
          placeholder: helptext.clients_placeholder,
          tooltip: helptext.clients_tooltip,
          required: true,
          validation: helptext.clients_validation,
        },
        {
          type: 'input',
          name: 'ipconnections',
          placeholder: helptext.ipconnections_placeholder,
          tooltip: helptext.ipconnections_tooltip,
          required: true,
          validation: helptext.ipconnections_validation,
        },
        {
          type: 'input',
          name: 'loginattempt',
          placeholder: helptext.loginattempt_placeholder,
          tooltip: helptext.loginattempt_tooltip,
          required: true,
          validation: helptext.loginattempt_validation,
        },
        {
          type: 'input',
          name: 'timeout_notransfer',
          placeholder: helptext.timeout_notransfer_placeholder,
          tooltip: helptext.timeout_notransfer_tooltip,
          required: true,
          validation: helptext.timeout_notransfer_validation,
        },
        {
          type: 'input',
          name: 'timeout',
          placeholder: helptext.timeout_placeholder,
          tooltip: helptext.timeout_tooltip,
          required: true,
          validation: helptext.timeout_validation,
        },
        {
          type: 'select',
          name: 'ssltls_certificate',
          placeholder: helptext.ssltls_certificate_placeholder,
          tooltip: helptext.ssltls_certificate_tooltip,
          options: [{ label: '-', value: null }],
        },
      ],
    },
    { name: 'divider_access_tls', divider: false },
    {
      name: helptext.fieldset_access,
      label: false,
      class: 'access',
      width: '50%',
      config: [
        {
          type: 'checkbox',
          name: 'defaultroot',
          placeholder: helptext.defaultroot_placeholder,
          tooltip: helptext.defaultroot_tooltip,
        },
        {
          type: 'checkbox',
          name: 'rootlogin',
          placeholder: helptext.rootlogin_placeholder,
          tooltip: helptext.rootlogin_tooltip,
        },
        {
          type: 'checkbox',
          name: 'onlyanonymous',
          placeholder: helptext.onlyanonymous_placeholder,
          tooltip: helptext.onlyanonymous_tooltip,
        },
        {
          type: 'explorer',
          initial: '/mnt',
          explorerType: ExplorerType.Directory,
          name: 'anonpath',
          placeholder: helptext.anonpath_placeholder,
          tooltip: helptext.anonpath_tooltip,
          required: true,
          relation: [
            {
              action: RelationAction.Hide,
              when: [
                {
                  name: 'onlyanonymous',
                  value: false,
                },
              ],
            },
          ],
        },
        {
          type: 'checkbox',
          name: 'onlylocal',
          placeholder: helptext.onlylocal_placeholder,
          tooltip: helptext.onlylocal_tooltip,
        },
        {
          type: 'checkbox',
          name: 'ident',
          placeholder: helptext.ident_placeholder,
          tooltip: helptext.ident_tooltip,
        },
        {
          type: 'permissions',
          name: 'filemask',
          placeholder: helptext.filemask_placeholder,
          tooltip: helptext.filemask_tooltip,
        },
        {
          type: 'permissions',
          name: 'dirmask',
          placeholder: helptext.dirmask_placeholder,
          tooltip: helptext.dirmask_tooltip,
        },
      ],
    },
    {
      name: helptext.fieldset_tls,
      label: false,
      class: 'tls',
      width: '50%',
      config: [
        {
          type: 'checkbox',
          name: 'tls',
          placeholder: helptext.tls_placeholder,
          tooltip: helptext.tls_tooltip,
        },
        {
          type: 'select',
          name: 'tls_policy',
          placeholder: helptext.tls_policy_placeholder,
          tooltip: helptext.tls_policy_tooltip,
          options: helptext.tls_policy_options,
        },
        {
          type: 'checkbox',
          name: 'tls_opt_allow_client_renegotiations',
          placeholder: helptext.tls_opt_allow_client_renegotiations_placeholder,
          tooltip: helptext.tls_opt_allow_client_renegotiations_tooltip,
        },
        {
          type: 'checkbox',
          name: 'tls_opt_allow_dot_login',
          placeholder: helptext.tls_opt_allow_dot_login_placeholder,
          tooltip: helptext.tls_opt_allow_dot_login_tooltip,
        },
        {
          type: 'checkbox',
          name: 'tls_opt_allow_per_user',
          placeholder: helptext.tls_opt_allow_per_user_placeholder,
          tooltip: helptext.tls_opt_allow_per_user_tooltip,
        },
        {
          type: 'checkbox',
          name: 'tls_opt_common_name_required',
          placeholder: helptext.tls_opt_common_name_required_placeholder,
          tooltip: helptext.tls_opt_common_name_required_tooltip,
        },
        {
          type: 'checkbox',
          name: 'tls_opt_enable_diags',
          placeholder: helptext.tls_opt_enable_diags_placeholder,
          tooltip: helptext.tls_opt_enable_diags_tooltip,
        },
        {
          type: 'checkbox',
          name: 'tls_opt_export_cert_data',
          placeholder: helptext.tls_opt_export_cert_data_placeholder,
          tooltip: helptext.tls_opt_export_cert_data_tooltip,
        },
        {
          type: 'checkbox',
          name: 'tls_opt_no_cert_request',
          placeholder: helptext.tls_opt_no_cert_request_placeholder,
          tooltip: helptext.tls_opt_no_cert_request_tooltip,
        },
        {
          type: 'checkbox',
          name: 'tls_opt_no_empty_fragments',
          placeholder: helptext.tls_opt_no_empty_fragments_placeholder,
          tooltip: helptext.tls_opt_no_empty_fragments_tooltip,
        },
        {
          type: 'checkbox',
          name: 'tls_opt_no_session_reuse_required',
          placeholder: helptext.tls_opt_no_session_reuse_required_placeholder,
          tooltip: helptext.tls_opt_no_session_reuse_required_tooltip,
        },
        {
          type: 'checkbox',
          name: 'tls_opt_stdenvvars',
          placeholder: helptext.tls_opt_stdenvvars_placeholder,
          tooltip: helptext.tls_opt_stdenvvars_tooltip,
        },
        {
          type: 'checkbox',
          name: 'tls_opt_dns_name_required',
          placeholder: helptext.tls_opt_dns_name_required_placeholder,
          tooltip: helptext.tls_opt_dns_name_required_tooltip,
        },
        {
          type: 'checkbox',
          name: 'tls_opt_ip_address_required',
          placeholder: helptext.tls_opt_ip_address_required_placeholder,
          tooltip: helptext.tls_opt_ip_address_required_tooltip,
        },
      ],
    },
    { name: 'divider_bw', divider: false },
    {
      name: helptext.fieldset_bw,
      label: false,
      class: 'bw',
      config: [
        {
          type: 'input',
          name: 'localuserbw',
          placeholder: this.translate.instant(helptext.localuserbw_placeholder)
          + this.translate.instant(globalHelptext.human_readable.suggestion_label),
          tooltip: this.translate.instant(helptext.userbw_tooltip)
          + this.translate.instant(globalHelptext.human_readable.suggestion_tooltip)
          + this.translate.instant(' KiB.'),
          required: true,
          validation: helptext.userbw_validation,
          blurStatus: true,
          blurEvent: () => this.localUserBwBlur(),
          parent: this,
        },
        {
          type: 'input',
          name: 'localuserdlbw',
          placeholder: helptext.localuserdlbw_placeholder,
          tooltip: this.translate.instant(helptext.userbw_tooltip)
          + this.translate.instant(globalHelptext.human_readable.suggestion_tooltip)
          + this.translate.instant(' KiB.'),
          required: true,
          validation: helptext.userbw_validation,
          blurStatus: true,
          blurEvent: () => this.localUserDlbwBlur(),
          parent: this,
        },
        {
          type: 'input',
          name: 'anonuserbw',
          placeholder: helptext.anonuserbw_placeholder,
          tooltip: this.translate.instant(helptext.userbw_tooltip)
          + this.translate.instant(globalHelptext.human_readable.suggestion_tooltip)
          + this.translate.instant(' KiB.'),
          required: true,
          validation: helptext.userbw_validation,
          blurStatus: true,
          blurEvent: () => this.anonUserBwBlur(),
          parent: this,
        },
        {
          type: 'input',
          name: 'anonuserdlbw',
          placeholder: helptext.anonuserdlbw_placeholder,
          tooltip: this.translate.instant(helptext.userbw_tooltip)
          + this.translate.instant(globalHelptext.human_readable.suggestion_tooltip)
          + this.translate.instant(' KiB.'),
          required: true,
          validation: helptext.userbw_validation,
          blurStatus: true,
          blurEvent: () => this.anonUserDlbwBlur(),
          parent: this,
        },
      ],
    },
    { name: 'divider_other', divider: false },
    {
      name: helptext.fieldset_other,
      label: false,
      class: 'other',
      config: [
        {
          type: 'input',
          name: 'passiveportsmin',
          placeholder: helptext.passiveportsmin_placeholder,
          tooltip: helptext.passiveportsmin_tooltip,
          required: true,
          validation: helptext.passiveportsmin_validation,
        },
        {
          type: 'input',
          name: 'passiveportsmax',
          placeholder: helptext.passiveportsmax_placeholder,
          tooltip: helptext.passiveportsmax_tooltip,
          required: true,
          validation: helptext.passiveportsmax_validation,
        },
        {
          type: 'checkbox',
          name: 'fxp',
          placeholder: helptext.fxp_placeholder,
          tooltip: helptext.fxp_tooltip,
        },
        {
          type: 'checkbox',
          name: 'resume',
          placeholder: helptext.resume_placeholder,
          tooltip: helptext.resume_tooltip,
        },
        {
          type: 'checkbox',
          name: 'reversedns',
          placeholder: helptext.reversedns_placeholder,
          tooltip: helptext.reversedns_tooltip,
        },
        {
          type: 'input',
          name: 'masqaddress',
          placeholder: helptext.masqaddress_placeholder,
          tooltip: helptext.masqaddress_tooltip,
        },
        {
          type: 'textarea',
          name: 'banner',
          placeholder: helptext.banner_placeholder,
          tooltip: helptext.banner_tooltip,
        },
        {
          type: 'textarea',
          name: 'options',
          placeholder: helptext.options_placeholder,
          tooltip: helptext.options_tooltip,
        },
      ],
    },
    { name: 'divider', divider: true },
  ] as FieldSet<this>[]);

  advancedFields = this.fieldSets.advancedFields;

  custActions = [
    {
      id: 'basic_mode',
      name: globalHelptext.basic_options,
      function: () => {
        this.isBasicMode = !this.isBasicMode;
        this.fieldSets.toggleSets().toggleDividers();
      },
    },
    {
      id: 'advanced_mode',
      name: globalHelptext.advanced_options,
      function: () => {
        this.isBasicMode = !this.isBasicMode;
        this.fieldSets.toggleSets().toggleDividers();
      },
    },
  ];

  isCustActionVisible(actionId: string): boolean {
    if (actionId === 'advanced_mode' && !this.isBasicMode) {
      return false;
    } if (actionId === 'basic_mode' && this.isBasicMode) {
      return false;
    }
    return true;
  }

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected ws: WebSocketService,
    protected dialog: DialogService,
    protected storageService: StorageService,
    protected systemGeneralService: SystemGeneralService,
    protected translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.systemGeneralService.getCertificates().pipe(untilDestroyed(this)).subscribe((res) => {
      if (res.length > 0) {
        const config = this.fieldSets.config('ssltls_certificate') as FormSelectConfig;
        config.options = res.map((cert) => ({ label: cert.name, value: cert.id }));
      }
    });
  }

  afterInit(entityEdit: EntityFormComponent): void {
    this.entityForm = entityEdit;
    entityEdit.submitFunction = this.submitFunction;
    this.rootloginControl = entityEdit.formGroup.controls['rootlogin'] as FormControl;
    this.rootloginControl.valueChanges.pipe(untilDestroyed(this)).subscribe((res: boolean) => {
      if (res && !this.warned && !this.rootlogin) {
        this.dialog.confirm({
          title: helptext.rootlogin_dialog_title,
          message: helptext.rootlogin_dialog_message,
          buttonMsg: this.translate.instant('Continue'),
          cancelMsg: this.translate.instant('Cancel'),
          disableClose: true,
        }).pipe(untilDestroyed(this)).subscribe((confirm) => {
          if (!confirm) {
            this.rootloginControl.setValue(false);
          } else {
            this.warned = true;
          }
        });
      }
      if (!res && !this.warned && this.rootlogin) {
        this.rootlogin = res;
      }
    });

    this.bwFields.forEach((field) => {
      entityEdit.formGroup.controls[field].valueChanges.pipe(untilDestroyed(this)).subscribe((value: any) => {
        const formField = _.find(this.fieldConfig, { name: field });
        const filteredValue = value ? this.storageService.convertHumanStringToNum(value, false, 'kmgtp') : undefined;
        formField['hasErrors'] = false;
        formField['errors'] = '';
        if (filteredValue !== undefined && Number.isNaN(filteredValue)) {
          formField['hasErrors'] = true;
          formField['errors'] = helptext.bandwidth_err;
        }
      });
    });

    // 'Erase' humanReadable after load to keep from accidentaly resetting values
    setTimeout(() => {
      this.storageService.humanReadable = '';
    }, 1000);
  }

  resourceTransformIncomingRestData(data: any): any {
    this.bwFields.forEach((field) => {
      data[field] = this.storageService.convertBytestoHumanReadable(data[field] * 1024, 0, 'KiB');
    });

    this.rootlogin = data['rootlogin'];
    const certificate = data['ssltls_certificate'];
    if (certificate && certificate.id) {
      data['ssltls_certificate'] = certificate.id;
    }

    const fileperm = parseInt(data['filemask'], 8);
    let filemask = (~fileperm & 0o777).toString(8);
    while (filemask.length < 3) {
      filemask = '0' + filemask;
    }
    data['filemask'] = filemask;

    const dirperm = parseInt(data['dirmask'], 8);
    let dirmask = (~dirperm & 0o777).toString(8);
    while (dirmask.length < 3) {
      dirmask = '0' + dirmask;
    }
    data['dirmask'] = dirmask;

    return data;
  }

  beforeSubmit(data: any): void {
    this.bwFields.forEach((field) => {
      data[field] = this.storageService.convertHumanStringToNum(data[field]) / 1024;
    });

    const fileperm = parseInt(data['filemask'], 8);
    let filemask = (~fileperm & 0o777).toString(8);
    while (filemask.length < 3) {
      filemask = '0' + filemask;
    }
    data['filemask'] = filemask;

    const dirperm = parseInt(data['dirmask'], 8);
    let dirmask = (~dirperm & 0o777).toString(8);
    while (dirmask.length < 3) {
      dirmask = '0' + dirmask;
    }
    data['dirmask'] = dirmask;
  }

  submitFunction(body: FtpConfigUpdate): Observable<FtpConfig> {
    return this.ws.call('ftp.update', [body]);
  }

  localUserBwBlur(): void {
    if (this.entityForm && this.storageService.humanReadable) {
      this.transformValue('localuserbw');
    }
  }

  localUserDlbwBlur(): void {
    if (this.entityForm && this.storageService.humanReadable) {
      this.transformValue('localuserdlbw');
    }
  }

  anonUserBwBlur(): void {
    if (this.entityForm && this.storageService.humanReadable) {
      this.transformValue('anonuserbw');
    }
  }

  anonUserDlbwBlur(): void {
    if (this.entityForm && this.storageService.humanReadable) {
      this.transformValue('anonuserdlbw');
    }
  }

  transformValue(fieldname: string): void {
    this.entityForm.formGroup.controls[fieldname].setValue(this.storageService.humanReadable || 0);
    // Clear humanReadable value to keep from accidentally setting it elsewhere
    this.storageService.humanReadable = '';
  }
}
