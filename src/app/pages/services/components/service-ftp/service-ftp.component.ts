import {  ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel,    DynamicSelectModel,DynamicTextAreaModel, } from '@ng2-dynamic-forms/core';


import { EntityConfigComponent } from '../../../common/entity/entity-config/';
import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService, SystemGeneralService } from '../../../../services/';
import * as _ from 'lodash';

import { Subscription } from 'rxjs';

@Component ({
    selector: 'ftp-edit',
    template: ` <entity-config [conf]="this"></entity-config>`,
    providers: [SystemGeneralService]
})

export class ServiceFTPComponent {
  protected resource_name: string = 'services/ftp';
  private entityEdit: EntityConfigComponent;
  protected route_success: string[] = ['services'];

  protected isBasicMode: boolean = true;

  protected formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
      id: 'ftp_port',
      label: 'Port',
    }),
    new DynamicInputModel({
      id: 'ftp_clients',
      label: 'Clients',
    }),
    new DynamicInputModel({
      id: 'ftp_ipconnections',
      label: 'Connections',
    }),
    new DynamicInputModel({
      id: 'ftp_loginattempt',
      label: 'Login Attempts',
    }),
    new DynamicInputModel({
      id: 'ftp_timeout',
      label: 'Timeout',
    }),
    new DynamicCheckboxModel({
      id: 'ftp_rootlogin',
      label: 'Allow Root Login',
    }),
    new DynamicCheckboxModel({
      id: 'ftp_onlyanonymous',
      label: 'Allow Anonymous Login',
    }),
    new DynamicInputModel({
        id: 'ftp_anonpath',
        label: 'Path',
    }),
    new DynamicCheckboxModel({
      id: 'ftp_onlylocal',
      label: 'Allow Local User Login',
    }),
    new DynamicTextAreaModel({
      id: 'ftp_banner',
      label: 'Display Login',
    }),
    new DynamicCheckboxModel({
      id: 'ftp_resume',
      label: 'Allow Transfer Resumption',
    }),
    new DynamicCheckboxModel({
      id: 'ftp_defaultroot',
      label: 'Always Chroot',
    }),
    new DynamicCheckboxModel({
      id: 'ftp_reversedns',
      label: 'Perform Reverse DNS Lookups',
    }),
    new DynamicInputModel({
      id: 'ftp_masqaddress',
      label: 'Masquerade Address',
    }),
    new DynamicSelectModel({
        id: 'ftp_ssltls_certfile',
        label: 'Certificate',
    }),
    new DynamicInputModel({
        id: 'ftp_filemask',
        label: 'File Permission',
    }),
    new DynamicInputModel({
        id: 'ftp_dirmask',
        label: 'Directory Permission',
    }),
    new DynamicCheckboxModel({
      id: 'ftp_fxp',
      label: 'Enable FXP',
    }),
    new DynamicCheckboxModel({
      id: 'ftp_ident',
      label: 'Require IDENT Authentication',
    }),
    new DynamicInputModel({
      id: 'ftp_passiveportsmin',
      label: 'Minimum Passive Port',
    }),
    new DynamicInputModel({
      id: 'ftp_passiveportsmax',
      label: 'Maximum Passive Port',
    }),
    new DynamicInputModel({
      id: 'ftp_localuserbw',
      label: 'Local User Upload Bandwidth',
    }),
    new DynamicInputModel({
      id: 'ftp_localuserdlbw',
      label: 'Local User Download Bandwidth',
    }),
    new DynamicInputModel({
      id: 'ftp_anonuserbw',
      label: 'Anonymous User Upload Bandwidth',
    }),
    new DynamicInputModel({
      id: 'ftp_anonuserdlbw',
      label: 'Anonymous User Download Bandwidth',
    }),
    new DynamicCheckboxModel({
      id: 'ftp_tls',
      label: 'Enable TLS',
    }),
    new DynamicSelectModel({
        id: 'ftp_tls_policy',
        label: 'TLS Policy',
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
    }),
    new DynamicCheckboxModel({
      id: 'ftp_tls_opt_allow_client_renegotiations',
      label: 'TLS Allow Client Renegotiations',
    }),
    new DynamicCheckboxModel({
      id: 'ftp_tls_opt_allow_dot_login',
      label: 'TLS Allow Dot Login',
    }),
    new DynamicCheckboxModel({
      id: 'ftp_tls_opt_allow_per_user',
      label: 'TLS Allow Per User',
    }),
    new DynamicCheckboxModel({
      id: 'ftp_tls_opt_common_name_required',
      label: 'TLS Common Name Required',
    }),
    new DynamicCheckboxModel({
      id: 'ftp_tls_opt_enable_diags',
      label: 'TLS Enable Diagnostics',
    }),
    new DynamicCheckboxModel({
      id: 'ftp_tls_opt_export_cert_data',
      label: 'TLS Export Certificate Request',
    }),
    new DynamicCheckboxModel({
      id: 'ftp_tls_opt_no_empty_fragments',
      label: 'TLS No Empty Fragments',
    }),
    new DynamicCheckboxModel({
      id: 'ftp_tls_opt_no_session_reuse_required',
      label: 'TLS No Session Reuse Required',
    }),
    new DynamicCheckboxModel({
      id: 'ftp_tls_opt_stdenvvars',
      label: 'TLS Export Standard Vars',
    }),
    new DynamicCheckboxModel({
      id: 'ftp_tls_opt_dns_name_required',
      label: 'TLS DNS Name Required',
    }),
    new DynamicCheckboxModel({
      id: 'ftp_tls_opt_ip_address_required',
      label: 'TLS IP Address Required',
    }),
    new DynamicTextAreaModel({
      id: 'ftp_options',
      label: 'Auxiliary Parameters',
    }),
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

  protected custActions: Array<any> = [
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
  
  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService,  protected ws: WebSocketService, protected formService: DynamicFormService,  protected _injector: Injector, protected _appRef: ApplicationRef,   protected _state: GlobalState, protected systemGeneralService: SystemGeneralService) {

  }

  private cert_signedby: DynamicSelectModel<string>;

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
    this.systemGeneralService.getCA().subscribe((res) => {
      this.cert_signedby = <DynamicSelectModel<string>>this.formService.findById('ftp_ssltls_certfile', this.formModel);
      res.forEach((item) => {
        this.cert_signedby.add({ label: item.cert_name, value: item.id });
      });
    });
  }

}



