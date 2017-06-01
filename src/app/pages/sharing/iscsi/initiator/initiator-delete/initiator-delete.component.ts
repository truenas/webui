import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { RestService } from '../../../services/rest.service';

@Component({
  selector: 'app-iscsi-initiator-delete',
  template: `<entity-delete [conf]="this"></entity-delete>`
})
export class InitiatorDeleteComponent {

  protected resource_name: string = 'services/iscsi/authorizedinitiator';
  protected route_success: string[] = ['sharing', 'iscsi'];

}
