import {Component} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {RestService} from '../../../../services/rest.service';

@Component({
  selector : 'app-staticroute-delete',
  template : `<entity-delete [conf]="this"></entity-delete>`
})
export class StaticRouteDeleteComponent {

  protected resource_name: string = 'network/staticroute/';
  protected route_success: string[] = [ 'network', 'staticroutes' ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService) {}
}
