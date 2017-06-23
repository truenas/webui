import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { RestService } from '../../../../../services/rest.service';

@Component({
  selector: 'app-iscsi-authorizedaccess-delete',
  template: `<entity-delete [conf]="this"></entity-delete>`
})
export class AuthorizedAccessDeleteComponent {

  protected resource_name: string = 'services/iscsi/authcredential';
  protected route_success: string[] = ['sharing', 'iscsi'];

}
