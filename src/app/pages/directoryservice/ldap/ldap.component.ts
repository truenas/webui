import {ApplicationRef, Component, Injector, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';

//import {GlobalState} from '../../../global.state';
import {
  RestService,
  SystemGeneralService,
  WebSocketService
} from '../../../services/';
import {
  FieldConfig
} from '../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'ldap',
  template : `<entity-form [conf]="this"></entity-form>`,
})

export class LdapComponent {
  protected resource_name: string = 'directoryservice/ldap';
  protected isBasicMode: boolean = true;

  public fieldConfig: FieldConfig[] = [
    {type : 'input', name : 'ldap_hostname', placeholder : 'Hostname'},
    {type : 'input', name : 'ldap_basedn', placeholder : 'Base DN'},
    {type : 'input', name : 'ldap_binddn', placeholder : 'Bind DN'},

    {
      type : 'input',
      name : 'ldap_bindpw',
      placeholder : 'Bind Password',
      inputType : 'password',
    },
    {
      type : 'checkbox',
      name : 'ldap_anonbind',
      placeholder : 'Allow Anonymous Binding',
    },
    {type : 'input', name : 'ldap_usersuffix', placeholder : 'User Suffix'},
    {type : 'input', name : 'ldap_groupsuffix', placeholder : 'Group Suffix'},
    {
      type : 'input',
      name : 'ldap_passwordsuffix',
      placeholder : 'Password Suffix'
    },
    {
      type : 'select',
      name : 'ldap_ssl',
      placeholder : 'Encryption Mode',
      options : [
        {label : 'Off', value : 'off'}, {label : 'SSL', value : 'on'},
        {label : 'TLS', value : 'start_tls'}
      ]
    },
    {
      type : 'select',
      name : 'ldap_certificate',
      placeholder : 'Certificate',
      options : []
    },
    {
      type : 'input',
      name : 'ldap_netbiosname_a',
      placeholder : 'Netbios Name',
    },
    {
      type : 'checkbox',
      name : 'ldap_has_samba_schema',
      placeholder : 'Samba Schema',
    },
    {
      type : 'checkbox',
      name : 'ldap_enable',
      placeholder : 'Enable',
    },
  ];

  protected advanced_field: Array<any> = [
    'ldap_anonbind', 'ldap_usersuffix', 'ldap_groupsuffix',
    'ldap_passwordsuffix', 'ldap_ssl', 'ldap_certificate', 'ldap_netbiosname_a',
    'ldap_has_samba_schema'
  ];

  isCustActionVisible(actionId: string) {
    if (actionId === 'advanced_mode' && this.isBasicMode === false) {
      return false;
    } else if (actionId === 'basic_mode' && this.isBasicMode === true) {
      return false;
    }
    return true;
  }

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

  private ldapCertificate: any;

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              //protected _state: GlobalState,
              protected systemGeneralService: SystemGeneralService) {}

  afterInit(entityEdit: any) {
    this.systemGeneralService.getCA().subscribe((res) => {
      this.ldapCertificate =
          _.find(this.fieldConfig, {name : 'ldap_certificate'});
      res.forEach((item) => {
        this.ldapCertificate.options.push(
            {label : item.cert_name, value : item.id});
      });
    });
  }
}
