import {Component} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {RestService} from '../../../../services/';

@Component({
  selector : 'webdav-delete',
  template : `<entity-delete [conf]="this"></entity-delete>`
})
export class WebdavDeleteComponent {

  protected resource_name: string = 'sharing/webdav/';
  protected route_success: string[] = [ 'sharing', 'webdav' ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService) {}
}
