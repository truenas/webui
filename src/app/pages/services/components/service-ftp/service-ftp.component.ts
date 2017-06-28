import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';

import { EntityConfigComponent } from '../../../common/entity/entity-config/';
import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService, SystemGeneralService} from '../../../../services/';
import { FormGroup, FormArray, Validators, AbstractControl} from '@angular/forms';

import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { matchOtherValidator } from '../../../common/entity/entity-form/validators/password-validation';

@Component ({
    selector: 'ftp-edit',
    template: `<entity-form [conf]="this"></entity-form>`,
    providers: [ SystemGeneralService ]
})


export class ServiceFTPComponent implements OnInit {
  protected resource_name: string = 'services/ftp';
  protected route_success: string[] = ['services'];

  private entityEdit: EntityConfigComponent;

  protected isBasicMode: boolean = true;

  public fieldConfig: FieldConfig[] = [
    {
        type: 'input',
        name: 'ftp_port',
        placeholder: 'Port',
    },
    {
        type: 'input',
        name: 'ftp_clients',
        placeholder: 'Clients',
    },
    {
        type: 'input',
        name: 'ftp_ipconnections',
        placeholder: 'Connections',
    },
    {
        type: 'input',
        name: 'ftp_loginattempt',
        placeholder: 'Login Attempts',
    },
    {
        type: 'input',
        name: 'ftp_timeout',
        placeholder: 'Timeout',
    },
    {
        type: 'checkbox',
        name: 'ftp_rootlogin',
        placeholder: 'Allow Root Login',
    },
    {
        type: 'checkbox',
        name: 'ftp_onlyanonymous',
        placeholder: 'Allow Anonymous Login',
    },
    {
        type: 'input',
        name: 'ftp_anonpath',
        placeholder: 'Path',
    },
    {
        type: 'checkbox',
        name: 'ftp_onlylocal',
        placeholder: 'Allow Local User Login',
    },
    {
        type: 'textarea',
        name: 'ftp_banner',
        placeholder: 'Display Login',
    },
    {
        type: 'checkbox',
        name: 'ftp_resume',
        placeholder: 'Allow Transfer Resumption',
    },
    {
        type: 'checkbox',
        name: 'ftp_defaultroot',
        placeholder: 'Always Chroot',
    },
    {
        type: 'checkbox',
        name: 'ftp_reversedns',
        placeholder: 'Perform Reverse DNS Lookups',
    },
    {
        type: 'input',
        name: 'ftp_masqaddress',
        placeholder: 'Masquerade Address',
    },
    {
        type: 'select',
        name: 'ftp_ssltls_certfile',
        placeholder: 'Certificate',
        options: [
        ],
    },
    {
        type: 'input',
        name: 'ftp_filemask',
        placeholder: 'File Permission',
    },
    {
        type: 'input',
        name: 'ftp_dirmask',
        placeholder: 'Directory Permission',
    },
    {
        type: 'checkbox',
        name: 'ftp_fxp',
        placeholder: 'Enable FXP',
    },
    {
        type: 'checkbox',
        name: 'ftp_ident',
        placeholder: 'Require IDENT Authentication',
    },
    {
        type: 'input',
        name: 'ftp_passiveportsmin',
        placeholder: 'Minimum Passive Port',
    },
    {
        type: 'input',
        name: 'ftp_passiveportsmax',
        placeholder: 'Maximum Passive Port',
    },
    {
        type: 'input',
        name: 'ftp_localuserbw',
        placeholder: 'Local User Upload Bandwidth',
    },
    {
        type: 'input',
        name: 'ftp_localuserdlbw',
        placeholder: 'Local User Download Bandwidth',
    },
    {
        type: 'input',
        name: 'ftp_anonuserbw',
        placeholder: 'Anonymous User Upload Bandwidth',
    },
    {
        type: 'input',
        name: 'ftp_anonuserdlbw',
        placeholder: 'Anonymous User Download Bandwidth',
    },
    {
        type: 'checkbox',
        name: 'ftp_tls',
        placeholder: 'Enable TLS',
    },
    {
        type: 'select',
        name: 'ftp_tls_policy',
        placeholder: 'TLS Policy',
        options: [
          { label: 'On', value: 'on' },
          { label: 'Off', value: 'off' },
          { label: 'Data', value: 'data' },
          { label: '!Data', value: '!data' },
          { label: 'Auth', value: 'auth' },
          { label: 'Ctrl', value: 'ctrl' },
          { label: 'Ctrl + Data', value: 'ctrl+data' },
          { label: 'Ctrl + !Data', value: 'ctrl+!data' },
          { label: 'Auth + Data', value: 'auth+data' },
          { label: 'Auth + !Data', value: 'auth+!data' },
        ],
    },
    {
        type: 'checkbox',
        name: 'ftp_tls_opt_allow_client_renegotiations',
        placeholder: 'TLS Allow Client Renegotiations',
    },
    {
        type: 'checkbox',
        name: 'ftp_tls_opt_allow_dot_login',
        placeholder: 'TLS Allow Dot Login',
    },
    {
        type: 'checkbox',
        name: 'ftp_tls_opt_allow_per_user',
        placeholder: 'TLS Allow Per User',
    },
    {
        type: 'checkbox',
        name: 'ftp_tls_opt_common_name_required',
        placeholder: 'TLS Common Name Required',
    },
    {
        type: 'checkbox',
        name: 'ftp_tls_opt_enable_diags',
        placeholder: 'TLS Enable Diagnostics',
    },
    {
        type: 'checkbox',
        name: 'ftp_tls_opt_export_cert_data',
        placeholder: 'TLS Export Certificate Request',
    },
    {
        type: 'checkbox',
        name: 'ftp_tls_opt_no_empty_fragments',
        placeholder: 'TLS No Empty Fragments',
    },
    {
        type: 'checkbox',
        name: 'ftp_tls_opt_no_session_reuse_required',
        placeholder: 'TLS No Session Reuse Required',
    },
    {
        type: 'checkbox',
        name: 'ftp_tls_opt_stdenvvars',
        placeholder: 'TLS Export Standard Vars',
    },
    {
        type: 'checkbox',
        name: 'ftp_tls_opt_dns_name_required',
        placeholder: 'TLS DNS Name Required',
    },
    {
        type: 'checkbox',
        name: 'ftp_tls_opt_ip_address_required',
        placeholder: 'TLS IP Address Required',
    },
    {
        type: 'textarea',
        name: 'ftp_options',
        placeholder: 'Auxiliary Parameters',
    },
  ];


  protected advanced_field: Array<any> = [
    'ftp_filemask',
    'ftp_dirmask',
    'ftp_fxp',
    'ftp_ident',
    'ftp_passiveportsmin',
    'ftp_passiveportsmax',
    'ftp_localuserbw',
    'ftp_localuserdlbw',
    'ftp_anonuserbw',
    'ftp_anonuserdlbw',
    'ftp_tls',
    'ftp_tls_policy',
    'ftp_tls_opt_allow_client_renegotiations',
    'ftp_tls_opt_allow_dot_login',
    'ftp_tls_opt_allow_per_user',
    'ftp_tls_opt_common_name_required',
    'ftp_tls_opt_enable_diags',
    'ftp_tls_opt_export_cert_data',
    'ftp_tls_opt_no_empty_fragments',
    'ftp_tls_opt_no_session_reuse_required',
    'ftp_tls_opt_stdenvvars',
    'ftp_tls_opt_dns_name_required',
    'ftp_tls_opt_ip_address_required',
    'ftp_options'
  ];
  isCustActionVisible(actionId: string) {
    if (actionId == 'advanced_mode' && this.isBasicMode == false) {
      return false;
    } else if (actionId == 'basic_mode' && this.isBasicMode == true) {
      return false;
    } 
    return true;
  }

  public custActions: Array<any> = [
    {
      id: 'basic_mode',
      name: 'Basic Mode',
      function: () => {
        this.isBasicMode = !this.isBasicMode;
      }
    },
    {
      'id': 'advanced_mode',
      name: 'Advanced Mode',
      function: () => {
        this.isBasicMode = !this.isBasicMode;
      }
    }
  ];

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected rest: RestService,
    protected ws: WebSocketService,
    protected _injector: Injector,
    protected _appRef: ApplicationRef,
    protected _state: GlobalState,
    protected systemGeneralService: SystemGeneralService) {
  }

  private ftp_ssltls_certfile: any;

  ngOnInit() {
    this.systemGeneralService.getCertificates().subscribe((res) => {
      this.ftp_ssltls_certfile = _.find(this.fieldConfig, {'name': 'ftp_ssltls_certfile'});
      res.data.forEach((item) => {
        this.ftp_ssltls_certfile.options.push({ label: item.cert_common, value: item.id});
      });
    });
  }

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
  }

}



