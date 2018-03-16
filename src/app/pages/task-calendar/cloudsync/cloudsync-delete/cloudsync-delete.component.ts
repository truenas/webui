import {Component} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector : 'cloudsync-delete',
  template : `<entity-delete [conf]="this"></entity-delete>`
})
export class CloudsyncDeleteComponent {

  protected resource_name: string = '';
  protected deletequery: string = 'backup.delete';
  protected fetchquery: string = 'backup.query';
  protected route_success: string[] = ['tasks', 'cloudsync'];
}
