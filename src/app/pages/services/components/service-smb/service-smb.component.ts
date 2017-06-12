import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService, IscsiService, IdmapService } from '../../../../services/';
import { FormControl, NG_VALIDATORS } from '@angular/forms';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { EntityConfigComponent } from '../../../common/entity/entity-config/';

import * as _ from 'lodash';

import { Subscription } from 'rxjs';

@Component ({
    selector: 'smb-edit',
    template: ` <entity-form [conf]="this"></entity-form>`,
    providers: [IscsiService, IdmapService],
})

export class ServiceSMBComponent implements OnInit {

  protected resource_name: string = 'services/cifs';
  protected route_success: string[] = ['services','cifs'];
  private entityEdit: EntityConfigComponent;
  protected fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'cifs_srv_netbiosname',
      placeholder: 'NetBIOS Name',
    },
    {
      type: 'input',
      name: 'cifs_srv_netbiosalias',
      placeholder: 'NetBIOS Alias',
    },
    {
      type: 'input',
      name: 'cifs_srv_workgroup',
      placeholder: 'Workgroup',
    },
    {
      type: 'input',
      name: 'cifs_srv_description',
      placeholder: 'Description',
    },
    {
      type: 'select',
      name: 'cifs_srv_doscharset',
      label: 'DOS Charset',
      options: [
        { label: 'CP437', value: 'CP437'},
        { label: 'CP850', value: 'CP850'},
        { label: 'CP852', value: 'CP852'},
        { label: 'CP866', value: 'CP866'},
        { label: 'CP932', value: 'CP932'},
        { label: 'CP949', value: 'CP949'},
        { label: 'CP950', value: 'CP950'},
        { label: 'CP1026', value: 'CP1026'},
        { label: 'CP1251', value: 'CP1251'},
        { label: 'ASCII', value: 'ASCII'},
      ],
    },
    {
      type: 'select',
      name: 'cifs_srv_unixcharset',
      label: 'UNIX Charset',
      options: [
        { label: 'UTF-8', value: 'CP437'},
        { label: 'iso-8859-1', value: 'iso-8859-1'},
        { label: 'iso-8859-15', value: 'iso-8859-15'},
        { label: 'gb2312', value: 'gb2312'},
        { label: 'EUC-JP', value: 'EUC-JP'},
        { label: 'ISCII', value: 'ISCII'},
      ],
    },
    {
      type: 'select',
      name: 'cifs_srv_loglevel',
      label: 'Log Level',
      options: [
        { label: 'None', value: 0},
        { label: 'Minimum', value: 1},
        { label: 'Normal', value: 2},
        { label: 'Full', value: 3},
        { label: 'Debug', value: 10},
      ],
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_syslog',
      label: 'Use syslog only'
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_localmaster',
      label: 'Local Master'
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_domain_logons',
      label: 'Domain Logons'
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_timeserver',
      label: 'Time Server For Domain',
    },
    {
      type: 'select',
      name: 'cifs_srv_guest',
      label: 'Guest Account'
    },
    {
      type: 'input',
      name: 'cifs_srv_filemask',
      placeholder: 'File Mask'
    },
    {
      type: 'input',
      name: 'cifs_srv_dirmask',
      placeholder: 'Directory Mask'
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_nullpw',
      label: 'Allow Empty Password'
    },
    {
      type: 'textarea',
      name: 'cifs_srv_smb_options',
      placeholder: 'Auxiliary Parameters'
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_unixext',
      label: 'UNIX Extensions'
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_zeroconf',
      label: 'Zeroconf share discovery'
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_hostlookup',
      label: 'Hostnames Lookups' 
    },
    {
      type: 'select',
      name: 'cifs_srv_min_protocol',
      label: 'Server Minimum Protocol'
    },
    {
      type: 'select',
      name: 'cifs_srv_max_protocol',
      label: 'Server Maximum Protocol'
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_allow_execute_always',
      label: 'Allow Execute Always' 
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_obey_pam_restrictions',
      label: 'Obey Pam Restrictions' 
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_ntlmv1_auth',
      label: 'NTLMv1 Auth' 
    },
    {
      type: 'select',
      name: 'cifs_srv_bindip',
      label: 'Bind IP Addresses',
      options: [
      ],
      placeholder: 'Select IP Address',
      multiple: true,
    },
  ];

  private cifs_srv_bindip: any;
  ngOnInit() {
    this.iscsiService.getIpChoices().subscribe((res) => {
      this.cifs_srv_bindip = _.find(this.fieldConfig, {'name': 'cifs_srv_bindip'});
      res.forEach((item) => {
        console.log(item);
        this.cifs_srv_bindip.options.push({ label: item[0], value: item[0]});
      })
    };
    this.idmapService.getADIdmap().subscribe((res) => {
    });
  }

  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService,  protected ws: WebSocketService,  protected _injector: Injector, protected _appRef: ApplicationRef,   protected _state: GlobalState, protected iscsiService: IscsiService, protected idmapService: IdmapService) {
  }

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
  }

}