import {Component} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {RestService} from '../../../../../services/rest.service';

@Component({
  selector : 'app-iscsi-target-delete',
  template : `<entity-delete [conf]="this"></entity-delete>`
})
export class ExtentDeleteComponent {

  protected resource_name: string = 'services/iscsi/extent';
  protected route_success: string[] = [ 'sharing', 'iscsi' ];
}
