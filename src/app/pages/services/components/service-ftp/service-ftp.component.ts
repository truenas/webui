import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FieldSets } from 'app/pages/common/entity/entity-form/classes/field-sets';
import helptext from '../../../../helptext/services/components/service-ftp';
import global_helptext from '../../../../helptext/global-helptext';
import * as _ from 'lodash';
import { DialogService, RestService, SystemGeneralService, WebSocketService, StorageService } from '../../../../services/';
import { T } from '../../../../translate-marker';

@Component({
  selector : 'ftp-edit',
  template : `<entity-form [conf]="this"></entity-form>`,
  providers : [ SystemGeneralService ]
})
export class ServiceFTPComponent implements OnInit {
  protected editCall: string = 'ftp.update';
  protected queryCall: string = 'ftp.config';
  protected route_success: string[] = [ 'services' ];

  protected isBasicMode: boolean = true;
  protected entityForm: any;

  protected rootlogin_fg: any;
  protected rootloginSubscription: any;
  protected warned = false;
  protected rootlogin: boolean;
  protected fieldConfig;
  public title = helptext.formTitle;

  protected bwFields = ['localuserbw', 'localuserdlbw', 'anonuserbw', 'anonuserdlbw'];

  public fieldSets = new FieldSets([
    {
      name: helptext.fieldset_general,
      label: true,
      class: "general",
      config: [
        {
          type: "input",
          name: "port",
          placeholder: helptext.port_placeholder,
          tooltip: helptext.port_tooltip,
          required: true,
          validation: helptext.port_validation
        },
        {
          type: "input",
          name: "clients",
          placeholder: helptext.clients_placeholder,
          tooltip: helptext.clients_tooltip,
          required: true,
          validation: helptext.clients_validation
        },
        {
          type: "input",
          name: "ipconnections",
          placeholder: helptext.ipconnections_placeholder,
          tooltip: helptext.ipconnections_tooltip,
          required: true,
          validation: helptext.ipconnections_validation
        },
        {
          type: "input",
          name: "loginattempt",
          placeholder: helptext.loginattempt_placeholder,
          tooltip: helptext.loginattempt_tooltip,
          required: true,
          validation: helptext.loginattempt_validation
        },
        {
          type: "input",
          name: "timeout",
          placeholder: helptext.timeout_placeholder,
          tooltip: helptext.timeout_tooltip,
          required: true,
          validation: helptext.timeout_validation
        },
        {
          type: "select",
          name: "ssltls_certificate",
          placeholder: helptext.ssltls_certificate_placeholder,
          tooltip: helptext.ssltls_certificate_tooltip,
          options: [{ label: "-", value: null }]
        }
      ]
    },
    { name: "divider_access_tls", divider: false },
    {
      name: helptext.fieldset_access,
      label: false,
      class: "access",
      width: "50%",
      config: [
        {
          type: "checkbox",
          name: "defaultroot",
          placeholder: helptext.defaultroot_placeholder,
          tooltip: helptext.defaultroot_tooltip
        },
        {
          type: "checkbox",
          name: "rootlogin",
          placeholder: helptext.rootlogin_placeholder,
          tooltip: helptext.rootlogin_tooltip
        },
        {
          type: "checkbox",
          name: "onlyanonymous",
          placeholder: helptext.onlyanonymous_placeholder,
          tooltip: helptext.onlyanonymous_tooltip
        },
        {
          type: "explorer",
          initial: "/mnt",
          explorerType: "directory",
          name: "anonpath",
          placeholder: helptext.anonpath_placeholder,
          tooltip: helptext.anonpath_tooltip,
          required: true,
          relation: [
            {
              action: "HIDE",
              when: [
                {
                  name: "onlyanonymous",
                  value: false
                }
              ]
            }
          ]
        },
        {
          type: "checkbox",
          name: "onlylocal",
          placeholder: helptext.onlylocal_placeholder,
          tooltip: helptext.onlylocal_tooltip
        },
        {
          type: "checkbox",
          name: "ident",
          placeholder: helptext.ident_placeholder,
          tooltip: helptext.ident_tooltip
        },
        {
          type: "permissions",
          name: "filemask",
          placeholder: helptext.filemask_placeholder,
          tooltip: helptext.filemask_tooltip,
          noexec: true
        },
        {
          type: "permissions",
          name: "dirmask",
          placeholder: helptext.dirmask_placeholder,
          tooltip: helptext.dirmask_tooltip
        }
      ]
    },
    {
      name: helptext.fieldset_tls,
      label: false,
      class: "tls",
      width: "50%",
      config: [
        {
          type: "checkbox",
          name: "tls",
          placeholder: helptext.tls_placeholder,
          tooltip: helptext.tls_tooltip
        },
        {
          type: "select",
          name: "tls_policy",
          placeholder: helptext.tls_policy_placeholder,
          tooltip: helptext.tls_policy_tooltip,
          options: helptext.tls_policy_options
        },
        {
          type: "checkbox",
          name: "tls_opt_allow_client_renegotiations",
          placeholder: helptext.tls_opt_allow_client_renegotiations_placeholder,
          tooltip: helptext.tls_opt_allow_client_renegotiations_tooltip
        },
        {
          type: "checkbox",
          name: "tls_opt_allow_dot_login",
          placeholder: helptext.tls_opt_allow_dot_login_placeholder,
          tooltip: helptext.tls_opt_allow_dot_login_tooltip
        },
        {
          type: "checkbox",
          name: "tls_opt_allow_per_user",
          placeholder: helptext.tls_opt_allow_per_user_placeholder,
          tooltip: helptext.tls_opt_allow_per_user_tooltip
        },
        {
          type: "checkbox",
          name: "tls_opt_common_name_required",
          placeholder: helptext.tls_opt_common_name_required_placeholder,
          tooltip: helptext.tls_opt_common_name_required_tooltip
        },
        {
          type: "checkbox",
          name: "tls_opt_enable_diags",
          placeholder: helptext.tls_opt_enable_diags_placeholder,
          tooltip: helptext.tls_opt_enable_diags_tooltip
        },
        {
          type: "checkbox",
          name: "tls_opt_export_cert_data",
          placeholder: helptext.tls_opt_export_cert_data_placeholder,
          tooltip: helptext.tls_opt_export_cert_data_tooltip
        },
        {
          type: "checkbox",
          name: "tls_opt_no_cert_request",
          placeholder: helptext.tls_opt_no_cert_request_placeholder,
          tooltip: helptext.tls_opt_no_cert_request_tooltip
        },
        {
          type: "checkbox",
          name: "tls_opt_no_empty_fragments",
          placeholder: helptext.tls_opt_no_empty_fragments_placeholder,
          tooltip: helptext.tls_opt_no_empty_fragments_tooltip
        },
        {
          type: "checkbox",
          name: "tls_opt_no_session_reuse_required",
          placeholder: helptext.tls_opt_no_session_reuse_required_placeholder,
          tooltip: helptext.tls_opt_no_session_reuse_required_tooltip
        },
        {
          type: "checkbox",
          name: "tls_opt_stdenvvars",
          placeholder: helptext.tls_opt_stdenvvars_placeholder,
          tooltip: helptext.tls_opt_stdenvvars_tooltip
        },
        {
          type: "checkbox",
          name: "tls_opt_dns_name_required",
          placeholder: helptext.tls_opt_dns_name_required_placeholder,
          tooltip: helptext.tls_opt_dns_name_required_tooltip
        },
        {
          type: "checkbox",
          name: "tls_opt_ip_address_required",
          placeholder: helptext.tls_opt_ip_address_required_placeholder,
          tooltip: helptext.tls_opt_ip_address_required_tooltip
        }
      ]
    },
    { name: "divider_bw", divider: false },
    {
      name: helptext.fieldset_bw,
      label: false,
      class: "bw",
      config: [
        {
          type: "input",
          name: "localuserbw",
          placeholder: helptext.localuserbw_placeholder,
          tooltip: helptext.userbw_tooltip,
          required: true,
          validation: helptext.userbw_validation,
          blurStatus: true,
          blurEvent: this.blurEvent,
          parent: this,
        },
        {
          type: "input",
          name: "localuserdlbw",
          placeholder: helptext.localuserdlbw_placeholder,
          tooltip: helptext.userbw_tooltip,
          required: true,
          validation: helptext.userbw_validation,
          blurStatus: true,
          blurEvent: this.blurEvent2,
          parent: this,
        },
        {
          type: "input",
          name: "anonuserbw",
          placeholder: helptext.anonuserbw_placeholder,
          tooltip: helptext.userbw_tooltip,
          required: true,
          validation: helptext.userbw_validation,
          blurStatus: true,
          blurEvent: this.blurEvent3,
          parent: this,
        },
        {
          type: "input",
          name: "anonuserdlbw",
          placeholder: helptext.anonuserdlbw_placeholder,
          tooltip: helptext.userbw_tooltip,
          required: true,
          validation: helptext.userbw_validation,
          blurStatus: true,
          blurEvent: this.blurEvent4,
          parent: this,
        }
      ]
    },
    { name: "divider_other", divider: false },
    {
      name: helptext.fieldset_other,
      label: false,
      class: "other",
      config: [
        {
          type: "input",
          name: "passiveportsmin",
          placeholder: helptext.passiveportsmin_placeholder,
          tooltip: helptext.passiveportsmin_tooltip,
          required: true,
          validation: helptext.passiveportsmin_validation
        },
        {
          type: "input",
          name: "passiveportsmax",
          placeholder: helptext.passiveportsmax_placeholder,
          tooltip: helptext.passiveportsmax_tooltip,
          required: true,
          validation: helptext.passiveportsmax_validation
        },
        {
          type: "checkbox",
          name: "fxp",
          placeholder: helptext.fxp_placeholder,
          tooltip: helptext.fxp_tooltip
        },
        {
          type: "checkbox",
          name: "resume",
          placeholder: helptext.resume_placeholder,
          tooltip: helptext.resume_tooltip
        },
        {
          type: "checkbox",
          name: "reversedns",
          placeholder: helptext.reversedns_placeholder,
          tooltip: helptext.reversedns_tooltip
        },
        {
          type: "input",
          name: "masqaddress",
          placeholder: helptext.masqaddress_placeholder,
          tooltip: helptext.masqaddress_tooltip
        },
        {
          type: "textarea",
          name: "banner",
          placeholder: helptext.banner_placeholder,
          tooltip: helptext.banner_tooltip
        },
        {
          type: "textarea",
          name: "options",
          placeholder: helptext.options_placeholder,
          tooltip: helptext.options_tooltip
        }
      ]
    },
    { name: "divider", divider: true }
  ]);

  protected advanced_field = this.fieldSets.advancedFields;

  public custActions: Array<any> = [
    {
      id : 'basic_mode',
      name : global_helptext.basic_options,
      function : () => {
        this.isBasicMode = !this.isBasicMode;
        this.fieldSets.toggleSets().toggleDividers();
      }
    },
    {
      'id' : 'advanced_mode',
      name : global_helptext.advanced_options,
      function : () => {
        this.isBasicMode = !this.isBasicMode;
        this.fieldSets.toggleSets().toggleDividers();
      }
    }
  ];

  private ssltls_certificate: any;

  isCustActionVisible(actionId: string) {
    if (actionId == 'advanced_mode' && this.isBasicMode == false) {
      return false;
    } else if (actionId == 'basic_mode' && this.isBasicMode == true) {
      return false;
    }
    return true;
  }

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected dialog: DialogService, protected storageService: StorageService,
              protected systemGeneralService: SystemGeneralService) {}

  ngOnInit() {
    this.systemGeneralService.getCertificates().subscribe((res: any[]) => {
      if (res.length > 0) {
        this.fieldSets.config('ssltls_certificate').options =
          res.map(cert => ({ label: cert.name, value: cert.id }));
      }
    });
  }

  afterInit(entityEdit: any) {
    this.entityForm = entityEdit;
    entityEdit.submitFunction = this.submitFunction;
    this.rootlogin_fg = entityEdit.formGroup.controls['rootlogin'];
    this.rootloginSubscription = 
      this.rootlogin_fg.valueChanges.subscribe(res => {
      if (res && !this.warned && !this.rootlogin) {
        this.dialog.confirm(helptext.rootlogin_dialog_title, helptext.rootlogin_dialog_message, false, T('Continue'), false, '', null, {}, null, false, T('Cancel'), true).subscribe(confirm => {
          if (!confirm) {
            this.rootlogin_fg.setValue(false);
          } else {
            this.warned = true;
          }
        });
      }
      if (!res && !this.warned && this.rootlogin) {
        this.rootlogin = res;
      }
    });

    this.bwFields.forEach(field => 
      entityEdit.formGroup.controls[field].valueChanges.subscribe((value) => {
        const formField = _.find(this.fieldConfig, { name: field });
        const filteredValue = value ? this.storageService.convertHumanStringToNum(value, false, 'kmgtp') : undefined;
        formField['hasErrors'] = false;
        formField['errors'] = '';
        if (filteredValue !== undefined && isNaN(filteredValue)) {
          formField['hasErrors'] = true;
          formField['errors'] = helptext.bandwidth_err;
        };
      }));
    
    // 'Erase' humanReadable after load to keep from accidentaly resetting values 
    setTimeout(() => {
      this.storageService.humanReadable = '';
    }, 1000)
  }

  resourceTransformIncomingRestData(data) {
    this.bwFields.forEach(field =>
      data[field] = this.storageService.convertBytestoHumanReadable(data[field] * 1024, 0, 'KiB'));
    this.rootlogin = data['rootlogin'];
    const certificate = data['ssltls_certificate'];
    if (certificate && certificate.id) {
      data['ssltls_certificate'] = certificate.id;
    }

    let fileperm = parseInt(data['filemask'], 8);
    let filemask = (~fileperm & 0o666).toString(8);
    while (filemask.length < 3) {
      filemask = '0' + filemask;
    }
    data['filemask'] = filemask;

    let dirperm = parseInt(data['dirmask'], 8);
    let dirmask = (~dirperm & 0o777).toString(8);
    while (dirmask.length < 3) {
      dirmask = '0' +dirmask;
    }
    data['dirmask'] = dirmask;

    return data;
  }

  beforeSubmit(data) {
    this.bwFields.forEach(field => 
      data[field] = this.storageService.convertHumanStringToNum(data[field])/1024);

    let fileperm = parseInt(data['filemask'], 8);
    let filemask = (~fileperm & 0o666).toString(8);
    while (filemask.length < 3) {
      filemask = '0' + filemask;
    }
    data['filemask'] = filemask;

    let dirperm = parseInt(data['dirmask'], 8);
    let dirmask = (~dirperm & 0o777).toString(8);
    while (dirmask.length < 3) {
      dirmask = '0' +dirmask;
    }
    data['dirmask'] = dirmask;
  }

  submitFunction(this: any, body: any){
    return this.ws.call('ftp.update', [body]);
  }

  ngOnDestroy() {
    this.rootloginSubscription.unsubscribe();
  }

  blurEvent(parent) {
    if (parent.entityForm && parent.storageService.humanReadable) {
      parent.transformValue(parent, 'localuserbw');
    }
  }

  blurEvent2(parent) {
    if (parent.entityForm && parent.storageService.humanReadable) {
      parent.transformValue(parent, 'localuserdlbw');
    }
  }

  blurEvent3(parent) {
    if (parent.entityForm && parent.storageService.humanReadable) {
      parent.transformValue(parent, 'anonuserbw');
    }
  }

  blurEvent4(parent) {
    if (parent.entityForm && parent.storageService.humanReadable) {
      parent.transformValue(parent, 'anonuserdlbw');
    }
  }

  transformValue(parent, fieldname: string) {
    parent.entityForm.formGroup.controls[fieldname].setValue(parent.storageService.humanReadable || 0);
    // Clear humanReadable value to keep from accidentally setting it elsewhere
    parent.storageService.humanReadable = '';
  }
}
