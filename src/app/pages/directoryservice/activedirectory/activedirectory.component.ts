import {  ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel,DynamicTextAreaModel, } from '@ng2-dynamic-forms/core';


import { EntityConfigComponent } from '../../common/entity/entity-config/';
import { GlobalState } from '../../../global.state';
import { RestService, WebSocketService, SystemGeneralService } from '../../../services/';
import * as _ from 'lodash';

import { Subscription } from 'rxjs';

@Component ({
    selector: 'activedirectory',
    template: ` <entity-config [conf]="this"></entity-config>`,
})

export class ActiveDirectoryComponent {
  // Form Layout
  protected resource_name: string = 'directoryservice/activedirectory';
  protected isBasicMode: boolean = true;
  private entityEdit: EntityConfigComponent;

  protected formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
      id: 'ad_domainname',
      label: 'Domain Name'
    }),
    new DynamicInputModel({
      id: 'ad_bindname',
      label: 'Domain Account Name'
    }),
    new DynamicInputModel({
      id: 'ad_bindpw',
      label: 'Domain Account Password',
      inputType: 'password'
    }),
    new DynamicInputModel({
      id: 'ad_dcname',
      label: 'Domain Controller',
    }),
    new DynamicInputModel({
      id: 'ad_gcname',
      label: 'Global Catalog Server'
    }),
    new DynamicInputModel({
      id: 'ad_site',
      label: 'Site Name'
    }),
    new DynamicInputModel({
      id: 'ad_timeout',
      label: 'AD Timeout'
    }),
    new DynamicInputModel({
      id: 'ad_dns_timeout',
      label: 'DNS Timeout'
    }),
    new DynamicSelectModel({
      id: 'ad_ssl',
      label: 'Encryption Mode',
      options: [
        { label: 'Off', value: 'off' },
        { label: 'SSL', value: 'on' },
        { label: 'TLS', value: 'start_tls' }
      ]
    }),
    new DynamicSelectModel({
      id: 'ad_certificate',
      label: 'Certificate',
      options: []
    }),
    new DynamicInputModel({
      id: 'ad_netbiosname_a',
      label: 'Netbios Name',
    }),
    new DynamicCheckboxModel({
      id: 'ad_allow_trusted_doms',
      label: 'Allow Trusted Domains',
    }),
    new DynamicCheckboxModel({
      id: 'ad_disable_freenas_cache',
      label: 'Disable FreeNAS Cache',
    }),
    new DynamicCheckboxModel({
      id: 'ad_enable_monitor',
      label: 'Enable AD Monitoring'
    }),
    new DynamicCheckboxModel({
      id: 'ad_enable',
      label: 'Enable',
    }),
  ];
  
  protected advanced_field: Array<any> = [
    'ad_gcname',
    'ad_dcname',
    'ad_ssl',
    'ad_certificate',
    'ad_netbiosname_a',
    'ad_allow_trusted_doms',
    'ad_disable_freenas_cache',
    'ad_timeout',
    'ad_dns_timeout',
    'ad_enable_monitor',
    'ad_site',
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
  
  protected ad_certificate: DynamicSelectModel<String> 

  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService,  protected ws: WebSocketService, protected formService: DynamicFormService,  protected _injector: Injector, protected _appRef: ApplicationRef, protected _state: GlobalState, protected systemGeneralService: SystemGeneralService) {}

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
    this.systemGeneralService.getCA().subscribe((res) => {
      this.ad_certificate = <DynamicSelectModel<string>>this.formService.findById('ad_certificate', this.formModel);
      res.forEach((item) => {
        this.ad_certificate.add({ label: item.cert_name, value: item.id });
      });
    });
  }

}



