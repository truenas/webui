import { ApplicationRef, Component, Injector } from '@angular/core';
import { FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';

import { IdmapService, IscsiService, RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import helptext from '../../../../helptext/services/components/service-cifs';

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
      placeholder : helptext.cifs_srv_netbiosname_placeholder,
    },
    {
      type : 'input', 
      name : 'cifs_srv_netbiosalias',
      placeholder : helptext.cifs_srv_netbiosalias_placeholder
    },
    {
      type : 'input', 
      name : 'cifs_srv_workgroup',
      placeholder : helptext.cifs_srv_workgroup_placeholder
    },
    {
      type : 'input', 
      name : 'cifs_srv_description',
      placeholder : helptext.cifs_srv_description_placeholder
    },
    {
      type : 'select',
      name : 'cifs_srv_doscharset',
      placeholder : helptext.cifs_srv_doscharset_placeholder,
      options: helptext.cifs_srv_doscharset_options
    },
    {
      type : 'select',
      name : 'cifs_srv_unixcharset',
      placeholder : helptext.cifs_srv_unixcharset_placeholder,
      options: helptext.cifs_srv_unixcharset_options
    },
    {
      type : 'select',
      name : 'cifs_srv_loglevel',
      placeholder : helptext.cifs_srv_loglevel_placeholder,
      options : helptext.cifs_srv_loglevel_options,
    },
    {
      type : 'input', 
      name : 'cifs_srv_syslog',
      placeholder : helptext.cifs_srv_syslog_placeholder
    },
    {
      type : 'input', 
      name : 'cifs_srv_localmaster',
      placeholder : helptext.cifs_srv_localmaster_placeholder
    },
    {
      type : 'input', 
      name : 'cifs_srv_domain_logons',
      placeholder : helptext.cifs_srv_domain_logons_placeholder
    },
    {
      type : 'input', 
      name : 'cifs_srv_timeserver',
      placeholder : helptext.cifs_srv_timeserver_placeholder
    },
    {
      type : 'input', 
      name : 'cifs_srv_guest',
      placeholder : helptext.cifs_srv_guest_placeholder
    },
    {
      type : 'input', 
      name : 'cifs_srv_filemask',
      placeholder : helptext.cifs_srv_filemask_placeholder
    },
    {
      type : 'input', 
      name : 'cifs_srv_dirmask',
      placeholder : helptext.cifs_srv_dirmask_placeholder
    },
    {
      type : 'checkboc', 
      name : 'cifs_srv_nullpw',
      placeholder : helptext.cifs_srv_nullpw_placeholder
    },
    {
      type : 'text', 
      name : 'cifs_srv_smb_options',
      placeholder : helptext.cifs_srv_smb_options_placeholder
    },
    {
      type : 'checkbox',
      name : 'cifs_srv_unixext',
      placeholder : helptext.cifs_srv_unixext_placeholder
    },
    { type: 'checkbox',
      name : 'cifs_srv_zeroconf',
      placeholder : helptext.cifs_srv_zeroconf_placeholder
    },
  { type: 'checkbox',
    name : 'cifs_srv_hostlookup',
    placeholder : helptext.cifs_srv_hostlookup_placeholder
  },
  {
    type : 'select',
    name : 'cifs_srv_min_protocol',
    placeholder : helptext.cifs_srv_min_protocol_placeholder,
    options : []
  },
  {
    type : 'select',
    name : 'cifs_srv_max_protocol',
    placeholder : helptext.cifs_srv_max_protocol_placeholder,
    options : []
  },
  { 
    type: 'checkbox',
    name : 'cifs_srv_allow_execute_always',
    placeholder : helptext.cifs_srv_allow_execute_always_placeholder,
},
{ 
  type: 'checkbox',
  name : 'cifs_srv_obey_pam_restrictions',
  placeholder : helptext.cifs_srv_obey_pam_restrictions_placeholder,
},
{ 
  type: 'checkbox',
  name : 'cifs_srv_ntlmv1_auth',
  placeholder : helptext.cifs_srv_ntlmv1_auth_placeholder,
},
{
  type : 'input',
  name : 'bindips',
  placeholder : helptext.bindips_placeholder,
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
          _.find(this.fieldConfig, {'name' : 'bindips'});
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
