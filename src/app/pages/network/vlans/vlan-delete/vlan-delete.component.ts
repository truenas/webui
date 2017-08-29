import {Component} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {RestService} from '../../../../services/rest.service';

@Component({
  selector : 'app-vlan-delete',
  template : `<entity-delete [conf]="this"></entity-delete>`
})
export class VlanDeleteComponent {

  protected resource_name: string = 'network/vlan/';
  protected route_success: string[] = [ 'network', 'vlans' ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService) {}
}
