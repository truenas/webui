import {  ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel,    DynamicSelectModel,DynamicTextAreaModel, } from '@ng2-dynamic-forms/core';


import { EntityConfigComponent } from '../../common/entity/entity-config/';
import { GlobalState } from '../../../global.state';
import { RestService, WebSocketService, SystemGeneralService } from '../../../services/';
import * as _ from 'lodash';

import { Subscription } from 'rxjs';

@Component ({
    selector: 'ldap',
    template: ` <entity-config [conf]="this"></entity-config>`,
})

export class LdapComponent {
  // Form Layout
  protected resource_name: string = 'directoryservice/ldap';
  protected isBasicMode: boolean = true;
  private entityEdit: EntityConfigComponent;

  protected formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
      id: 'ldap_hostname',
      label: 'Hostname'
    }),
    new DynamicInputModel({
      id: 'ldap_basedn',
      label: 'Base DN'
    }),
    new DynamicInputModel({
      id: 'ldap_binddn',
      label: 'Bind DN'
    }),
    new DynamicInputModel({
      id: 'ldap_bindpw',
      label: 'Bind Password',
      inputType: 'password'
    }),
    new DynamicInputModel({
      id: 'ldap_anonbind',
      label: 'Allow Anonymous Binding',
    }),
    new DynamicInputModel({
      id: 'ldap_usersuffix',
      label: 'User Suffix'
    }),
    new DynamicInputModel({
      id: 'ldap_groupsuffix',
      label: 'Group Suffix'
    }),
    new DynamicInputModel({
      id: 'ldap_passwordsuffix',
      label: 'Password Suffix'
    }),
    new DynamicSelectModel({
      id: 'ldap_ssl',
      label: 'Encryption Mode',
      options: [
        { label: 'Off', value: 'off' },
        { label: 'SSL', value: 'on' },
        { label: 'TLS', value: 'start_tls' }
      ]
    }),
    new DynamicSelectModel({
      id: 'ldap_certificate',
      label: 'Certificate',
      options: []
    }),
    new DynamicInputModel({
      id: 'ldap_netbiosname_a',
      label: 'Netbios Name',
    }),
    new DynamicCheckboxModel({
      id: 'ldap_has_samba_schema',
      label: 'Samba Schema',
    }),
    new DynamicCheckboxModel({
      id: 'ldap_enable',
      label: 'Enable',
    }),
  ];
  
  protected advanced_field: Array<any> = [
    'ldap_anonbind',
    'ldap_usersuffix',
    'ldap_groupsuffix',
    'ldap_passwordsuffix',
    'ldap_ssl',
    'ldap_certificate',
    'ldap_netbiosname_a',
    'ldap_has_samba_schema'
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
  
  protected ldap_certificate: DynamicSelectModel<String> 

  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService,  protected ws: WebSocketService, protected formService: DynamicFormService,  protected _injector: Injector, protected _appRef: ApplicationRef, protected _state: GlobalState, protected systemGeneralService: SystemGeneralService) {}

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
    this.systemGeneralService.getCA().subscribe((res) => {
      this.ldap_certificate = <DynamicSelectModel<string>>this.formService.findById('ldap_certificate', this.formModel);
      res.forEach((item) => {
        this.ldap_certificate.add({ label: item.cert_name, value: item.id });
      });
    });
  }

}



