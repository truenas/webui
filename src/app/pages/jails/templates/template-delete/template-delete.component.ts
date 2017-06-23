import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { RestService } from '../../../../services/rest.service';

@Component({
  selector: 'app-jail-template-delete',
  template: `<entity-delete [conf]="this"></entity-delete>`
})
export class TemplateDeleteComponent {

  protected resource_name: string = 'jails/templates';
  protected route_success: string[] = ['jails', 'templates'];

}