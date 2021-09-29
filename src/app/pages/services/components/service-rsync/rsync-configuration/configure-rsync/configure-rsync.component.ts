import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import helptext from 'app/helptext/services/components/service-rsync';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { RsyncConfigUpdate } from 'app/interfaces/rsync-config.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { WebSocketService } from 'app/services/ws.service';

@Component({
  selector: 'app-configure-rsync',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class CconfigureRYSNCComponent implements FormConfiguration {
  queryCall: 'rsyncd.config' = 'rsyncd.config';
  title = helptext.configureFormTitle;

  route_success: string[] = ['services'];

  fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'port',
      placeholder: helptext.rsyncd_port_placeholder,
      tooltip: helptext.rsyncd_port_tooltip,
      value: helptext.rsyncd_port_value,
    },
    {
      type: 'textarea',
      name: 'auxiliary',
      placeholder: helptext.rsyncd_auxiliary_placeholder,
      tooltip: helptext.rsyncd_auxiliary_tooltip,
    },
  ];

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected ws: WebSocketService,
  ) {}

  afterInit(entityEdit: EntityFormComponent): void {
    entityEdit.submitFunction = (body: RsyncConfigUpdate) => this.ws.call('rsyncd.update', [body]);
  }
}
