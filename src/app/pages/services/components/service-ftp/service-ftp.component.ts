import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';

import { RestService, SystemGeneralService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import helptext from '../../../../helptext/services/components/service-ftp';


@Component({
  selector : 'ftp-edit',
  template : `<entity-form [conf]="this"></entity-form>`,
  providers : [ SystemGeneralService ]
})

export class ServiceFTPComponent implements OnInit {
  //protected resource_name: string = 'services/ftp';
  protected editCall: string = 'ftp.update';
  protected queryCall: string = 'ftp.config';
  protected route_success: string[] = [ 'services' ];

  protected isBasicMode: boolean = true;

  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'port',
      placeholder : helptext.port_placeholder,
      tooltip: helptext.port_tooltip,
      required: true,
      validation: helptext.port_validation
    },
    {
      type : 'input',
      name : 'clients',
      placeholder : helptext.clients_placeholder,
      tooltip: helptext.clients_tooltip,
      required: true,
      validation : helptext.clients_validation
    },
    {
      type : 'input',
      name : 'ipconnections',
      placeholder : helptext.ipconnections_placeholder,
      tooltip: helptext.ipconnections_tooltip,
      required: true,
      validation : helptext.ipconnections_validation
    },
    {
      type : 'input',
      name : 'loginattempt',
      placeholder : helptext.loginattempt_placeholder,
      tooltip: helptext.loginattempt_tooltip,
      required: true,
      validation : helptext.loginattempt_validation
    },
    {
      type : 'input',
      name : 'timeout',
      placeholder : helptext.timeout_placeholder,
      tooltip: helptext.timeout_tooltip,
      required: true,
      validation : helptext.timeout_validation
    },
    {
      type : 'checkbox',
      name : 'rootlogin',
      placeholder : helptext.rootlogin_placeholder,
      tooltip: helptext.rootlogin_tooltip
    },
    {
      type : 'checkbox',
      name : 'onlyanonymous',
      placeholder : helptext.onlyanonymous_placeholder,
      tooltip: helptext.onlyanonymous_tooltip,
    },
    {
      type : 'explorer',
      initial: '/mnt',
      explorerType: 'directory',
      name : 'anonpath',
      placeholder : helptext.anonpath_placeholder,
      tooltip: helptext.anonpath_tooltip,
    },
    {
      type : 'checkbox',
      name : 'onlylocal',
      placeholder : helptext.onlylocal_placeholder,
      tooltip: helptext.onlylocal_tooltip,
    },
    {
      type : 'textarea',
      name : 'banner',
      placeholder : helptext.banner_placeholder,
      tooltip: helptext.banner_tooltip,
    },
    {
      type : 'checkbox',
      name : 'resume',
      placeholder : helptext.resume_placeholder,
      tooltip: helptext.resume_tooltip,
    },
    {
      type : 'checkbox',
      name : 'defaultroot',
      placeholder : helptext.defaultroot_placeholder,
      tooltip: helptext.defaultroot_tooltip,
    },
    {
      type : 'checkbox',
      name : 'reversedns',
      placeholder : helptext.reversedns_placeholder,
      tooltip: helptext.reversedns_tooltip,
    },
    {
      type : 'input',
      name : 'masqaddress',
      placeholder : helptext.masqaddress_placeholder,
      tooltip: helptext.masqaddress_tooltip,
    },
    {
      type : 'select',
      name : 'ssltls_certificate',
      placeholder : helptext.ssltls_certificate_placeholder,
      tooltip: helptext.ssltls_certificate_tooltip,
      options : [{label:'-', value:null}],
    },
    {
      type : 'permissions',
      name : 'filemask',
      placeholder : helptext.filemask_placeholder,
      tooltip: helptext.filemask_tooltip,
      noexec: true
    },
    {
      type : 'permissions',
      name : 'dirmask',
      placeholder : helptext.dirmask_placeholder,
      tooltip: helptext.dirmask_tooltip,
    },
    {
      type : 'checkbox',
      name : 'fxp',
      placeholder : helptext.fxp_placeholder,
      tooltip: helptext.fxp_tooltip,
    },
    {
      type : 'checkbox',
      name : 'ident',
      placeholder : helptext.ident_placeholder,
      tooltip: helptext.ident_tooltip,
    },
    {
      type : 'input',
      name : 'passiveportsmin',
      placeholder : helptext.passiveportsmin_placeholder,
      tooltip: helptext.passiveportsmin_tooltip,
      required: true,
      validation: helptext.passiveportsmin_validation
    },
    {
      type : 'input',
      name : 'passiveportsmax',
      placeholder : helptext.passiveportsmax_placeholder,
      tooltip: helptext.passiveportsmax_tooltip,
      required: true,
      validation: helptext.passiveportsmax_validation
    },
    {
      type : 'input',
      name : 'localuserbw',
      placeholder : helptext.localuserbw_placeholder,
      tooltip: helptext.localuserbw_tooltip,
      required: true,
      validation: helptext.localuserbw_validation
    },
    {
      type : 'input',
      name : 'localuserdlbw',
      placeholder : helptext.localuserdlbw_placeholder,
      tooltip: helptext.localuserdlbw_tooltip,
      required: true,
      validation: helptext.localuserdlbw_validation
    },
    {
      type : 'input',
      name : 'anonuserbw',
      placeholder : helptext.anonuserbw_placeholder,
      tooltip: helptext.anonuserbw_tooltip,
      required: true,
      validation: helptext.anonuserbw_validation
    },
    {
      type : 'input',
      name : 'anonuserdlbw',
      placeholder : helptext.anonuserdlbw_placeholder,
      tooltip: helptext.anonuserdlbw_tooltip,
      required: true,
      validation: helptext.anonuserdlbw_validation
    },
    {
      type : 'checkbox',
      name : 'tls',
      placeholder : helptext.tls_placeholder,
      tooltip: helptext.tls_tooltip,
    },
    {
      type : 'select',
      name : 'tls_policy',
      placeholder : helptext.tls_policy_placeholder,
      tooltip: helptext.tls_policy_tooltip,
      options : helptext.tls_policy_options,
    },
    {
      type : 'checkbox',
      name : 'tls_opt_allow_client_renegotiations',
      placeholder : helptext.tls_opt_allow_client_renegotiations_placeholder,
      tooltip: helptext.tls_opt_allow_client_renegotiations_tooltip,
    },
    {
      type : 'checkbox',
      name : 'tls_opt_allow_dot_login',
      placeholder : helptext.tls_opt_allow_dot_login_placeholder,
      tooltip: helptext.tls_opt_allow_dot_login_tooltip,
    },
    {
      type : 'checkbox',
      name : 'tls_opt_allow_per_user',
      placeholder : helptext.tls_opt_allow_per_user_placeholder,
      tooltip: helptext.tls_opt_allow_per_user_tooltip,
    },
    {
      type : 'checkbox',
      name : 'tls_opt_common_name_required',
      placeholder : helptext.tls_opt_common_name_required_placeholder,
      tooltip: helptext.tls_opt_common_name_required_tooltip,
    },
    {
      type : 'checkbox',
      name : 'tls_opt_enable_diags',
      placeholder : helptext.tls_opt_enable_diags_placeholder,
      tooltip: helptext.tls_opt_enable_diags_tooltip,
    },
    {
      type : 'checkbox',
      name : 'tls_opt_export_cert_data',
      placeholder : helptext.tls_opt_export_cert_data_placeholder,
      tooltip: helptext.tls_opt_export_cert_data_tooltip,
    },
    {
      type : 'checkbox',
      name : 'tls_opt_no_cert_request',
      placeholder : helptext.tls_opt_no_cert_request_placeholder,
      tooltip : helptext.tls_opt_no_cert_request_tooltip,
    },
    {
      type : 'checkbox',
      name : 'tls_opt_no_empty_fragments',
      placeholder : helptext.tls_opt_no_empty_fragments_placeholder,
      tooltip: helptext.tls_opt_no_empty_fragments_tooltip,
    },
    {
      type : 'checkbox',
      name : 'tls_opt_no_session_reuse_required',
      placeholder : helptext.tls_opt_no_session_reuse_required_placeholder,
      tooltip: helptext.tls_opt_no_session_reuse_required_tooltip
    },
    {
      type : 'checkbox',
      name : 'tls_opt_stdenvvars',
      placeholder : helptext.tls_opt_stdenvvars_placeholder,
      tooltip: helptext.tls_opt_stdenvvars_tooltip
    },
    {
      type : 'checkbox',
      name : 'tls_opt_dns_name_required',
      placeholder : helptext.tls_opt_dns_name_required_placeholder,
      tooltip: helptext.tls_opt_dns_name_required_tooltip,
    },
    {
      type : 'checkbox',
      name : 'tls_opt_ip_address_required',
      placeholder : helptext.tls_opt_ip_address_required_placeholder,
      tooltip: helptext.tls_opt_ip_address_required_tooltip,
    },
    {
      type : 'textarea',
      name : 'options',
      placeholder : helptext.options_placeholder,
      tooltip: helptext.options_tooltip,
    },
  ];

  protected advanced_field: Array<any> = [
    'filemask',
    'dirmask',
    'fxp',
    'ident',
    'passiveportsmin',
    'passiveportsmax',
    'localuserbw',
    'localuserdlbw',
    'anonuserbw',
    'anonuserdlbw',
    'tls',
    'tls_policy',
    'tls_opt_allow_client_renegotiations',
    'tls_opt_allow_dot_login',
    'tls_opt_allow_per_user',
    'tls_opt_common_name_required',
    'tls_opt_enable_diags',
    'tls_opt_export_cert_data',
    'tls_opt_no_empty_fragments',
    'tls_opt_no_session_reuse_required',
    'tls_opt_stdenvvars',
    'tls_opt_dns_name_required',
    'tls_opt_ip_address_required',
    'options'
  ];

  public custActions: Array<any> = [
    {
      id : 'basic_mode',
      name : 'Basic Mode',
      function : () => { this.isBasicMode = !this.isBasicMode; }
    },
    {
      'id' : 'advanced_mode',
      name : 'Advanced Mode',
      function : () => { this.isBasicMode = !this.isBasicMode; }
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

              protected systemGeneralService: SystemGeneralService) {}

  ngOnInit() {
    this.systemGeneralService.getCertificates().subscribe((res) => {
      if (res.length > 0) {
        this.ssltls_certificate =
            _.find(this.fieldConfig, {'name' : 'ssltls_certificate'});
        res.forEach((item) => {
          this.ssltls_certificate.options.push(
              {label : item.name, value : item.id});
        });
      }
    });
  }

  afterInit(entityEdit: any) {
    entityEdit.submitFunction = this.submitFunction;
  }

  resourceTransformIncomingRestData(data) {
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
}
