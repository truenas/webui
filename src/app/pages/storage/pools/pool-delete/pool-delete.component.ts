import {
  ApplicationRef,
  Component,
  Injector,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {RestService} from '../../../../services/rest.service';

@Component({
  selector : 'app-pool-delete',
  template : `<entity-delete [conf]="this"></entity-delete>`
})
export class PoolDeleteComponent {

  protected resource_name: string = 'storage/volume/';
  protected route_success: string[] = [ 'storage', 'pools' ];
}
