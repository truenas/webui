import {Component} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {RestService} from '../../../../services/rest.service';

@Component({
  selector : 'app-lagg-delete',
  template : `<entity-delete [conf]="this"></entity-delete>`
})
export class LaggDeleteComponent {

  protected resource_name: string = 'network/lagg/';
  protected route_success: string[] = [ 'network', 'laggs' ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService) {}
}
