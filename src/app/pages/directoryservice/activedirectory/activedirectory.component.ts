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
  selector : 'activedirectory',
  template : ` <entity-form [conf]="this"></entity-form>`,
})

export class ActiveDirectoryComponent {
  protected resource_name: string = 'directoryservice/activedirectory';
  protected isBasicMode: boolean = true;

  public fieldConfig: FieldConfig[] = [
    {type : 'input', name : 'ad_domainname', placeholder : 'Domain Name'},
    {type : 'input', name : 'ad_bindname', placeholder : 'Domain Account Name'},
    {
      type : 'input',
      name : 'ad_bindpw',
      placeholder : 'Domain Account Password',
      inputType : 'password'
    },
    {
      type : 'input',
      name : 'ad_dcname',
      placeholder : 'Domain Controller',
    },
    {type : 'input', name : 'ad_gcname', placeholder : 'Global Catalog Server'},
    {type : 'input', name : 'ad_site', placeholder : 'Site Name'},
    {type : 'input', name : 'ad_timeout', placeholder : 'AD Timeout'},
    {type : 'input', name : 'ad_dns_timeout', placeholder : 'DNS Timeout'},
    {
      type : 'select',
      name : 'ad_ssl',
      placeholder : 'Encryption Mode',
      options : [
        {label : 'Off', value : 'off'}, {label : 'SSL', value : 'on'},
        {label : 'TLS', value : 'start_tls'}
      ]
    },
    {
      type : 'select',
      name : 'ad_certificate',
      placeholder : 'Certificate',
      options : []
    },
    {
      type : 'input',
      name : 'ad_netbiosname_a',
      placeholder : 'Netbios Name',
    },
    {
      type : 'checkbox',
      name : 'ad_allow_trusted_doms',
      placeholder : 'Allow Trusted Domains',
    },
    {
      type : 'checkbox',
      name : 'ad_disable_freenas_cache',
      placeholder : 'Disable FreeNAS Cache',
    },
    {
      type : 'checkbox',
      name : 'ad_enable_monitor',
      placeholder : 'Enable AD Monitoring'
    },
    {
      type : 'checkbox',
      name : 'ad_enable',
      placeholder : 'Enable',
    },
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

  isCustActionVisible(actionname: string) {
    if (actionname === 'advanced_mode' && this.isBasicMode === false) {
      return false;
    } else if (actionname === 'basic_mode' && this.isBasicMode === true) {
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

  protected ad_certificate: any;

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              //protected _state: GlobalState,
              protected systemGeneralService: SystemGeneralService) {}

  afterInit(entityEdit: any) {
    this.systemGeneralService.getCA().subscribe((res) => {
      this.ad_certificate = _.find(this.fieldConfig, {name : 'ad_certificate'});
      res.forEach((item) => {
        this.ad_certificate.options.push(
            {label : item.cert_name, value : item.id});
      });
    });
  }
}
