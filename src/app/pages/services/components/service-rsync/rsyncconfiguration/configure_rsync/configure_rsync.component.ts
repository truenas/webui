import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import helptext from '../../../../../../helptext/services/components/service-rsync';
import { RestService } from "../../../../../../services/rest.service";
import { WebSocketService } from "../../../../../../services/ws.service";
import { FieldConfig } from '../../../../../common/entity/entity-form/models/field-config.interface';


@Component({
  selector : 'app-configure-rsync',
  template : `<entity-form [conf]="this"></entity-form>`
})

export class CconfigureRYSNCComponent {
  protected queryCall = 'rsyncd.config';

  protected route_success: string[] = [ 'services' ];

  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'port',
      placeholder : helptext.rsyncd_port_placeholder,
      tooltip: helptext.rsyncd_port_tooltip,
      value: helptext.rsyncd_port_value
    },
    {
      type : 'textarea',
      name : 'auxiliary',
      placeholder : helptext.rsyncd_auxiliary_placeholder,
      tooltip: helptext.rsyncd_auxiliary_tooltip
    },
  ]

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              ) {}

  afterInit(entityEdit: EntityFormComponent) {
    entityEdit.submitFunction = body => this.ws.call('rsyncd.update', [body]);
  }
}
