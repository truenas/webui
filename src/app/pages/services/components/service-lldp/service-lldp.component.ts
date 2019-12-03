import { ApplicationRef, Component, Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import helptext from '../../../../helptext/services/components/service-lldp';
import { RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';


@Component({
  selector : 'lldp-edit',
  template : `<entity-form [conf]="this"></entity-form>`
})

export class ServiceLLDPComponent {
  protected queryCall = 'lldp.config';
  protected route_success: string[] = [ 'services' ];

  public fieldConfig: FieldConfig[] = [
    {
      type : 'checkbox',
      name : 'intdesc',
      placeholder : helptext.lldp_intdesc_placeholder,
      tooltip: helptext.lldp_intdesc_tooltip,
    },
    {
      type : 'input',
      name : 'country',
      placeholder : helptext.lldp_country_placeholder,
      tooltip: helptext.lldp_country_tooltip,
    },
    {
      type : 'input',
      name : 'location',
      placeholder : helptext.lldp_location_placeholder,
      tooltip: helptext.lldp_location_tooltip
    },
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              ) {}

  afterInit(entityEdit: EntityFormComponent) {
    entityEdit.submitFunction = body => this.ws.call('lldp.update', [body]) 
  }
}
