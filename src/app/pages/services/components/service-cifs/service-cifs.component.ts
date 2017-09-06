import {ApplicationRef, Component, Injector, OnInit} from '@angular/core';
import {FormArray, FormGroup} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';

import {
  IdmapService,
  IscsiService,
  RestService,
  WebSocketService
} from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'cifs-edit',
  template : ` <entity-form [conf]="this"></entity-form>`,
  providers : [ IscsiService, IdmapService ],
})

export class ServiceCIFSComponent {
  protected resource_name: string = 'services/cifs';
  protected route_success: string[] = [ 'services' ];
  protected arrayControl: FormArray;
  protected arrayModel: any;
  private ip: any;
  protected ipChoice: any;

  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'cifs_srv_netbiosname',
      placeholder : 'NetBIOS Name:',
    },
    {
      type : 'input', 
      name : 'cifs_srv_netbiosalias',
      placeholder : 'NetBIOS Alias:'
    },
    {
      type : 'input', 
      name : 'cifs_srv_workgroup',
      placeholder : 'Workgroup'
    },
    {
      type : 'input', 
      name : 'cifs_srv_description',
      placeholder : 'Description'
    },
    {
      type : 'select',
      name : 'cifs_srv_doscharset',
      placeholder : 'DOS Charset',
      options: [
        {label : 'CP437', value : 'CP437'},
        {label : 'CP850', value : 'CP850'},
        {label : 'CP852', value : 'CP852'},
        {label : 'CP866', value : 'CP866'},
        {label : 'CP932', value : 'CP932'},
        {label : 'CP949', value : 'CP949'},
        {label : 'CP950', value : 'CP950'},
        {label : 'CP1026', value : 'CP1026'},
        {label : 'CP1251', value : 'CP1251'},
        {label : 'ASCII', value : 'ASCII'},
      ]
    },
    {
      type : 'select',
      name : 'cifs_srv_unixcharset',
      placeholder : 'UNIX Charset',
      options: [
        {label : 'UTF-8', value : 'CP437'},
        {label : 'iso-8859-1', value : 'iso-8859-1'},
        {label : 'iso-8859-15', value : 'iso-8859-15'},
        {label : 'gb2312', value : 'gb2312'},
        {label : 'EUC-JP', value : 'EUC-JP'},
        {label : 'ISCII', value : 'ISCII'},
      ]
    },
    {
      type : 'select',
      name : 'cifs_srv_loglevel',
      placeholder : 'Log Level',
      options : [
        {label : 'None', value : 0},
        {label : 'Minimum', value : 1},
        {label : 'Normal', value : 2},
        {label : 'Full', value : 3},
        {label : 'Debug', value : 10},
      ],
    },
    {
      type : 'input', 
      name : 'cifs_srv_syslog',
      placeholder : 'Use syslog only'
    },
    {
      type : 'input', 
      name : 'cifs_srv_localmaster',
      placeholder : 'Local Master'
    },
    {
      type : 'input', 
      name : 'cifs_srv_domain_logons',
      placeholder : 'Domain Logons'
    },
    {
      type : 'input', 
      name : 'cifs_srv_timeserver',
      placeholder : 'Time Server For Domain'
    },
    {
      type : 'input', 
      name : 'cifs_srv_guest',
      placeholder : 'Guest Account'
    },
    {
      type : 'input', 
      name : 'cifs_srv_filemask',
      placeholder : 'File Mask'
    },
    {
      type : 'input', 
      name : 'cifs_srv_dirmask',
      placeholder : 'Directory Mask'
    },
    {
      type : 'checkboc', 
      name : 'cifs_srv_nullpw',
      placeholder : 'Allow Empty Password'
    },
    {
      type : 'text', 
      name : 'cifs_srv_smb_options',
      placeholder : 'Auxiliary Parameters'
    },
    {
      type : 'checkbox',
      name : 'cifs_srv_unixext',
      placeholder : 'Unix Extensions',
    },
    { type: 'checkbox',
      name : 'cifs_srv_zeroconf',
      placeholder : 'Zeroconf share discovery',
    },
  { type: 'checkbox',
    name : 'cifs_srv_hostlookup',
    placeholder : 'Hostnames Lookups',
  },
  {
    type : 'select',
    name : 'Server Minimum Protocol',
    placeholder : 'cifs_srv_min_protocol',
    options : []
  },
  {
    type : 'select',
    name : 'Server Maximum Protocol',
    placeholder : 'cifs_srv_max_protocol',
    options : []
  },
  { 
    type: 'checkbox',
    name : 'cifs_srv_allow_execute_always',
    placeholder : 'Allow Execute Always',
},
{ 
  type: 'checkbox',
  name : 'cifs_srv_obey_pam_restrictions',
  placeholder : 'Obey Pam Restrictions',
},
{ 
  type: 'checkbox',
  name : 'cifs_srv_ntlmv1_auth',
  placeholder : 'NTLMv1 Auth',
},
{
  type : 'input',
  name : 'bindips',
  placeholder : 'Bind IP Addresses',
  options : []
},

  ];


  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected iscsiService: IscsiService,
              protected idmapService: IdmapService) {}

  afterInit(entityEdit: any) {

    entityEdit.ws.call('notifier.choices', [ 'IPChoices', [ true, false ] ])
    .subscribe((res) => {
      this.ipChoice =
          _.find(this.fieldConfig, {'name' : 'stg_guiaddress'});
      this.ipChoice.options.push(
          {label : '0.0.0.0', value : '0.0.0.0'});
      res.forEach((item) => {
        this.ipChoice.options.push(
            {label : item[1], value : item[0]});
      });
    });
    this.idmapService.getADIdmap().subscribe((res) => { console.log(res); })
  }

  ngOnInit() {}
}
