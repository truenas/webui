import { ApplicationRef, Component, Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';

import { RestService, WebSocketService, DialogService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { T } from '../../../../translate-marker';
import helptext from '../../../../helptext/services/components/service-dc';

@Component({
  selector : 'domaincontroller-edit',
  template : ` <entity-form [conf]="this"></entity-form>`,
})

export class ServiceDCComponent {
  protected resource_name: string = 'services/domaincontroller';
  protected route_success: string[] = [ 'services' ];

  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'dc_realm',
      label : helptext.dc_realm_label,
      placeholder : helptext.dc_realm_placeholder,
      tooltip: helptext.dc_realm_tooltip,
      required: true,
      validation : helptext.dc_realm_validation
    },
    {
      type : 'input',
      name : 'dc_domain',
      label : helptext.dc_domain_label,
      placeholder : helptext.dc_domain_placeholder,
      tooltip: helptext.dc_domain_tooltip,
      required: true,
      validation : helptext.dc_domain_validation
    },
    {
      type : 'select',
      name : 'dc_role',
      label : helptext.dc_role_label,
      placeholder : helptext.dc_role_placeholder,
      tooltip: helptext.dc_role_tooltip,
      options : helptext.dc_role_options,
    },
    {
      type : 'input',
      name : 'dc_dns_forwarder',
      label : helptext.dc_dns_forwarder_label,
      placeholder : helptext.dc_dns_forwarder_placeholder,
      tooltip: helptext.dc_dns_forwarder_tooltip,
      required: true,
      validation : helptext.dc_dns_forwarder_validation
    },
    {
      type : 'select',
      name : 'dc_forest_level',
      label : helptext.dc_forest_level_label,
      placeholder : helptext.dc_forest_level_placeholder,
      tooltip: helptext.dc_forest_level_tooltip,
      options : helptext.dc_forest_level_options,
    },
    {
      type : 'input',
      name : 'dc_passwd',
      inputType : 'password',
      placeholder : helptext.dc_passwd_placeholder,
      togglePw: true,
      tooltip: helptext.dc_passwd_tooltip,
      validation : helptext.dc_passwd_validation 
    },
    {
      type : 'input',
      name : 'dc_passwd2',
      inputType : T('password'),
      placeholder : helptext.dc_passwd2_placeholder
    },
    {
      type : 'select',
      name : 'afp_srv_map_acls',
      label : helptext.afp_srv_map_acls_label,
      placeholder : helptext.afp_srv_map_acls_placeholder,
      tooltip : helptext.afp_srv_map_acls_tooltip,
      options : helptext.afp_srv_map_acls_options,
    },
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected dialog: DialogService) {}

  afterInit(entityEdit: any) {
    this.rest.get('directoryservice/activedirectory', {}).subscribe((res) => {
      const data = res.data;
      if (data.ad_enable_monitor) {
        this.dialog.Info(T("WARNING"), helptext.ad_monitor_warning);
      }
    });
   }
}
