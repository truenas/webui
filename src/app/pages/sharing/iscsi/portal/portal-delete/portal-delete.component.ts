import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { RestService } from '../../../services/rest.service';

@Component({
  selector: 'app-iscsi-portal-delete',
  template: `<entity-delete [conf]="this"></entity-delete>`
})
export class PortalDeleteComponent {

  protected resource_name: string = 'services/iscsi/portal';
  protected route_success: string[] = ['sharing', 'iscsi'];

}
