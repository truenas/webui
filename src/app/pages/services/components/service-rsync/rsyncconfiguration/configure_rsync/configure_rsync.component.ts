import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { FieldConfig } from '../../../../../common/entity/entity-form/models/field-config.interface';
import { WebSocketService } from "../../../../../../services/ws.service";
import { RestService } from "../../../../../../services/rest.service";
import helptext from '../../../../../../helptext/services/components/service-rsync';

@Component({
  selector : 'app-configure-rsync',
  template : `<entity-form [conf]="this"></entity-form>`
})

export class CconfigureRYSNCComponent {
  protected resource_name = 'services/rsyncd';
  protected route_success: string[] = [ 'services' ];

  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'rsyncd_port',
      placeholder : helptext.rsyncd_port_placeholder,
      tooltip: helptext.rsyncd_port_tooltip,
      value: helptext.rsyncd_port_value
    },
    {
      type : 'textarea',
      name : 'rsyncd_auxiliary',
      placeholder : helptext.rsyncd_auxiliary_placeholder,
      tooltip: helptext.rsyncd_auxiliary_tooltip
    },
  ]

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              ) {}

  afterInit(entityEdit: any) { }
}
