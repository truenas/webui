import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { RestService } from '../../../services/rest.service';

@Component({
  selector: 'app-jail-delete',
  template: `<entity-delete [conf]="this"></entity-delete>`
})
export class JailDeleteComponent {

  protected resource_name: string = 'jails/jails';
  protected route_success: string[] = ['jails'];

}
